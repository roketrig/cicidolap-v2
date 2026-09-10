// src/pages/Messages.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, getDocs, orderBy, doc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'

function Messages({ user }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMessages()
    }
  }, [user])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const q = query(
        collection(db, 'messages'),
        where('receiverId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      const messagesList = []
      querySnapshot.forEach((docSnap) => {
        messagesList.push({ id: docSnap.id, ...docSnap.data() })
      })
      setMessages(messagesList)

      // Okunmamış mesajları tek tek değil, tek bir batch ile işaretliyoruz
      // (eskiden her mesaj için ayrı bir await updateDoc çağrısı vardı —
      // hem daha yavaş hem de gereksiz sayıda yazma işlemi yapıyordu).
      const unreadMessages = messagesList.filter(m => !m.read)
      if (unreadMessages.length > 0) {
        const batch = writeBatch(db)
        unreadMessages.forEach((msg) => {
          batch.update(doc(db, 'messages', msg.id), { read: true })
        })
        await batch.commit()
      }
    } catch (error) {
      console.error('Mesajlar yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container text-center py-5">
        <div className="display-1 mb-3">🔒</div>
        <h2>Giriş Yapmalısın</h2>
        <p className="text-muted">Mesajlarını görmek için lütfen giriş yap.</p>
        <Link to="/login" className="btn btn-pink rounded-pill px-4">Giriş Yap</Link>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <div className="card shadow-sm p-4 mb-4">
        <h1 className="fw-bold text-pink-600">💬 Gelen Mesajlar</h1>
        <p className="text-muted mb-0">Sana gönderilen mesajları burada görebilirsin.</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-pink-600"></div>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-1 mb-3">📭</div>
          <h3>Henüz mesajın yok</h3>
          <p className="text-muted">Bir ürüne mesaj gönderildiğinde burada görünecek.</p>
        </div>
      ) : (
        <div className="list-group shadow-sm">
          {messages.map((msg) => (
            <div key={msg.id} className="list-group-item list-group-item-action">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <div className="d-flex gap-2 align-items-center mb-1">
                    <span className="badge bg-light text-dark">📌 Ürün #{msg.productId.slice(0, 8)}</span>
                    <span className={`badge ${msg.read ? 'bg-secondary' : 'bg-success'}`}>
                      {msg.read ? '✅ Okundu' : '🟢 Yeni'}
                    </span>
                  </div>
                  <p className="mb-1">{msg.message}</p>
                  <small className="text-muted">
                    📅 {msg.createdAt?.toDate?.()?.toLocaleString() || 'Tarih bilinmiyor'}
                  </small>
                </div>
              </div>
              <Link to={`/product/${msg.productId}`} className="btn btn-outline-pink btn-sm mt-2">
                Ürünü Görüntüle →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Messages
