// src/pages/Products.jsx
//
// Klasik pazar yeri düzeni: solda filtre paneli (kategori → alt kategori,
// fiyat aralığı, yaş grubu, il), sağda ürün ızgarası. Anasayfadaki kategori
// vitrininden "/products?category=xxx" ile gelindiğinde o kategori zaten
// seçili açılıyor.
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { TURKISH_PROVINCES } from '../data/turkishProvinces'
import { CATEGORIES, AGE_GROUPS } from '../data/categories'
import ProductCard from '../components/ProductCard'
import { useFavorites } from '../hooks/useFavorites'

const PAGE_SIZE = 24

function Products({ user }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [selectedSubcategory, setSelectedSubcategory] = useState('all')
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all')
  const [selectedProvince, setSelectedProvince] = useState('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false) // sadece mobilde etkili
  const { favoriteIds, toggleFavorite } = useFavorites(user)

  useEffect(() => {
    fetchProducts(pageSize)
  }, [pageSize])

  // Anasayfadaki kategori vitrininden "?category=..." ile geldiyse uygula.
  useEffect(() => {
    const fromUrl = searchParams.get('category')
    if (fromUrl && fromUrl !== selectedCategory) {
      setSelectedCategory(fromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProducts = async (size) => {
    try {
      setLoading(true)
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

  const min = minPrice === '' ? null : Number(minPrice)
  const max = maxPrice === '' ? null : Number(maxPrice)

  const filteredProducts = products.filter((p) => {
    if (p.sold) return false
    const categoryMatch = selectedCategory === 'all' || p.category === selectedCategory
    const subcategoryMatch = selectedSubcategory === 'all' || p.subcategory === selectedSubcategory
    const ageGroupMatch = selectedAgeGroup === 'all' || p.ageGroup === selectedAgeGroup
    const provinceMatch = selectedProvince === 'all' || p.province === selectedProvince
    const priceMatch = (min === null || p.price >= min) && (max === null || p.price <= max)
    return categoryMatch && subcategoryMatch && ageGroupMatch && provinceMatch && priceMatch
  })

  const hasActiveFilters = selectedCategory !== 'all' || selectedSubcategory !== 'all' ||
    selectedAgeGroup !== 'all' || selectedProvince !== 'all' || min !== null || max !== null

  const handleSelectCategory = (id) => {
    setSelectedCategory(id)
    setSelectedSubcategory('all')
    setSearchParams(id === 'all' ? {} : { category: id }, { replace: true })
  }

  const clearFilters = () => {
    setSelectedCategory('all')
    setSelectedSubcategory('all')
    setSelectedAgeGroup('all')
    setSelectedProvince('all')
    setMinPrice('')
    setMaxPrice('')
    setSearchParams({}, { replace: true })
  }

  const activeCategory = CATEGORIES.find((c) => c.id === selectedCategory)

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="fw-bold text-pink-600 mb-0">🛍️ Tüm Ürünler</h1>
        {hasActiveFilters && (
          <span className="text-muted small">{filteredProducts.length} sonuç bulundu</span>
        )}
      </div>

      <div className="row g-4">
        {/* SOL FİLTRE PANELİ */}
        <aside className="col-12 col-lg-3">
          <button
            type="button"
            className="btn btn-outline-pink w-100 rounded-pill d-lg-none mb-2"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            🔍 Filtreler {filtersOpen ? '▲' : '▼'}
          </button>

          <div className={`filter-sidebar ${filtersOpen ? '' : 'd-none d-lg-block'}`}>
            {hasActiveFilters && (
              <button type="button" className="filter-clear-btn mb-3" onClick={clearFilters}>
                ✕ Filtreleri Temizle
              </button>
            )}

            {/* Kategori (+ seçiliyse alt kategori) */}
            <div className="filter-group">
              <h6 className="filter-group-title">Kategori</h6>
              <ul className="filter-list">
                <li>
                  <button
                    className={`filter-list-btn ${selectedCategory === 'all' ? 'is-active' : ''}`}
                    onClick={() => handleSelectCategory('all')}
                  >
                    ✨ Tümü
                  </button>
                </li>
                {CATEGORIES.map((cat) => (
                  <li key={cat.id}>
                    <button
                      className={`filter-list-btn ${selectedCategory === cat.id ? 'is-active' : ''}`}
                      onClick={() => handleSelectCategory(cat.id)}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                    {selectedCategory === cat.id && cat.subcategories.length > 0 && (
                      <ul className="filter-sublist">
                        <li>
                          <button
                            className={`filter-list-btn filter-list-btn--sub ${selectedSubcategory === 'all' ? 'is-active' : ''}`}
                            onClick={() => setSelectedSubcategory('all')}
                          >
                            Tümü
                          </button>
                        </li>
                        {cat.subcategories.map((sub) => (
                          <li key={sub.id}>
                            <button
                              className={`filter-list-btn filter-list-btn--sub ${selectedSubcategory === sub.id ? 'is-active' : ''}`}
                              onClick={() => setSelectedSubcategory(sub.id)}
                            >
                              {sub.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Fiyat Aralığı */}
            <div className="filter-group">
              <h6 className="filter-group-title">Fiyat Aralığı (TL)</h6>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="form-control form-control-sm"
                  aria-label="Minimum fiyat"
                />
                <span className="text-muted">–</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="form-control form-control-sm"
                  aria-label="Maksimum fiyat"
                />
              </div>
            </div>

            {/* Yaş Grubu */}
            <div className="filter-group">
              <h6 className="filter-group-title">Yaş Grubu</h6>
              <ul className="filter-list">
                <li>
                  <button
                    className={`filter-list-btn ${selectedAgeGroup === 'all' ? 'is-active' : ''}`}
                    onClick={() => setSelectedAgeGroup('all')}
                  >
                    Tüm Yaşlar
                  </button>
                </li>
                {AGE_GROUPS.map((age) => (
                  <li key={age.id}>
                    <button
                      className={`filter-list-btn ${selectedAgeGroup === age.id ? 'is-active' : ''}`}
                      onClick={() => setSelectedAgeGroup(age.id)}
                    >
                      {age.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* İl */}
            <div className="filter-group">
              <h6 className="filter-group-title">İl</h6>
              <select
                className="form-select form-select-sm"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                <option value="all">Tüm İller</option>
                {TURKISH_PROVINCES.map((il) => (
                  <option key={il} value={il}>{il}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* ÜRÜN IZGARASI */}
        <div className="col-12 col-lg-9">
          {activeCategory && (
            <h2 className="h5 fw-bold text-muted mb-3">
              {activeCategory.emoji} {activeCategory.label}
            </h2>
          )}

          {loading && products.length === 0 ? (
            <div className="text-center py-5">
              <div className="spinner-border text-pink-600"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-5">
              <div className="display-1 mb-3">📭</div>
              <h3>{hasActiveFilters ? 'Bu kriterlere uyan ürün bulunamadı' : 'Henüz ürün yok'}</h3>
            </div>
          ) : (
            <>
              <div className="row g-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="col-12 col-sm-6 col-lg-4">
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
    </div>
  )
}

export default Products
