// src/pages/Favorites.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import ProductCard from '../components/ProductCard'

function Favorites({ user }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchFavoriteProducts()
    }
  }, [user])

  const fetchFavoriteProducts = async () => {
    try {
      setLoading(true)
      const favQuery = query(collection(db, 'favorites'), where('userId', '==', user.uid))
      const favSnap = await getDocs(favQuery)
      const productIds = favSnap.docs.map((d) => d.data().productId)

      const productDocs = await Promise.all(
        productIds.map((id) => getDoc(doc(db, 'products', id)))
      )

      const productsList = productDocs
        .filter((snap) => snap.exists())
        .map((snap) => ({ id: snap.id, ...snap.data() }))

      setProducts(productsList)
    } catch (error) {
      console.error('Favoriler yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (productId) => {
    try {
      await deleteDoc(doc(db, 'favorites', `${user.uid}_${productId}`))
      setProducts((prev) => prev.filter((p) => p.id !== productId))
    } catch (error) {
      console.error('Favori kaldırma hatası:', error)
    }
  }

  if (!user) {
    return (
      <div className="container text-center py-5">
        <div className="display-1 mb-3">🔒</div>
        <h2>Giriş Yapmalısın</h2>
        <p className="text-muted">Favorilerini görmek için lütfen giriş yap.</p>
        <Link to="/login" className="btn btn-pink rounded-pill px-4">Giriş Yap</Link>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <h1 className="fw-bold text-pink-600 mb-4">🤍 Favorilerim</h1>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-pink-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-1 mb-3">💔</div>
          <h3>Henüz favorin yok</h3>
          <p className="text-muted">
            Beğendiğin ürünlerin kartındaki 🤍 ikonuna tıklayarak buraya ekleyebilirsin.
          </p>
          <Link to="/products" className="btn btn-pink rounded-pill px-4 mt-2">Ürünleri Keşfet</Link>
        </div>
      ) : (
        <div className="row g-4">
          {products.map((product) => (
            <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <ProductCard
                product={product}
                isFavorited={true}
                onToggleFavorite={handleRemoveFavorite}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Favorites
