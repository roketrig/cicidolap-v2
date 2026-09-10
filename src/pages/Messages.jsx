// src/pages/Messages.jsx
//
// Konuşma listesi. Kullanıcının katıldığı tüm konuşmalar (hem sattığı
// ürünler için gelen, hem almak istediği ürünler için gönderdiği) canlı
// olarak listeleniyor. Bir satıra tıklayınca /messages/:id thread ekranı
// açılıyor.
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { isUnread, otherParty } from '../chat'

function formatTime(ts) {
  const d = ts?.toDate?.()
  if (!d) return ''
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay
    ? d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function Messages({ user }) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    // Not: "array-contains" + "orderBy" bileşik index gerektirdiği için
    // sıralamayı istemci tarafında yapıyoruz (bu ölçekte fark etmez).
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    )
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => (b.lastAt?.toMillis?.() || 0) - (a.lastAt?.toMillis?.() || 0))
        setConversations(list)
        setLoading(false)
      },
      (error) => {
        console.error('Konuşmalar yüklenirken hata:', error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [user])

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
        <h1 className="fw-bold text-pink-600">💬 Mesajlar</h1>
        <p className="text-muted mb-0">Alıcı ve satıcılarla yaptığın tüm yazışmalar burada.</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-pink-600"></div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-1 mb-3">📭</div>
          <h3>Henüz mesajın yok</h3>
          <p className="text-muted">Bir ürünün sayfasından satıcıya yazınca konuşma burada görünecek.</p>
          <Link to="/products" className="btn btn-pink rounded-pill px-4 mt-2">Ürünleri Keşfet</Link>
        </div>
      ) : (
        <div className="list-group shadow-sm">
          {conversations.map((conv) => {
            const other = otherParty(conv, user.uid)
            const unread = isUnread(conv, user.uid)
            return (
              <Link
                key={conv.id}
                to={`/messages/${conv.id}`}
                className="list-group-item list-group-item-action d-flex gap-3 align-items-center py-3"
              >
                <div className="chat-thumb flex-shrink-0">
                  {conv.productImageUrl ? (
                    <img src={conv.productImageUrl} alt={conv.productTitle} />
                  ) : (
                    <span>🧸</span>
                  )}
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex justify-content-between align-items-baseline gap-2">
                    <span className={`text-truncate ${unread ? 'fw-bold' : 'fw-semibold'}`}>
                      {conv.productTitle || 'Ürün'}
                    </span>
                    <small className="text-muted flex-shrink-0">{formatTime(conv.lastAt)}</small>
                  </div>
                  <div className="d-flex justify-content-between align-items-center gap-2">
                    <span className={`small text-truncate ${unread ? 'text-dark fw-semibold' : 'text-muted'}`}>
                      {conv.lastSenderId === user.uid && 'Sen: '}
                      {conv.lastText || 'Yeni konuşma'}
                    </span>
                    {unread && <span className="chat-unread-dot flex-shrink-0" />}
                  </div>
                  <small className="text-muted">
                    {other.myRole === 'seller' ? '🛒 Alıcı' : '🏷️ Satıcı'}: {other.name}
                  </small>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Messages
