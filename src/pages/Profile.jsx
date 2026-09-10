// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { auth, db } from '../firebase'
import { deleteProductImage } from '../imageUpload'
import { removeListingPhone } from '../contact'
import { displayName } from '../utils'

function Profile({ user }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserProducts()
    }
  }, [user])

  const fetchUserProducts = async () => {
    try {
      setLoading(true)
      const q = query(
        collection(db, 'products'),
        where('userId', '==', user.uid)
      )
      const querySnapshot = await getDocs(q)
      const productsList = []
      querySnapshot.forEach((doc) => {
        productsList.push({ id: doc.id, ...doc.data() })
      })
      setProducts(productsList)
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ürünü silmek istediğine emin misin?')) return
    const product = products.find((p) => p.id === id)
    try {
      await deleteDoc(doc(db, 'products', id))
      removeListingPhone(id) // varsa iletişim kaydını da sil (KVKK)
      setProducts(products.filter(p => p.id !== id))
      setMessage('✅ Ürün başarıyla silindi!')
      setTimeout(() => setMessage(''), 3000)

      // Ürün silindiyse Cloudflare R2'deki görselini de temizle (sessizce
      // başarısız olur — asıl silme işlemi zaten tamamlandı).
      if (product?.imageUrl && auth.currentUser) {
        try {
          const idToken = await auth.currentUser.getIdToken()
          await deleteProductImage(product.imageUrl, idToken)
        } catch (imgErr) {
          console.error('Görsel silinemedi (göz ardı edildi):', imgErr)
        }
      }
    } catch (error) {
      console.error('Silme hatası:', error)
      setMessage('❌ Ürün silinirken hata oluştu.')
    }
  }

  const startEditName = () => {
    setNameInput(auth.currentUser?.displayName || '')
    setEditingName(true)
  }

  const handleSaveName = async (e) => {
    e.preventDefault()
    const trimmed = nameInput.trim()
    if (trimmed.length < 2) {
      setMessage('❌ İsim en az 2 karakter olmalı.')
      return
    }
    setSavingName(true)
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed })
      // Yeni isim uygulama genelinde görünsün diye sayfayı yeniliyoruz.
      window.location.reload()
    } catch (error) {
      console.error('İsim güncellenemedi:', error)
      setMessage('❌ İsim güncellenirken hata oluştu.')
      setSavingName(false)
    }
  }

  const handleToggleSold = async (product) => {
    setUpdatingId(product.id)
    try {
      const newSoldValue = !product.sold
      await updateDoc(doc(db, 'products', product.id), {
        sold: newSoldValue,
        updatedAt: serverTimestamp()
      })
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, sold: newSoldValue } : p))
    } catch (error) {
      console.error('Satıldı durumu güncelleme hatası:', error)
      setMessage('❌ Durum güncellenirken hata oluştu.')
    } finally {
      setUpdatingId(null)
    }
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

  return (
    <div className="container py-4">
      {/* Profil Başlık */}
      <div className="card shadow-sm p-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center">
          <div>
            {editingName ? (
              <form onSubmit={handleSaveName} className="d-flex align-items-center gap-2 mb-1">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  style={{ maxWidth: '220px' }}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Adın"
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
              <h1 className="fw-bold text-pink-600 d-flex align-items-center gap-2">
                👤 {displayName(user)}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-0"
                  onClick={startEditName}
                  title="İsmini düzenle"
                >
                  ✏️
                </button>
              </h1>
            )}
            <p className="text-muted mb-0 small">{user.email}</p>
          </div>
          <div className="d-flex gap-2">
            <Link to="/favorites" className="btn btn-outline-pink rounded-pill px-4">
              🤍 Favorilerim
            </Link>
            <Link to="/add-product" className="btn btn-pink rounded-pill px-4">
              ➕ Yeni Ürün Ekle
            </Link>
          </div>
        </div>
      </div>

      {/* Mesaj */}
      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} alert-dismissible`}>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      <h2 className="fw-bold mb-3">📦 Ürünlerim</h2>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-pink-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-1 mb-3">📭</div>
          <h3>Henüz ürün eklemedin</h3>
          <p className="text-muted">
            İlk ürününü eklemek için <Link to="/add-product" className="text-pink-600 fw-bold">tıkla</Link>
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {products.map((product) => (
            <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <div className="card product-card h-100 position-relative">
                {product.sold && <div className="product-sold-ribbon">Satıldı</div>}
                <div className="product-image d-flex align-items-center justify-content-center bg-light">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      loading="lazy"
                      decoding="async"
                      className="img-fluid h-100 object-fit-cover"
                      style={product.sold ? { opacity: 0.55 } : undefined}
                    />
                  ) : (
                    <span className="display-1 opacity-25">🧸</span>
                  )}
                </div>
                <div className="card-body">
                  <h5 className="card-title fw-bold text-truncate">{product.title}</h5>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="fs-5 fw-bold text-pink-600">
                      {product.price === 0 ? '🎁 Bağış' : `${product.price} TL`}
                    </span>
                    <span className={`badge badge-${product.status}`}>
                      {product.status === 'approved' ? '✅ Onaylı' :
                       product.status === 'rejected' ? '❌ Reddedildi' :
                       '⏳ Bekliyor'}
                    </span>
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <Link to={`/product/${product.id}`} className="btn btn-outline-secondary btn-sm flex-grow-1">Görüntüle</Link>
                    <Link to={`/edit-product/${product.id}`} className="btn btn-outline-primary btn-sm">✏️</Link>
                    <button onClick={() => handleDelete(product.id)} className="btn btn-outline-danger btn-sm">🗑️</button>
                  </div>
                  {product.status === 'approved' && (
                    <button
                      onClick={() => handleToggleSold(product)}
                      disabled={updatingId === product.id}
                      className="btn btn-outline-dark btn-sm w-100 mt-2"
                    >
                      {updatingId === product.id ? '...' : product.sold ? '↩️ Satışı Geri Al' : '🏷️ Satıldı Olarak İşaretle'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Profile
