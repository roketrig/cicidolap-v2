// src/pages/ProductDetail.jsx
import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

function ProductDetail({ user }) {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const docRef = doc(db, 'products', id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() })
      } else {
        setError('Ürün bulunamadı')
      }
    } catch (err) {
      console.error('Ürün detay hatası:', err)
      setError('Ürün yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!user) {
      alert('Mesaj göndermek için lütfen giriş yapın!')
      return
    }
    if (user.uid === product.userId) {
      alert('Kendi ürününe mesaj gönderemezsin!')
      return
    }
    if (!message.trim()) {
      alert('Lütfen bir mesaj yazın!')
      return
    }

    setSending(true)
    try {
      await addDoc(collection(db, 'messages'), {
        productId: product.id,
        senderId: user.uid,
        receiverId: product.userId,
        message: message.trim(),
        createdAt: serverTimestamp(),
        read: false
      })
      setSuccess('✅ Mesaj başarıyla gönderildi!')
      setMessage('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Mesaj gönderme hatası:', err)
      alert('Mesaj gönderilirken bir hata oluştu!')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-pink-600"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container text-center py-5">
        <div className="display-1 mb-3">😕</div>
        <h2>{error || 'Ürün bulunamadı'}</h2>
        <Link to="/" className="btn btn-pink rounded-pill px-4 mt-3">Ana Sayfaya Dön</Link>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <div className="row g-4">
        {/* Ürün Görseli */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
            <div className="product-image" style={{ height: '400px' }}>
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.title} className="img-fluid w-100 h-100 object-fit-cover" />
              ) : (
                <span className="display-1 opacity-25">📸</span>
              )}
            </div>
          </div>
        </div>

        {/* Ürün Bilgileri */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h1 className="fw-bold text-gray-800">{product.title}</h1>
              <span className="fs-3 fw-bold text-pink-600">
                {product.price === 0 ? '🎁 Bağış' : `${product.price} TL`}
              </span>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className="badge bg-light text-dark px-3 py-2">{product.category}</span>
              <span className={`badge badge-${product.condition} px-3 py-2`}>
                {product.condition === 'new' ? 'Yeni' :
                 product.condition === 'like-new' ? 'Az Kullanılmış' :
                 product.condition === 'used' ? 'Kullanılmış' : 'Yıpranmış'}
              </span>
              <span className="badge bg-light text-dark px-3 py-2">📍 {product.city || 'Belirtilmemiş'}</span>
            </div>

            <hr />

            <h6 className="fw-bold">📝 Ürün Açıklaması</h6>
            <p className="text-muted">{product.description}</p>

            <hr />

            <h6 className="fw-bold">📞 İletişim</h6>
            <p className="text-muted mb-1">📱 {product.phone || 'Belirtilmemiş'}</p>
            <p className="text-muted small">👤 {product.userEmail || 'Belirtilmemiş'}</p>

            <hr />

            {/* Mesaj Gönderme */}
            {user && user.uid !== product.userId && (
              <div className="mt-3">
                <h6 className="fw-bold">💬 Satıcıya Mesaj Gönder</h6>
                {success && (
                  <div className="alert alert-success alert-dismissible fade show py-2">
                    {success}
                    <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Bu ürün hakkında mesaj yaz..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    className="btn btn-pink rounded-pill px-4"
                    disabled={sending}
                  >
                    {sending ? 'Gönderiliyor...' : '📤 Gönder'}
                  </button>
                </form>
                <small className="text-muted">Mesajınız satıcıya iletilecek.</small>
              </div>
            )}

            {user && user.uid === product.userId && (
              <div className="alert alert-info mt-3">
                📌 Bu senin ürünün. Satıcı değilsin.
              </div>
            )}

            <div className="d-flex gap-2 mt-3">
              {user && (user.uid === product.userId || user.email === 'admin@cici-dolap.com') && (
                <Link to={`/edit-product/${product.id}`} className="btn btn-outline-primary flex-grow-1 rounded-pill">
                  ✏️ Düzenle
                </Link>
              )}
              <Link to="/" className="btn btn-outline-secondary flex-grow-1 rounded-pill">
                ← Geri Dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail