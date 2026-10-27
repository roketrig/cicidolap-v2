// src/pages/ProductDetail.jsx
import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { ADMIN_EMAIL } from '../constants'
import { useFavorites } from '../hooks/useFavorites'
import { useSafety } from '../context/SafetyContext'
import { startConversation } from '../chat'
import { nameOrEmail, productImages, formatPrice, conditionLabel, timeAgo } from '../utils'
import { categoryLabel, subcategoryLabel, ageGroupLabel } from '../data/categories'
import { CONTACT_PREF, fetchListingPhone, formatPhone, telHref } from '../contact'
import { shareLink } from '../native'
import ProductCard from '../components/ProductCard'
import ReportModal from '../components/ReportModal'
import Icon from '../components/Icon'

function ProductDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { favoriteIds, toggleFavorite } = useFavorites(user)
  const { isBlocked, block, unblock, isBanned } = useSafety()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [soldUpdating, setSoldUpdating] = useState(false)
  const [revealedPhone, setRevealedPhone] = useState('')
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [similar, setSimilar] = useState([])
  const [reportOpen, setReportOpen] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        setActiveImg(0)
        setRevealedPhone('')
        const docSnap = await getDoc(doc(db, 'products', id))
        if (cancelled) return
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() })
        } else {
          setProduct(null)
          setError('Ürün bulunamadı')
        }
      } catch (err) {
        console.error('Ürün detay hatası:', err)
        if (!cancelled) setError('Ürün yüklenirken hata oluştu')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    window.scrollTo(0, 0)
    return () => {
      cancelled = true
    }
  }, [id])

  // Benzer ürünler: aynı kategorideki onaylı ilanlar (tek eşitlik + limit,
  // ek indeks gerektirmez; durum/satıldı/engelli süzmesi istemcide).
  useEffect(() => {
    if (!product?.category) return
    let cancelled = false
    ;(async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'products'), where('category', '==', product.category), where('status', '==', 'approved'), limit(30))
        )
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        if (!cancelled) setSimilar(list)
      } catch (err) {
        console.warn('Benzer ürünler yüklenemedi:', err?.code || err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [product?.id, product?.category])

  const flash = (text) => {
    setToast(text)
    setTimeout(() => setToast(''), 2400)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    if (user.uid === product.userId) return
    if (isBanned) {
      alert('Hesabın kısıtlandığı için mesaj gönderemezsin.')
      return
    }
    if (!message.trim()) return

    setSending(true)
    try {
      const cid = await startConversation({ product, buyer: user, text: message.trim() })
      setMessage('')
      navigate(`/messages/${cid}`)
    } catch (err) {
      console.error('Mesaj gönderme hatası:', err)
      alert('Mesaj gönderilemedi. Satıcı seni engellemiş olabilir ya da bağlantında sorun var.')
    } finally {
      setSending(false)
    }
  }

  const handleRevealPhone = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setPhoneLoading(true)
    try {
      const phone = (await fetchListingPhone(product.id)) || product.phone || ''
      if (phone) setRevealedPhone(phone)
      else alert('Bu ilan için telefon numarası bulunamadı.')
    } finally {
      setPhoneLoading(false)
    }
  }

  const handleToggleSold = async () => {
    setSoldUpdating(true)
    try {
      const newSoldValue = !product.sold
      await updateDoc(doc(db, 'products', product.id), { sold: newSoldValue, updatedAt: serverTimestamp() })
      setProduct((prev) => ({ ...prev, sold: newSoldValue }))
    } catch (err) {
      console.error('Satıldı durumu güncelleme hatası:', err)
      alert('Durum güncellenirken bir hata oluştu.')
    } finally {
      setSoldUpdating(false)
    }
  }

  const handleShare = async () => {
    const result = await shareLink({
      title: product.title,
      text: `${product.title} — ${formatPrice(product.price)} | Cici Dolap`,
      url: window.location.href,
    })
    if (result === 'copied') flash('Bağlantı kopyalandı')
  }

  const handleToggleBlock = async () => {
    const sellerName = nameOrEmail(product.userName, product.userEmail)
    const blocked = isBlocked(product.userId)
    if (!blocked && !window.confirm(`${sellerName} adlı kullanıcıyı engellemek istiyor musun? İlanlarını görmeyeceksin ve sana mesaj gönderemeyecek.`)) return
    try {
      if (blocked) await unblock(product.userId)
      else await block(product.userId, sellerName)
      flash(blocked ? 'Engel kaldırıldı' : 'Kullanıcı engellendi')
    } catch (err) {
      console.error('Engelleme başarısız:', err)
      alert('İşlem yapılamadı. Lütfen tekrar dene.')
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
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

  const images = productImages(product)
  const isOwner = user && user.uid === product.userId
  const isOwnerOrAdmin = user && (isOwner || user.email === ADMIN_EMAIL)
  const isBuyer = user && !isOwner
  const sellerName = nameOrEmail(product.userName, product.userEmail)
  const sellerBlocked = isBlocked(product.userId)
  const phoneOffered = product.contactPref
    ? product.contactPref === CONTACT_PREF.PHONE
    : Boolean(product.phone)
  const isFree = Number(product.price) === 0
  const similarList = similar
    .filter((p) => p.id !== product.id && !p.sold && !isBlocked(p.userId))
    .slice(0, 8)

  const specs = [
    product.brand && ['Marka', product.brand],
    product.size && ['Beden / Ölçü', product.size],
    ['Durum', conditionLabel(product.condition)],
    product.ageGroup && ['Yaş grubu', ageGroupLabel(product.ageGroup)],
    ['Kategori', subcategoryLabel(product.category, product.subcategory)],
    ['Konum', product.city || product.province || 'Belirtilmemiş'],
  ].filter(Boolean)

  return (
    <div className="container py-3 py-md-4 pdp">
      <nav className="pdp-crumbs" aria-label="Sayfa yolu">
        <Link to="/">Ana sayfa</Link>
        <Icon name="chevronRight" size={12} />
        <Link to={`/products?category=${product.category}`}>{categoryLabel(product.category)}</Link>
        {product.subcategory && (
          <>
            <Icon name="chevronRight" size={12} />
            <Link to={`/products?category=${product.category}&sub=${product.subcategory}`}>
              {subcategoryLabel(product.category, product.subcategory)}
            </Link>
          </>
        )}
      </nav>

      <div className="row g-4">
        {/* Galeri */}
        <div className="col-lg-7">
          <div className="pdp-gallery">
            <div className="pdp-stage">
              {product.sold && <div className="product-sold-ribbon">Satıldı</div>}
              {images.length ? (
                <img
                  src={images[activeImg]}
                  alt={product.title}
                  style={product.sold ? { opacity: 0.55 } : undefined}
                />
              ) : (
                <span className="pcard-placeholder pdp-placeholder">🧸</span>
              )}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="pdp-nav pdp-nav--prev"
                    onClick={() => setActiveImg((i) => (i - 1 + images.length) % images.length)}
                    aria-label="Önceki fotoğraf"
                  >
                    <Icon name="chevronLeft" size={20} />
                  </button>
                  <button
                    type="button"
                    className="pdp-nav pdp-nav--next"
                    onClick={() => setActiveImg((i) => (i + 1) % images.length)}
                    aria-label="Sonraki fotoğraf"
                  >
                    <Icon name="chevronRight" size={20} />
                  </button>
                  <span className="pdp-counter">{activeImg + 1} / {images.length}</span>
                </>
              )}
              <div className="pdp-actions">
                {!isOwner && (
                  <button
                    type="button"
                    className={`pdp-icon-btn favorite-inline ${favoriteIds.has(product.id) ? 'is-active' : ''}`}
                    onClick={() => toggleFavorite(product.id)}
                    aria-pressed={favoriteIds.has(product.id)}
                    aria-label={favoriteIds.has(product.id) ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                  >
                    <Icon name="heart" size={20} filled={favoriteIds.has(product.id)} strokeWidth={1.7} />
                  </button>
                )}
                <button type="button" className="pdp-icon-btn" onClick={handleShare} aria-label="Paylaş">
                  <Icon name="share" size={19} />
                </button>
              </div>
            </div>
            {images.length > 1 && (
              <div className="pdp-thumbs">
                {images.map((url, i) => (
                  <button
                    type="button"
                    key={url}
                    className={`pdp-thumb ${i === activeImg ? 'is-active' : ''}`}
                    onClick={() => setActiveImg(i)}
                    aria-label={`Fotoğraf ${i + 1}`}
                  >
                    <img src={url} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Bilgi + satın alma */}
        <div className="col-lg-5">
          <div className="pdp-card">
            {product.brand && <div className="pdp-brand">{product.brand}</div>}
            <h1 className="pdp-title">{product.title}</h1>
            <div className={`pdp-price ${isFree ? 'is-free' : ''}`}>
              {isFree ? '🎁 Bağış — ücretsiz' : formatPrice(product.price)}
            </div>
            <div className="pdp-sub">
              {product.createdAt && <>{timeAgo(product.createdAt)} eklendi</>}
              {product.status === 'pending' && isOwnerOrAdmin && <span className="badge bg-warning text-dark ms-2">Onay bekliyor</span>}
              {product.status === 'rejected' && isOwnerOrAdmin && <span className="badge bg-danger ms-2">Reddedildi</span>}
            </div>

            <dl className="pdp-specs">
              {specs.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="pdp-card mt-3">
            <h2 className="pdp-h">Ürün açıklaması</h2>
            <p className="pdp-desc">{product.description}</p>
          </div>

          {/* Satıcı kartı */}
          <div className="pdp-card mt-3">
            <Link to={`/satici/${product.userId}`} className="pdp-seller">
              <span className="seller-avatar seller-avatar--sm">{sellerName.charAt(0).toLocaleUpperCase('tr')}</span>
              <span className="flex-grow-1 min-w-0">
                <strong className="d-block text-truncate">{sellerName}</strong>
                <small className="text-muted">Satıcının diğer ilanlarına bak</small>
              </span>
              <Icon name="chevronRight" size={18} />
            </Link>

            {/* KVKK: e-posta asla gösterilmez; telefon yalnızca rıza + giriş + tıklama ile. */}
            {isBuyer && phoneOffered && (
              <div className="mt-3">
                {revealedPhone ? (
                  <a href={telHref(revealedPhone)} className="btn btn-outline-pink w-100 rounded-pill">
                    📞 {formatPhone(revealedPhone)}
                  </a>
                ) : (
                  <button type="button" onClick={handleRevealPhone} disabled={phoneLoading} className="btn btn-outline-pink w-100 rounded-pill">
                    {phoneLoading ? 'Yükleniyor...' : '📞 Telefonu Göster'}
                  </button>
                )}
              </div>
            )}

            {isBuyer && !sellerBlocked && !product.sold && (
              <form onSubmit={handleSendMessage} className="mt-3">
                <label className="form-label fw-semibold small mb-1">Satıcıya mesaj</label>
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Merhaba, ürün hâlâ duruyor mu?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={sending}
                    maxLength={500}
                  />
                  <button type="submit" className="btn btn-pink rounded-pill px-3" disabled={sending || !message.trim()}>
                    {sending ? '…' : 'Gönder'}
                  </button>
                </div>
                <div className="pdp-quick">
                  {['Hâlâ satılık mı?', 'Fiyatta pazarlık var mı?', 'Elden teslim mümkün mü?'].map((t) => (
                    <button type="button" key={t} onClick={() => setMessage(t)}>{t}</button>
                  ))}
                </div>
              </form>
            )}

            {!user && (
              <Link to="/login" className="btn btn-pink w-100 rounded-pill mt-3">
                Mesaj göndermek için giriş yap
              </Link>
            )}

            {isBuyer && product.sold && (
              <div className="alert alert-secondary mt-3 mb-0 py-2 small">🏷️ Bu ürün satıldı, artık mesaj gönderilemiyor.</div>
            )}
            {isBuyer && sellerBlocked && (
              <div className="alert alert-secondary mt-3 mb-0 py-2 small">Bu kullanıcıyı engelledin. Mesaj göndermek için önce engeli kaldır.</div>
            )}

            {isOwner && <div className="alert alert-info mt-3 mb-0 py-2 small">📌 Bu senin ilanın.</div>}

            {isOwnerOrAdmin && (
              <div className="d-flex flex-wrap gap-2 mt-3">
                <Link to={`/edit-product/${product.id}`} className="btn btn-outline-primary flex-grow-1 rounded-pill">✏️ Düzenle</Link>
                <button onClick={handleToggleSold} disabled={soldUpdating} className="btn btn-outline-dark flex-grow-1 rounded-pill">
                  {soldUpdating ? '...' : product.sold ? '↩️ Satışı Geri Al' : '🏷️ Satıldı İşaretle'}
                </button>
              </div>
            )}

            <p className="text-muted mt-3 mb-0" style={{ fontSize: '0.78rem' }}>
              İletişim bilgileri <Link to="/gizlilik" className="text-muted text-decoration-underline">KVKK</Link> kapsamında korunur.
            </p>
          </div>

          {/* Güvenli alışveriş ipuçları */}
          <div className="pdp-card pdp-safe mt-3">
            <h2 className="pdp-h"><Icon name="shield" size={18} /> Güvenli alışveriş</h2>
            <ul>
              <li>Ürünü görmeden ve teslim almadan ödeme yapma.</li>
              <li>Buluşmayı kalabalık, aydınlık bir yerde yap.</li>
              <li>Kapora, IBAN ya da kart bilgisi isteyenlere dikkat et.</li>
              <li>Çocuk güvenliği ürünlerini (koltuk, yatak vb.) kullanmadan önce kontrol et.</li>
            </ul>
          </div>

          {/* Şikayet / engelle */}
          {!isOwner && (
            <div className="pdp-report">
              <button type="button" onClick={() => setReportOpen(true)}>
                <Icon name="flag" size={15} /> İlanı şikayet et
              </button>
              {user && (
                <button type="button" onClick={handleToggleBlock}>
                  <Icon name="block" size={15} /> {sellerBlocked ? 'Engeli kaldır' : 'Satıcıyı engelle'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {similarList.length > 0 && (
        <section className="mt-4 mt-md-5">
          <h2 className="section-title">Benzer ürünler</h2>
          <div className="row g-3 g-md-4">
            {similarList.map((p) => (
              <div key={p.id} className="col-6 col-md-4 col-lg-3">
                <ProductCard product={p} isFavorited={favoriteIds.has(p.id)} onToggleFavorite={user ? toggleFavorite : undefined} />
              </div>
            ))}
          </div>
        </section>
      )}

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        user={user}
        type="listing"
        targetId={product.id}
        targetOwnerId={product.userId}
        title="İlanı şikayet et"
      />

      {toast && <div className="cd-toast" role="status">{toast}</div>}
    </div>
  )
}

export default ProductDetail
