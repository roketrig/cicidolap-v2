// src/pages/Home.jsx
import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { Link } from 'react-router-dom'
import { TURKISH_PROVINCES } from '../data/turkishProvinces'
import ProductCard from '../components/ProductCard'
import { useFavorites } from '../hooks/useFavorites'

function Home({ user }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedProvince, setSelectedProvince] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { favoriteIds, toggleFavorite } = useFavorites(user)

  const categories = [
    'Tümü',
    'Yenidoğan (0-3 ay)',
    'Bebek (3-12 ay)',
    'Yürüme (1-2 yaş)',
    'Çocuk (3-6 yaş)',
    'Okul (7-12 yaş)'
  ]

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

  const filteredProducts = products.filter(product => {
    // Satılmış ürünler ana vitrinde görünmüyor (kendi ürünlerin Profilim
    // sayfasında hâlâ görünür ve işaretini geri alabilirsin).
    if (product.sold) return false
    const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory
    const provinceMatch = selectedProvince === 'all' || product.province === selectedProvince
    const searchMatch = searchTerm === '' ||
      product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return categoryMatch && provinceMatch && searchMatch
  })

  return (
    <div>
      {/* HERO BÖLÜMÜ */}
      <div className="hero-gradient py-5 text-center">
        <div className="container">
          <h1 className="display-4 fw-bold text-dark">
            {user ? (
              <>👋 Hoş Geldin, <span className="text-pink-600">{user.email}</span>!</>
            ) : (
              <>CİCİ DOLAP</>
            )}
          </h1>
          <p className="lead text-muted mt-3">
            {user
              ? '✨ Hemen bir ürün ekleyebilir veya ihtiyacın olanı bulabilirsin.'
              : '0-12 yaş çocuk ürünleri için sıcacık ikinci el pazarı.'}
          </p>
          <div className="d-flex gap-3 justify-content-center mt-4 flex-wrap">
            <Link to="/products" className="btn btn-pink rounded-pill px-4 py-2">
              🛍️ Ürünleri Keşfet
            </Link>
            {user ? (
              <Link to="/add-product" className="btn btn-outline-pink rounded-pill px-4 py-2">
                ➕ Ücretsiz İlan Ver
              </Link>
            ) : (
              <Link to="/register" className="btn btn-outline-pink rounded-pill px-4 py-2">
                📝 Hemen Katıl
              </Link>
            )}
          </div>
          {/* İstatistikler */}
          <div className="d-flex flex-wrap justify-content-center gap-4 mt-5">
            <div className="hero-stat-pill px-4 py-2 rounded-pill shadow-sm">
              <span className="fs-3">🛡️</span> Güvenli alışveriş
            </div>
            <div className="hero-stat-pill px-4 py-2 rounded-pill shadow-sm">
              <span className="fs-3">👨‍👩‍👧‍👦</span> 12.000+ mutlu aile
            </div>
            <div className="hero-stat-pill px-4 py-2 rounded-pill shadow-sm">
              <span className="fs-3">♻️</span> Sürdürülebilir
            </div>
          </div>
        </div>
      </div>

      {/* ARAMA ÇUBUĞU + İL FİLTRESİ */}
      <div className="container mt-4">
        <div className="row justify-content-center g-2">
          <div className="col-lg-4 col-md-6">
            <div className="input-group shadow-sm">
              <span className="input-group-text bg-white border-end-0">🔍</span>
              <input
                type="text"
                className="form-control form-control-lg border-start-0"
                placeholder="Ürün ara... (örnek: tulum, bebek, oyuncak)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="btn btn-outline-secondary border-start-0"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <select
              className="form-select form-select-lg shadow-sm"
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
            >
              <option value="all">📍 Tüm İller</option>
              {TURKISH_PROVINCES.map((il) => (
                <option key={il} value={il}>{il}</option>
              ))}
            </select>
          </div>
        </div>
        {(searchTerm || selectedProvince !== 'all') && (
          <p className="text-muted mt-2 text-center">
            {filteredProducts.length} sonuç bulundu
          </p>
        )}
      </div>

      {/* KATEGORİ BUTONLARI */}
      <div className="container mt-4">
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          {categories.map((kat) => (
            <button
              key={kat}
              onClick={() => setSelectedCategory(kat === 'Tümü' ? 'all' : kat)}
              className={`btn rounded-pill px-4 py-2 ${(kat === 'Tümü' && selectedCategory === 'all') || selectedCategory === kat
                  ? 'btn-pink text-white'
                  : 'btn-outline-secondary'
                }`}
            >
              {kat}
            </button>
          ))}
        </div>
      </div>

      {/* ÜRÜN LİSTESİ */}
      <div id="products-list" className="container mt-4 pb-5">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-pink-600" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-5">
            <div className="fs-1 mb-3">📭</div>
            <h3>{searchTerm || selectedProvince !== 'all' ? 'Aradığın kriterde ürün bulunamadı' : 'Henüz ürün yok'}</h3>
            <p className="text-muted">
              {searchTerm || selectedProvince !== 'all' ? (
                'Farklı bir kelime ya da il ile tekrar dene'
              ) : (
                <>
                  İlk ürünü sen ekle!
                  {user ? (
                    <Link to="/add-product" className="text-pink-600 fw-bold"> Hemen ekle</Link>
                  ) : (
                    ' Giriş yaparak ürün ekleyebilirsin.'
                  )}
                </>
              )}
            </p>
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
    </div>
  )
}

export default Home
