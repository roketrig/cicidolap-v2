// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'

function AdminPanel() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchAllProducts()
  }, [])

  const fetchAllProducts = async () => {
    try {
      setLoading(true)
      const querySnapshot = await getDocs(collection(db, 'products'))
      const productsList = []
      querySnapshot.forEach((doc) => {
        productsList.push({ id: doc.id, ...doc.data() })
      })
      productsList.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
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
    try {
      await deleteDoc(doc(db, 'products', id))
      setProducts(products.filter(p => p.id !== id))
      setMessage('🗑️ Ürün silindi!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Silme hatası:', error)
    }
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
                    <div className="fw-bold">{product.title}</div>
                    <small className="text-muted">{product.userEmail}</small>
                  </td>
                  <td>{product.category}</td>
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