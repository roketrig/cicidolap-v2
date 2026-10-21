// src/pages/Home.jsx
//
// Vitrin: kısa karşılama + arama, kategori şeridi, popüler aramalar,
// bağışlanan ürünler, yeni eklenenler, "nasıl çalışır" ve satıcı çağrısı.
// Ayrıntılı filtreleme /products sayfasında (bkz. Products.jsx).
import React, { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { TURKISH_PROVINCES } from '../data/turkishProvinces'
import { CATEGORIES } from '../data/categories'
import { HOW_IT_WORKS, POPULAR_SEARCHES } from '../data/help'
import ProductCard from '../components/ProductCard'
import FloatingBalloons from '../components/FloatingBalloons'
import Icon from '../components/Icon'
import { useFavorites } from '../hooks/useFavorites'
import { useSafety } from '../context/SafetyContext'
import { displayName } from '../utils'

const PAGE_SIZE = 24

function Home({ user }) {
  const navigate = useNavigate()
  const { favoriteIds, toggleFavorite } = useFavorites(user)
  const { isBlocked } = useSafety()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [province, setProvince] = useState('all')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        // Bir fazla çekip daha ürün olup olmadığını anlıyoruz.
        const snap = await getDocs(
          query(
            collection(db, 'products'),
            where('status', '==', 'approved'),
            orderBy('createdAt', 'desc'),
            limit(pageSize + 1)
          )
        )
        if (cancelled) return
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setHasMore(list.length > pageSize)
        setProducts(list.slice(0, pageSize))
      } catch (error) {
        console.error('Ürünler yüklenirken hata:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pageSize])

  const visible = useMemo(
    () => products.filter((p) => !p.sold && !isBlocked(p.userId)),
    [products, isBlocked]
  )
  const donations = useMemo(() => visible.filter((p) => Number(p.price) === 0).slice(0, 8), [visible])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchTerm.trim()) params.set('q', searchTerm.trim())
    if (province !== 'all') params.set('il', province)
    navigate(`/products${params.toString() ? `?${params}` : ''}`)
  }

  const renderGrid = (list) => (
    <div className="row g-3 g-md-4">
      {list.map((product) => (
        <div key={product.id} className="col-6 col-md-4 col-lg-3">
          <ProductCard
            product={product}
            isFavorited={favoriteIds.has(product.id)}
            onToggleFavorite={toggleFavorite}
          />
        </div>
      ))}
    </div>
  )

  return (
    <div>
      {/* HERO */}
      <div className="hero-gradient hero-compact text-center">
        <span className="hero-blob-3" aria-hidden="true" />
        <FloatingBalloons />
        <div className="container hero-content">
          {user ? (
            <>
              <span className="hero-kicker">👋 Hoş geldin</span>
              <h1 className="hero-title">
                Merhaba <span className="text-gradient">{displayName(user)}</span>
              </h1>
              <p className="hero-subtitle">Minik birine yeni bir şey mi arıyorsun, yoksa dolabında yer mi açacaksın?</p>
            </>
          ) : (
            <>
              <span className="hero-kicker">🧸 Anne-babadan anne-babaya</span>
              <h1 className="hero-title">
                Cici <span className="text-gradient">Dolap</span>
              </h1>
              <p className="hero-subtitle">0-12 yaş çocuk ürünleri için ikinci el pazarı. İlan vermek ücretsiz.</p>
            </>
          )}

          <form className="search-card" onSubmit={handleSearch} role="search">
            <div className="search-field">
              <span className="search-icon" aria-hidden="true"><Icon name="search" size={18} /></span>
              <input
                type="search"
                className="search-input"
                placeholder="Ne arıyorsun? (tulum, oyuncak, mont…)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Ürün ara"
              />
            </div>
            <div className="search-sep" />
            <div className="search-field search-field--select">
              <span className="search-icon" aria-hidden="true"><Icon name="pin" size={18} /></span>
              <select
                className="search-select"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                aria-label="İl seç"
              >
                <option value="all">Tüm İller</option>
                {TURKISH_PROVINCES.map((il) => (
                  <option key={il} value={il}>{il}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="search-submit">Ara</button>
          </form>

          <div className="chip-row chip-row--center mt-3">
            {POPULAR_SEARCHES.map((term) => (
              <Link key={term} to={`/products?q=${encodeURIComponent(term)}`} className="chip">
                {term}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* KATEGORİ ŞERİDİ */}
      <div className="container mt-4">
        <div className="category-strip">
          {CATEGORIES.map((cat) => (
            <Link key={cat.id} to={`/products?category=${cat.id}`} className="category-tile">
              <span className="category-tile-icon">{cat.emoji}</span>
              <span className="category-tile-label">{cat.shortLabel || cat.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* BAĞIŞLAR */}
      {donations.length > 0 && (
        <section className="container mt-4 mt-md-5">
          <div className="section-head">
            <h2 className="section-title"><Icon name="gift" size={22} /> Bağışlanan ürünler</h2>
            <Link to="/products?free=1" className="section-link">Tümünü gör</Link>
          </div>
          <div className="h-scroll">
            {donations.map((product) => (
              <div key={product.id} className="h-scroll-item">
                <ProductCard
                  product={product}
                  isFavorited={favoriteIds.has(product.id)}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* YENİ EKLENENLER */}
      <section id="products-list" className="container mt-4 mt-md-5">
        <div className="section-head">
          <h2 className="section-title">Yeni eklenenler</h2>
          <Link to="/products" className="section-link">Tüm ürünler</Link>
        </div>

        {loading && products.length === 0 ? (
          <div className="text-center py-5">
            <div className="spinner-border text-pink-600" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-5">
            <div className="fs-1 mb-3">📭</div>
            <h3 className="h5">Henüz ürün yok</h3>
            <p className="text-muted">
              İlk ürünü sen ekle!
              {user ? (
                <Link to="/add-product" className="text-pink-600 fw-bold"> Hemen ekle</Link>
              ) : (
                ' Giriş yaparak ürün ekleyebilirsin.'
              )}
            </p>
          </div>
        ) : (
          <>
            {renderGrid(visible)}
            {hasMore && (
              <div className="text-center mt-4">
                <button
                  className="btn btn-outline-pink rounded-pill px-4"
                  onClick={() => setPageSize((s) => s + PAGE_SIZE)}
                  disabled={loading}
                >
                  {loading ? 'Yükleniyor...' : 'Daha fazla göster'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* NASIL ÇALIŞIR */}
      <section className="container mt-5">
        <h2 className="section-title text-center mb-3">Nasıl çalışır?</h2>
        <div className="row g-3">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} className="col-md-4">
              <div className="how-card">
                <span className="how-step">{i + 1}</span>
                <span className="how-emoji" aria-hidden="true">{step.emoji}</span>
                <h3 className="h6 fw-bold mb-1">{step.title}</h3>
                <p className="text-muted small mb-0">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SATICI ÇAĞRISI */}
      <section className="container mt-5 pb-5">
        <div className="seller-cta">
          <div>
            <h2 className="h4 fw-bold mb-1">Çocuğunun küçülen eşyalarına yeni bir yuva bul</h2>
            <p className="mb-0">Fotoğrafını çek, ilanını ver — satmak ya da bağışlamak dakikalar sürer.</p>
          </div>
          <Link to={user ? '/add-product' : '/register'} className="btn btn-light btn-lg rounded-pill px-4 fw-bold">
            {user ? 'İlan Ver' : 'Ücretsiz Katıl'}
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
