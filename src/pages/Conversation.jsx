// src/pages/Conversation.jsx
//
// Tek bir konuşmanın thread ekranı: mesaj baloncukları + altta yazma
// kutusu. Mesajlar onSnapshot ile canlı geliyor, ekran açıkken gelen
// mesajlar otomatik "okundu" işaretleniyor.
import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { addMessage, markConversationRead, otherParty } from '../chat'

function formatTime(ts) {
  const d = ts?.toDate?.()
  if (!d) return ''
  return d.toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function Conversation({ user }) {
  const { conversationId } = useParams()
  const [conv, setConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    let unsubscribe = () => {}
    let active = true

    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'conversations', conversationId))
        if (!active) return
        if (!snap.exists()) {
          setError('Konuşma bulunamadı.')
          setLoading(false)
          return
        }
        const data = { id: snap.id, ...snap.data() }
        if (!data.participants?.includes(user.uid)) {
          setError('Bu konuşmaya erişim yetkin yok.')
          setLoading(false)
          return
        }
        setConv(data)

        unsubscribe = onSnapshot(
          query(
            collection(db, 'conversations', conversationId, 'messages'),
            orderBy('createdAt', 'asc')
          ),
          (qs) => {
            setMessages(qs.docs.map((d) => ({ id: d.id, ...d.data() })))
            setLoading(false)
            markConversationRead(conversationId, user.uid)
          },
          (err) => {
            console.error('Mesajlar yüklenirken hata:', err)
            setError('Mesajlar yüklenemedi.')
            setLoading(false)
          }
        )
      } catch (err) {
        console.error('Konuşma yüklenirken hata:', err)
        if (active) {
          setError('Konuşma yüklenemedi.')
          setLoading(false)
        }
      }
    })()

    return () => {
      active = false
      unsubscribe()
    }
  }, [conversationId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText('')
    try {
      await addMessage(conversationId, user.uid, trimmed)
    } catch (err) {
      console.error('Mesaj gönderilemedi:', err)
      setError('Mesaj gönderilemedi. Lütfen tekrar dene.')
      setText(trimmed)
    } finally {
      setSending(false)
    }
  }

  if (!user) {
    return (
      <div className="container text-center py-5">
        <div className="display-1 mb-3">🔒</div>
        <h2>Giriş Yapmalısın</h2>
        <Link to="/login" className="btn btn-pink rounded-pill px-4">Giriş Yap</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-pink-600"></div>
      </div>
    )
  }

  if (error && !conv) {
    return (
      <div className="container text-center py-5">
        <div className="display-1 mb-3">😕</div>
        <h2>{error}</h2>
        <Link to="/messages" className="btn btn-pink rounded-pill px-4 mt-3">← Mesajlara Dön</Link>
      </div>
    )
  }

  const other = otherParty(conv, user.uid)

  return (
    <div className="container py-4">
      <div className="chat-window card shadow-sm border-0 rounded-4 overflow-hidden mx-auto">
        {/* Başlık */}
        <div className="chat-header d-flex align-items-center gap-3 p-3 border-bottom">
          <Link to="/messages" className="btn btn-sm btn-outline-secondary rounded-circle">←</Link>
          <div className="chat-thumb flex-shrink-0">
            {conv.productImageUrl ? (
              <img src={conv.productImageUrl} alt={conv.productTitle} />
            ) : (
              <span>🧸</span>
            )}
          </div>
          <div className="flex-grow-1 min-w-0">
            <Link to={`/product/${conv.productId}`} className="fw-bold text-decoration-none text-dark d-block text-truncate">
              {conv.productTitle || 'Ürün'}
            </Link>
            <small className="text-muted">
              {other.myRole === 'seller' ? '🛒 Alıcı' : '🏷️ Satıcı'}: {other.email || 'bilinmiyor'}
            </small>
          </div>
        </div>

        {/* Mesajlar */}
        <div className="chat-body p-3">
          {messages.length === 0 ? (
            <p className="text-center text-muted my-4">Henüz mesaj yok. İlk mesajı sen yaz 👇</p>
          ) : (
            messages.map((msg) => {
              const mine = msg.senderId === user.uid
              return (
                <div key={msg.id} className={`chat-row ${mine ? 'mine' : 'theirs'}`}>
                  <div className="chat-bubble">
                    <span>{msg.text}</span>
                    <small className="chat-bubble-time">{formatTime(msg.createdAt)}</small>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Yazma kutusu */}
        {error && (
          <div className="alert alert-danger py-2 mb-0 rounded-0 small">{error}</div>
        )}
        <form onSubmit={handleSend} className="chat-input d-flex gap-2 p-3 border-top">
          <input
            type="text"
            className="form-control"
            placeholder="Mesaj yaz..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            disabled={sending}
          />
          <button type="submit" className="btn btn-pink rounded-pill px-4" disabled={sending || !text.trim()}>
            {sending ? '...' : '📤'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Conversation
