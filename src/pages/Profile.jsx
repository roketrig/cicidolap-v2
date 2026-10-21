// src/pages/Profile.jsx
//
// Uygulama tarzı profil: avatar + özet, hızlı menü (favoriler, mesajlar,
// engellenenler, yardım...) ve ilanlarım listesi.
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { updateProfile, sendEmailVerification, sendPasswordResetEmail, signOut } from 'firebase/auth'
import { auth, db } from '../firebase'
import { ADMIN_EMAIL } from '../constants'
import { deleteProductImages } from '../imageUpload'
import { removeListingPhone } from '../contact'
import { displayName, productImages, formatPrice, timeAgo } from '../utils'
import Icon from '../components/Icon'

const STATUS_LABEL = {
  approved: { text: 'Yayında', cls: 'bg-success' },
  rejected: { text: 'Reddedildi', cls: 'bg-danger' },
  pending: { text: 'Onay bekliyor', cls: 'bg-warning text-dark' },
}

function MenuLink({ to, icon, children, badge, danger }) {
  return (
    <Link to={to} className={`menu-row ${danger ? 'is-danger' : ''}`}>
      <span className="menu-row-icon"><Icon name={icon} size={20} /></span>
      <span className="flex-grow-1">{children}</span>
      {badge ? <span className="badge bg-secondary-subtle text-dark rounded-pill">{badge}</span> : null}
      <Icon name="chevronRight" size={16} />
    </Link>
  )
}

function Profile({ user }) {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [tab, setTab] = useState('active') // active | sold | other

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const snap = await getDocs(query(collection(db, 'products'), where('userId', '==', user.uid)))
        if (cancelled) return
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        setProducts(list)
      } catch (error) {
        console.error('Ürünler yüklenirken hata:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const flash = (text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3500)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ürünü silmek istediğine emin misin?')) return
    const product = products.find((p) => p.id === id)
    try {
      await deleteDoc(doc(db, 'products', id))
      removeListingPhone(id) // varsa iletişim kaydını da sil (KVKK)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      flash('✅ Ürün silindi')

      // R2'deki görselleri de temizle (sessizce başarısız olabilir).
      const urls = productImages(product)
      if (urls.length && auth.currentUser) {
        try {
          const idToken = await auth.currentUser.getIdToken()
          await deleteProductImages(urls, idToken)
        } catch (imgErr) {
          console.error('Görseller silinemedi (göz ardı edildi):', imgErr)
        }
      }
    } catch (error) {
      console.error('Silme hatası:', error)
      flash('❌ Ürün silinirken hata oluştu.')
    }
  }

  const handleSaveName = async (e) => {
    e.preventDefault()
    const trimmed = nameInput.trim()
    if (trimmed.length < 2) {
      flash('❌ İsim en az 2 karakter olmalı.')
      return
    }
    setSavingName(true)
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed })
      // Yeni isim uygulama genelinde görünsün diye sayfayı yeniliyoruz.
      window.location.reload()
    } catch (error) {
      console.error('İsim güncellenemedi:', error)
      flash('❌ İsim güncellenirken hata oluştu.')
      setSavingName(false)
    }
  }

  const handleToggleSold = async (product) => {
    setUpdatingId(product.id)
    try {
      const newSoldValue = !product.sold
      await updateDoc(doc(db, 'products', product.id), { sold: newSoldValue, updatedAt: serverTimestamp() })
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, sold: newSoldValue } : p)))
    } catch (error) {
      console.error('Satıldı durumu güncelleme hatası:', error)
      flash('❌ Durum güncellenirken hata oluştu.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleResendVerification = async () => {
    try {
      await sendEmailVerification(auth.currentUser)
      flash('✅ Doğrulama e-postası gönderildi')
    } catch (err) {
      console.error('Doğrulama e-postası gönderilemedi:', err)
      flash('❌ Gönderilemedi, biraz sonra tekrar dene.')
    }
  }

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email)
      flash('✅ Şifre sıfırlama bağlantısı e-postana gönderildi')
    } catch (err) {
      console.error('Şifre sıfırlama gönderilemedi:', err)
      flash('❌ Gönderilemedi, biraz sonra tekrar dene.')
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/')
  }

  if (!user) {
    return (
      <div className="container text-center py-5">
        <div className="display-1 mb-3">🔒</div>
        <h2>Giriş Yapmalısın</h2>
        <p className="text-muted">Profilini görmek için lütfen giriş yap.</p>
        <Link to="/login" className="btn btn-pink rounded-pill px-4">Giriş Yap</Link>
      </div>
    )
  }

  const name = displayName(user)
  const isAdmin = user.email === ADMIN_EMAIL
  const activeList = products.filter((p) => p.status === 'approved' && !p.sold)
  const soldList = products.filter((p) => p.sold)
  const otherList = products.filter((p) => p.status !== 'approved' && !p.sold)
  const shown = tab === 'active' ? activeList : tab === 'sold' ? soldList : otherList

  return (
    <div className="container py-3 py-md-4 profile-page">
      {/* Başlık */}
      <div className="profile-head">
        <div className="seller-avatar seller-avatar--lg">{name.charAt(0).toLocaleUpperCase('tr')}</div>
        <div className="flex-grow-1 min-w-0">
          {editingName ? (
            <form onSubmit={handleSaveName} className="d-flex align-items-center gap-2 flex-wrap">
              <input
                type="text"
                className="form-control form-control-sm"
                style={{ maxWidth: '220px' }}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Adın"
                maxLength={40}
                autoFocus
              />
              <button type="submit" className="btn btn-pink btn-sm rounded-pill px-3" disabled={savingName}>
                {savingName ? '...' : 'Kaydet'}
              </button>
              <button type="button" className="btn btn-link btn-sm text-muted p-0" onClick={() => setEditingName(false)}>
                Vazgeç
              </button>
            </form>
          ) : (
            <h1 className="h4 fw-bold mb-0 d-flex align-items-center gap-2">
              <span className="text-truncate">{name}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-0 flex-shrink-0"
                onClick={() => {
                  setNameInput(auth.currentUser?.displayName || '')
                  setEditingName(true)
                }}
                title="İsmini düzenle"
                aria-label="İsmini düzenle"
              >
                ✏️
              </button>
            </h1>
          )}
          <div className="text-muted small text-truncate">{user.email}</div>
          <div className="profile-stats">
            <span><strong>{activeList.length}</strong> aktif</span>
            <span><strong>{soldList.length}</strong> satılan</span>
          </div>
        </div>
      </div>

      {!user.emailVerified && (
        <div className="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 mt-3 mb-0 small">
          <span>E-posta adresin henüz doğrulanmadı.</span>
          <button type="button" className="btn btn-sm btn-outline-dark rounded-pill" onClick={handleResendVerification}>
            Doğrulama e-postası gönder
          </button>
        </div>
      )}

      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} alert-dismissible mt-3 mb-0 py-2`}>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {/* Menü */}
      <div className="menu-card mt-3">
        <MenuLink to="/add-product" icon="plus">Yeni ilan ver</MenuLink>
        <MenuLink to="/favorites" icon="heart">Favorilerim</MenuLink>
        <MenuLink to="/messages" icon="chat">Mesajlarım</MenuLink>
        <MenuLink to="/engellenenler"icon="block">Engellediklerim</MenuLink>
        {isAdmin && <MenuLink to="/admin" icon="shield">Yönetim paneli</MenuLink>}
      </div>

      <div className="menu-card mt-3">
        <MenuLink to="/yardim" icon="list">Yardım &amp; sık sorulanlar</MenuLink>
        <MenuLink to="/gizlilik" icon="shield">Gizlilik &amp; KVKK</MenuLink>
        <MenuLink to="/kullanim-sartlari" icon="tag">Kullanım şartları</MenuLink>
        <button type="button" className="menu-row" onClick={handlePasswordReset}>
          <span className="menu-row-icon"><Icon name="settings" size={20} /></span>
          <span className="flex-grow-1 text-start">Şifre sıfırlama e-postası gönder</span>
          <Icon name="chevronRight" size={16} />
        </button>
        <button type="button" className="menu-row" onClick={handleSignOut}>
          <span className="menu-row-icon"><Icon name="logout" size={20} /></span>
          <span className="flex-grow-1 text-start">Çıkış yap</span>
          <Icon name="chevronRight" size={16} />
        </button>
      </div>

      {/* İlanlarım */}
      <h2 className="section-title mt-4 mb-2">İlanlarım</h2>
      <div className="seg-tabs mb-3" role="tablist">
        {[
          ['active', `Yayında (${activeList.length})`],
          ['sold', `Satılan (${soldList.length})`],
          ['other', `Diğer (${otherList.length})`],
        ].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-pink-600"></div>
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-4 text-muted">
          <div className="display-4 mb-2">📭</div>
          {products.length === 0 ? (
            <>Henüz ilan eklemedin. <Link to="/add-product" className="text-pink-600 fw-bold">İlk ilanını ver</Link></>
          ) : (
            'Bu sekmede ilan yok.'
          )}
        </div>
      ) : (
        <div className="my-listings">
          {shown.map((product) => {
            const img = productImages(product)[0]
            const st = STATUS_LABEL[product.status] || STATUS_LABEL.pending
            return (
              <div key={product.id} className="my-listing">
                <Link to={`/product/${product.id}`} className="my-listing-thumb">
                  {img ? <img src={img} alt="" loading="lazy" /> : <span>🧸</span>}
                  {product.sold && <em>Satıldı</em>}
                </Link>
                <div className="my-listing-body">
                  <Link to={`/product/${product.id}`} className="my-listing-title">{product.title}</Link>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <strong className="text-pink-600">{formatPrice(product.price)}</strong>
                    {!product.sold && <span className={`badge ${st.cls}`}>{st.text}</span>}
                    <small className="text-muted">{timeAgo(product.createdAt)}</small>
                  </div>
                  <div className="d-flex gap-2 mt-2 flex-wrap">
                    <Link to={`/edit-product/${product.id}`} className="btn btn-outline-primary btn-sm rounded-pill">Düzenle</Link>
                    {product.status === 'approved' && (
                      <button
                        onClick={() => handleToggleSold(product)}
                        disabled={updatingId === product.id}
                        className="btn btn-outline-dark btn-sm rounded-pill"
                      >
                        {updatingId === product.id ? '...' : product.sold ? 'Satışı geri al' : 'Satıldı işaretle'}
                      </button>
                    )}
                    <button onClick={() => handleDelete(product.id)} className="btn btn-outline-danger btn-sm rounded-pill" aria-label="Sil">
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-5 pt-3 border-top text-center">
        <Link to="/hesap-sil" className="text-muted small">
          Hesabımı kalıcı olarak silmek istiyorum
        </Link>
      </div>
    </div>
  )
}

export default Profile
