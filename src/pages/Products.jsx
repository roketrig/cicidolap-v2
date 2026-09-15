// src/pages/Products.jsx
import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { TURKISH_PROVINCES } from '../data/turkishProvinces'
import { CATEGORIES, AGE_GROUPS, subcategoriesFor } from '../data/categories'
import ProductCard from '../components/ProductCard'
import { useFavorites } from '../hooks/useFavorites'

const PAGE_SIZE = 24
const CATEGORY_CHIPS = [{ id: 'all', label: 'Tümü', emoji: '✨' }, ...CATEGORIES]

function Products({ user }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSubcategory, setSelectedSubcategory] = useState('all')
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all')
  const [selectedProvince, setSelectedProvince] = useState('all')
  const { favoriteIds, toggleFavorite } = useFavorites(user)

  useEffect(() => {
    fetchProducts(pageSize)
  }, [pageSize])

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

  const filteredProducts = products.filter((p) => {
    if (p.sold) return false
    const categoryMatch = selectedCategory === 'all' || p.category === selectedCategory
    const subcategoryMatch = selectedSubcategory === 'all' || p.subcategory === selectedSubcategory
    const ageGroupMatch = selectedAgeGroup === 'all' || p.ageGroup === selectedAgeGroup
    const provinceMatch = selectedProvince === 'all' || p.province === selectedProvince
    return categoryMatch && subcategoryMatch && ageGroupMatch && provinceMatch
  })

  const hasActiveFilters = selectedCategory !== 'all' || selectedSubcategory !== 'all' ||
    selectedAgeGroup !== 'all' || selectedProvince !== 'all'

  const handleSelectCategory = (id) => {
    setSelectedCategory(id)
    setSelectedSubcategory('all')
  }

  const subcategoryChips = selectedCategory !== 'all' ? subcategoriesFor(selectedCategory) : []

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

      {/* KATEGORİ BUTONLARI + YAŞ GRUBU */}
      <div className="category-bar d-flex flex-wrap gap-2 align-items-center">
        {CATEGORY_CHIPS.map((cat) => {
          const active = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className={`btn rounded-pill px-3 py-2 category-chip ${active ? 'btn-pink text-white' : 'btn-outline-secondary'}`}
            >
              {cat.emoji} {cat.label}
            </button>
          )
        })}
        <select
          className="age-filter-select"
          value={selectedAgeGroup}
          onChange={(e) => setSelectedAgeGroup(e.target.value)}
          aria-label="Yaş grubuna göre filtrele"
        >
          <option value="all">🍼 Tüm Yaşlar</option>
          {AGE_GROUPS.map((age) => (
            <option key={age.id} value={age.id}>{age.label}</option>
          ))}
        </select>
      </div>

      {/* Alt kategoriler — bir ana kategori seçilince altında açılır */}
      {subcategoryChips.length > 0 && (
        <div className="subcategory-bar d-flex flex-wrap gap-2 mt-2">
          <button
            onClick={() => setSelectedSubcategory('all')}
            className={`btn btn-sm rounded-pill px-3 py-1 subcategory-chip ${selectedSubcategory === 'all' ? 'is-active' : ''}`}
          >
            Tümü
          </button>
          {subcategoryChips.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubcategory(sub.id)}
              className={`btn btn-sm rounded-pill px-3 py-1 subcategory-chip ${selectedSubcategory === sub.id ? 'is-active' : ''}`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
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

export default Products
