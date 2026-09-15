// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, doc, updateDoc, deleteDoc, query, limit } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { ADMIN_EMAIL } from '../constants'
import { deleteProductImage } from '../imageUpload'
import { removeListingPhone } from '../contact'
import { subcategoryLabel } from '../data/categories'

function AdminPanel({ user }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const isAdmin = user?.email === ADMIN_EMAIL

  useEffect(() => {
    if (isAdmin) {
      fetchAllProducts()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  const fetchAllProducts = async () => {
    try {
      setLoading(true)
      // Şimdilik son 500 ürün yeterli; büyürse buraya sayfalama eklenmeli.
      const querySnapshot = await getDocs(query(collection(db, 'products'), limit(500)))
      const productsList = []
      querySnapshot.forEach((docSnap) => {
        productsList.push({ id: docSnap.id, ...docSnap.data() })
      })
      productsList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setProducts(productsList)
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await updateDoc(doc(db, 'products', id), { status: 'approved' })
      setProducts(products.map(p => p.id === id ? { ...p, status: 'approved' } : p))
      setMessage('✅ Ürün onaylandı!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Onaylama hatası:', error)
    }
  }

  const handleReject = async (id) => {
    try {
      await updateDoc(doc(db, 'products', id), { status: 'rejected' })
      setProducts(products.map(p => p.id === id ? { ...p, status: 'rejected' } : p))
      setMessage('❌ Ürün reddedildi!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Reddetme hatası:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ürünü silmek istediğine emin misin?')) return
    const product = products.find((p) => p.id === id)
    try {
      await deleteDoc(doc(db, 'products', id))
      removeListingPhone(id) // varsa iletişim kaydını da sil (KVKK)
      setProducts(products.filter(p => p.id !== id))
      setMessage('🗑️ Ürün silindi!')
      setTimeout(() => setMessage(''), 3000)

      // Admin silince ürünün Cloudflare R2 görselini de temizle. Worker,
      // admin e-postasını tanıdığı için başkasının görselini de silebilir
      // (bkz. cloudflare-worker/src/index.js).
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
    }
  }

  // Bu sayfaya sadece admin hesabı erişebilir. Menüdeki link zaten admin
  // olmayanlardan gizleniyordu, ama URL'yi doğrudan yazan biri (hatta hiç
  // giriş yapmamış biri) bu bileşen daha önce user'ı hiç kontrol etmediği
  // için sayfayı ve onayla/reddet/sil butonlarını görebiliyordu. Asıl
  // güvenlik burada değil, projeye eklenen firestore.rules dosyasındaki
  // kurallarla sağlanmalı (rules Firebase Console'dan yayınlanmadan bu
  // arayüz kontrolü tek başına yeterli değildir).
  if (!isAdmin) {
    return (
      <div className="container text-center py-5">
        <div className="display-1 mb-3">🔒</div>
        <h2>Bu sayfaya erişim yetkin yok</h2>
        <p className="text-muted">Admin paneli sadece yönetici hesabına açıktır.</p>
        <Link to="/" className="btn btn-pink rounded-pill px-4">Ana Sayfaya Dön</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold text-pink-600">🛠️ Admin Paneli</h1>
        <span className="badge bg-secondary">{products.length} ürün</span>
      </div>

      {message && (
        <div className="alert alert-info alert-dismissible">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">Henüz hiç ürün yok</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-bordered">
            <thead className="table-light">
              <tr>
                <th>Ürün</th>
                <th>Kategori</th>
                <th>Fiyat</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="fw-bold">
                      {product.title}
                      {product.sold && <span className="badge bg-dark ms-2">Satıldı</span>}
                    </div>
                    <small className="text-muted">{product.userEmail}</small>
                  </td>
                  <td>{subcategoryLabel(product.category, product.subcategory)}</td>
                  <td className="fw-bold text-pink-600">
                    {product.price === 0 ? '🎁 Bağış' : `${product.price} TL`}
                  </td>
                  <td>
                    <span className={`badge ${
                      product.status === 'approved' ? 'bg-success' :
                      product.status === 'rejected' ? 'bg-danger' :
                      'bg-warning text-dark'
                    }`}>
                      {product.status === 'approved' ? '✅ Onaylı' :
                       product.status === 'rejected' ? '❌ Reddedildi' :
                       '⏳ Bekliyor'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {product.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(product.id)} className="btn btn-success btn-sm">Onayla</button>
                          <button onClick={() => handleReject(product.id)} className="btn btn-danger btn-sm">Reddet</button>
                        </>
                      )}
                      <button onClick={() => handleDelete(product.id)} className="btn btn-outline-secondary btn-sm">🗑️ Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
