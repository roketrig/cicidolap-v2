// src/pages/Products.jsx
import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { TURKISH_PROVINCES } from '../data/turkishProvinces'
import ProductCard from '../components/ProductCard'

function Products({ user }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProvince, setSelectedProvince] = useState('all')
  const [favoriteIds, setFavoriteIds] = useState(new Set())

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (user) {
      fetchFavorites()
    } else {
      setFavoriteIds(new Set())
    }
  }, [user])

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

  const fetchFavorites = async () => {
    try {
      const q = query(collection(db, 'favorites'), where('userId', '==', user.uid))
      const snap = await getDocs(q)
      setFavoriteIds(new Set(snap.docs.map((d) => d.data().productId)))
    } catch (error) {
      console.error('Favoriler yüklenirken hata:', error)
    }
  }

  const handleToggleFavorite = async (productId) => {
    if (!user) {
      alert('Favorilere eklemek için lütfen giriş yapın!')
      return
    }
    const favId = `${user.uid}_${productId}`
    const favRef = doc(db, 'favorites', favId)
    const alreadyFavorited = favoriteIds.has(productId)
    try {
      if (alreadyFavorited) {
        await deleteDoc(favRef)
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })
      } else {
        await setDoc(favRef, { userId: user.uid, productId, createdAt: serverTimestamp() })
        setFavoriteIds((prev) => new Set(prev).add(productId))
      }
    } catch (error) {
      console.error('Favori güncelleme hatası:', error)
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
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Products
