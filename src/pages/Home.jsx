// src/pages/Home.jsx
import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { Link } from 'react-router-dom'
import { TURKISH_PROVINCES } from '../data/turkishProvinces'
import ProductCard from '../components/ProductCard'
import { useFavorites } from '../hooks/useFavorites'
import { displayName } from '../utils'

const PAGE_SIZE = 24

function Home({ user }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(false)
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
    fetchProducts(pageSize)
  }, [pageSize])

  const fetchProducts = async (size) => {
    try {
      setLoading(true)
      // Bir fazla çekip ("size + 1") daha ürün olup olmadığını anlıyoruz,
      // fazlalığı listeye eklemiyoruz.
      const q = query(
        collection(db, 'products'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc'),
        limit(size + 1)
      )
      const querySnapshot = await getDocs(q)
      const productsList = []
      querySnapshot.forEach((doc) => {
        productsList.push({ id: doc.id, ...doc.data() })
      })
      setHasMore(productsList.length > size)
      setProducts(productsList.slice(0, size))
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
      <div className="hero-gradient text-center">
        <div className="container hero-content">
          {user ? (
            <>
              <span className="hero-kicker">👋 Hoş geldin</span>
              <h1 className="hero-title">
                Merhaba <span className="text-gradient">{displayName(user)}</span>
              </h1>
              <p className="hero-subtitle">
                Dolabında yer açacak bir şey mi var, yoksa minik birine yeni bir şey mi arıyorsun?
              </p>
              <div className="hero-actions">
                <Link to="/add-product" className="btn btn-pink btn-lg rounded-pill px-4">
                  ➕ Ürün Ekle
                </Link>
                <Link to="/products" className="btn btn-outline-pink btn-lg rounded-pill px-4">
                  🛍️ Ürünleri Keşfet
                </Link>
                <Link to="/messages" className="btn btn-ghost-pink btn-lg rounded-pill px-4">
                  💬 Mesajlarım
                </Link>
              </div>
            </>
          ) : (
            <>
              <span className="hero-kicker">🧸 Anne-babadan anne-babaya</span>
              <h1 className="hero-title">
                Cici <span className="text-gradient">Dolap</span>
              </h1>
              <p className="hero-subtitle">
                0-12 yaş çocuk ürünleri için sıcacık bir ikinci el pazarı.
              </p>
              <div className="hero-actions">
                <Link to="/products" className="btn btn-pink btn-lg rounded-pill px-4">
                  🛍️ Ürünleri Keşfet
                </Link>
                <Link to="/register" className="btn btn-outline-pink btn-lg rounded-pill px-4">
                  📝 Ücretsiz Katıl
                </Link>
              </div>
              <p className="hero-note">Ücretsiz ilan · Türkiye geneli · Aracısız iletişim</p>
            </>
          )}
        </div>
      </div>

      {/* ARAMA KARTI — hero'nun alt kenarına biniyor */}
      <div className="container">
        <div className="search-card">
          <div className="search-field">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Ne arıyorsun? (tulum, oyuncak, mont…)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Ürün ara"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Aramayı temizle"
              >
                ✕
              </button>
            )}
          </div>
          <div className="search-sep" />
          <div className="search-field search-field--select">
            <span className="search-icon" aria-hidden="true">📍</span>
            <select
              className="search-select"
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              aria-label="İl seç"
            >
              <option value="all">Tüm İller</option>
              {TURKISH_PROVINCES.map((il) => (
                <option key={il} value={il}>{il}</option>
              ))}
            </select>
          </div>
        </div>
        {(searchTerm || selectedProvince !== 'all') && (
          <p className="text-muted mt-3 text-center small">
            {filteredProducts.length} sonuç bulundu
          </p>
        )}
      </div>

      {/* KATEGORİ BUTONLARI */}
      <div className="container mt-4">
        <div className="category-bar d-flex flex-wrap gap-2 justify-content-center">
          {categories.map((kat) => {
            const active = (kat === 'Tümü' && selectedCategory === 'all') || selectedCategory === kat
            return (
              <button
                key={kat}
                onClick={() => setSelectedCategory(kat === 'Tümü' ? 'all' : kat)}
                className={`btn rounded-pill px-4 py-2 category-chip ${active ? 'btn-pink text-white' : 'btn-outline-secondary'}`}
              >
                {kat}
              </button>
            )
          })}
        </div>
      </div>

      {/* ÜRÜN LİSTESİ */}
      <div id="products-list" className="container mt-4 pb-5">
        {loading && products.length === 0 ? (
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
          <>
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
            {hasMore && (
              <div className="text-center mt-4">
                <button
                  className="btn btn-outline-pink rounded-pill px-4"
                  onClick={() => setPageSize((s) => s + PAGE_SIZE)}
                  disabled={loading}
                >
                  {loading ? 'Yükleniyor...' : '⬇️ Daha fazla göster'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Home
