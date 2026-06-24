// src/pages/Products.jsx
import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { Link } from 'react-router-dom'

function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const q = query(
        collection(db, 'products'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
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

  return (
    <div className="container py-4">
      <h1 className="fw-bold text-pink-600 mb-4">🛍️ Tüm Ürünler</h1>
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-pink-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-1 mb-3">📭</div>
          <h3>Henüz ürün yok</h3>
        </div>
      ) : (
        <div className="row g-4">
          {products.map((product) => (
            <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <div className="card product-card h-100">
                <div className="product-image d-flex align-items-center justify-content-center bg-light">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title} className="img-fluid h-100 object-fit-cover" />
                  ) : (
                    <span className="display-1 opacity-25">🧸</span>
                  )}
                </div>
                <div className="card-body">
                  <h5 className="card-title fw-bold text-truncate">{product.title}</h5>
                  <p className="card-text small text-muted">{product.category}</p>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="fs-5 fw-bold text-pink-600">
                      {product.price === 0 ? '🎁 Bağış' : `${product.price} TL`}
                    </span>
                    <span className={`badge badge-${product.condition}`}>
                      {product.condition === 'new' ? 'Yeni' :
                       product.condition === 'like-new' ? 'Az Kullanılmış' :
                       product.condition === 'used' ? 'Kullanılmış' : 'Yıpranmış'}
                    </span>
                  </div>
                  <Link to={`/product/${product.id}`} className="btn btn-pink w-100 mt-3 rounded-pill">
                    ✨ İncele
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Products