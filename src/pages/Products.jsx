// src/pages/Products.jsx
import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { TURKISH_PROVINCES } from '../data/turkishProvinces'
import ProductCard from '../components/ProductCard'
import { useFavorites } from '../hooks/useFavorites'

function Products({ user }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProvince, setSelectedProvince] = useState('all')
  const { favoriteIds, toggleFavorite } = useFavorites(user)

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

  const filteredProducts = products.filter((p) => {
    if (p.sold) return false
    return selectedProvince === 'all' || p.province === selectedProvince
  })

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="fw-bold text-pink-600 mb-0">🛍️ Tüm Ürünler</h1>
        <select
          className="form-select shadow-sm"
          style={{ maxWidth: '220px' }}
          value={selectedProvince}
          onChange={(e) => setSelectedProvince(e.target.value)}
        >
          <option value="all">📍 Tüm İller</option>
          {TURKISH_PROVINCES.map((il) => (
            <option key={il} value={il}>{il}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-pink-600"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-1 mb-3">📭</div>
          <h3>{selectedProvince === 'all' ? 'Henüz ürün yok' : 'Bu ilde ürün bulunamadı'}</h3>
        </div>
      ) : (
        <div className="row g-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <ProductCard
                product={product}
                isFavorited={favoriteIds.has(product.id)}
                onToggleFavorite={toggleFavorite}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Products
