// src/pages/ProductDetail.jsx
import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { ADMIN_EMAIL } from '../constants'
import { useFavorites } from '../hooks/useFavorites'
import { startConversation } from '../chat'

// Telefon numarasını wa.me linki için Türkiye formatına çevirir:
// "05551234567" / "5551234567" -> "905551234567"
function toWhatsAppNumber(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('90')) return digits
  if (digits.startsWith('0')) return `90${digits.slice(1)}`
  return `90${digits}`
}

function ProductDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { favoriteIds, toggleFavorite } = useFavorites(user)
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [soldUpdating, setSoldUpdating] = useState(false)

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
      // Konuşmayı başlat (ya da varsa devam ettir), sonra thread ekranına git.
      const cid = await startConversation({
        product,
        buyer: user,
        text: message.trim(),
      })
      setMessage('')
      navigate(`/messages/${cid}`)
    } catch (err) {
      console.error('Mesaj gönderme hatası:', err)
      alert('Mesaj gönderilirken bir hata oluştu!')
    } finally {
      setSending(false)
    }
  }

  const handleToggleSold = async () => {
    setSoldUpdating(true)
    try {
      const newSoldValue = !product.sold
      await updateDoc(doc(db, 'products', product.id), {
        sold: newSoldValue,
        updatedAt: serverTimestamp()
      })
      setProduct((prev) => ({ ...prev, sold: newSoldValue }))
    } catch (err) {
      console.error('Satıldı durumu güncelleme hatası:', err)
      alert('Durum güncellenirken bir hata oluştu.')
    } finally {
      setSoldUpdating(false)
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

  const isOwnerOrAdmin = user && (user.uid === product.userId || user.email === ADMIN_EMAIL)
  const whatsAppNumber = toWhatsAppNumber(product.phone)

  return (
    <div className="container py-4">
      <div className="row g-4">
        {/* Ürün Görseli */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden position-relative">
            {product.sold && <div className="product-sold-ribbon">Satıldı</div>}
            {user && user.uid !== product.userId && (
              <button
                type="button"
                className={`favorite-btn ${favoriteIds.has(product.id) ? 'is-active' : ''}`}
                onClick={() => toggleFavorite(product.id)}
                aria-pressed={favoriteIds.has(product.id)}
                aria-label={favoriteIds.has(product.id) ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                title={favoriteIds.has(product.id) ? 'Favorilerden çıkar' : 'Favorilere ekle'}
              >
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path
                    d="M12 20.7s-6.75-4.28-9.4-8.02C.86 9.9 1.73 6.4 4.8 5.5c1.94-.57 3.94.33 5.2 1.96C11.26 5.83 13.26 4.93 15.2 5.5c3.07.9 3.94 4.4 2.2 7.18C18.75 16.42 12 20.7 12 20.7z"
                    fill={favoriteIds.has(product.id) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            <div className="product-image" style={{ height: '400px' }}>
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="img-fluid w-100 h-100 object-fit-cover"
                  style={product.sold ? { opacity: 0.55 } : undefined}
                />
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
              <h1 className="fw-bold text-dark">{product.title}</h1>
              <span className="fs-3 fw-bold text-pink-600">
                {product.price === 0 ? '🎁 Bağış' : `${product.price} TL`}
              </span>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3">
              {product.sold && <span className="badge bg-dark px-3 py-2">Satıldı</span>}
              <span className="badge bg-light text-dark px-3 py-2">{product.category}</span>
              <span className={`badge badge-${product.condition} px-3 py-2`}>
                {product.condition === 'new' ? 'Yeni' :
                 product.condition === 'like-new' ? 'Az Kullanılmış' :
                 product.condition === 'used' ? 'Kullanılmış' : 'Yıpranmış'}
              </span>
              <span className="badge bg-light text-dark px-3 py-2">📍 {product.city || product.province || 'Belirtilmemiş'}</span>
            </div>

            <hr />

            <h6 className="fw-bold">📝 Ürün Açıklaması</h6>
            <p className="text-muted">{product.description}</p>

            <hr />

            <h6 className="fw-bold">📞 İletişim</h6>
            {/* İletişim bilgileri artık sadece giriş yapmış kullanıcılara
                gösteriliyor. Eskiden telefon/e-posta giriş yapmamış herkese
                (arama motorları dahil) açıktı — spam/scraping riski
                taşıyordu. */}
            {user ? (
              <>
                <p className="text-muted mb-1">📱 {product.phone || 'Belirtilmemiş'}</p>
                <p className="text-muted small mb-2">👤 {product.userEmail || 'Belirtilmemiş'}</p>
                {whatsAppNumber && user.uid !== product.userId && (
                  <a
                    href={`https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(`Merhaba, Cici Dolap'ta "${product.title}" ilanınla ilgileniyorum.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-pink btn-sm rounded-pill"
                  >
                    💬 WhatsApp'tan Yaz
                  </a>
                )}
              </>
            ) : (
              <p className="text-muted small mb-0">
                🔒 İletişim bilgilerini görmek için <Link to="/login" className="text-pink-600 fw-bold">giriş yap</Link>.
              </p>
            )}

            <hr />

            {/* Mesaj Gönderme */}
            {user && user.uid !== product.userId && !product.sold && (
              <div className="mt-3">
                <h6 className="fw-bold">💬 Satıcıya Mesaj Gönder</h6>
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
                <small className="text-muted">Mesajı gönderince yazışma ekranına yönlendirileceksin.</small>
              </div>
            )}

            {user && user.uid !== product.userId && product.sold && (
              <div className="alert alert-secondary mt-3 mb-0">
                🏷️ Bu ürün satıldı, artık mesaj gönderilemiyor.
              </div>
            )}

            {!user && (
              <p className="text-muted small">
                Satıcıya mesaj göndermek için <Link to="/login" className="text-pink-600 fw-bold">giriş yap</Link>.
              </p>
            )}

            {user && user.uid === product.userId && (
              <div className="alert alert-info mt-3">
                📌 Bu senin ürünün. Satıcı değilsin.
              </div>
            )}

            <div className="d-flex flex-wrap gap-2 mt-3">
              {isOwnerOrAdmin && (
                <Link to={`/edit-product/${product.id}`} className="btn btn-outline-primary flex-grow-1 rounded-pill">
                  ✏️ Düzenle
                </Link>
              )}
              {isOwnerOrAdmin && (
                <button
                  onClick={handleToggleSold}
                  disabled={soldUpdating}
                  className="btn btn-outline-dark flex-grow-1 rounded-pill"
                >
                  {soldUpdating ? '...' : product.sold ? '↩️ Satışı Geri Al' : '🏷️ Satıldı Olarak İşaretle'}
                </button>
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
