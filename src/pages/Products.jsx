// src/pages/Products.jsx
//
// Klasik pazar yeri düzeni: solda filtre paneli (kategori → alt kategori,
// fiyat, durum, yaş grubu, il), sağda ürün ızgarası. Tüm filtreler URL'de
// tutuluyor (?category=&sub=&q=&il=&age=&min=&max=&cond=&free=1&sort=) —
// böylece header aramasından, kategori menüsünden ve paylaşılan bağlantılardan
// aynı sayfa filtreli açılıyor, geri tuşu da doğal çalışıyor.
import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { TURKISH_PROVINCES } from '../data/turkishProvinces'
import { CATEGORIES, AGE_GROUPS, categoryLabel, subcategoryLabel } from '../data/categories'
import { CONDITION_LABELS } from '../utils'
import ProductCard from '../components/ProductCard'
import Icon from '../components/Icon'
import { useFavorites } from '../hooks/useFavorites'
import { useSafety } from '../context/SafetyContext'

const PAGE_SIZE = 24
// Filtre/arama etkinken sunucu tarafında ek indeks gerektirmemek için daha
// büyük bir parti çekip istemcide süzüyoruz.
const FILTERED_FETCH = 300

const SORTS = [
  { id: 'new', label: 'En yeni' },
  { id: 'price-asc', label: 'Fiyat: düşükten yükseğe' },
  { id: 'price-desc', label: 'Fiyat: yüksekten düşüğe' },
]

const norm = (s) => (s || '').toLocaleLowerCase('tr')

function Products({ user }) {
  const [params, setParams] = useSearchParams()
  const { favoriteIds, toggleFavorite } = useFavorites(user)
  const { isBlocked } = useSafety()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false) // sadece mobilde etkili

  const category = params.get('category') || 'all'
  const sub = params.get('sub') || 'all'
  const q = params.get('q') || ''
  const province = params.get('il') || 'all'
  const age = params.get('age') || 'all'
  const minPrice = params.get('min') || ''
  const maxPrice = params.get('max') || ''
  const cond = params.get('cond') || 'all'
  const freeOnly = params.get('free') === '1'
  const sort = params.get('sort') || 'new'

  const setParam = (updates) => {
    const next = new URLSearchParams(params)
    Object.entries(updates).forEach(([k, v]) => {
      if (v === '' || v === 'all' || v === false || v == null) next.delete(k)
      else next.set(k, v === true ? '1' : v)
    })
    setParams(next, { replace: true })
  }

  const min = minPrice === '' ? null : Number(minPrice)
  const max = maxPrice === '' ? null : Number(maxPrice)
  const hasActiveFilters = Boolean(
    category !== 'all' || sub !== 'all' || q || province !== 'all' || age !== 'all' ||
    min !== null || max !== null || cond !== 'all' || freeOnly
  )

  const fetchSize = hasActiveFilters ? FILTERED_FETCH : pageSize

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const snap = await getDocs(
          query(
            collection(db, 'products'),
            where('status', '==', 'approved'),
            orderBy('createdAt', 'desc'),
            limit(fetchSize + 1)
          )
        )
        if (cancelled) return
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setHasMore(list.length > fetchSize)
        setProducts(list.slice(0, fetchSize))
      } catch (error) {
        console.error('Ürünler yüklenirken hata:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fetchSize])

  const filteredProducts = useMemo(() => {
    const needle = norm(q).trim()
    const list = products.filter((p) => {
      if (p.sold || isBlocked(p.userId)) return false
      if (category !== 'all' && p.category !== category) return false
      if (sub !== 'all' && p.subcategory !== sub) return false
      if (age !== 'all' && p.ageGroup !== age) return false
      if (province !== 'all' && p.province !== province) return false
      if (cond !== 'all' && p.condition !== cond) return false
      if (freeOnly && Number(p.price) !== 0) return false
      if (min !== null && p.price < min) return false
      if (max !== null && p.price > max) return false
      if (needle) {
        const hay = norm(
          [p.title, p.brand, p.description, categoryLabel(p.category), subcategoryLabel(p.category, p.subcategory)].join(' ')
        )
        if (!needle.split(/\s+/).every((w) => hay.includes(w))) return false
      }
      return true
    })
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
    return list
  }, [products, isBlocked, q, category, sub, age, province, cond, freeOnly, min, max, sort])

  const activeCategory = CATEGORIES.find((c) => c.id === category)

  const chips = [
    q && { label: `“${q}”`, clear: { q: '' } },
    activeCategory && { label: activeCategory.label, clear: { category: '', sub: '' } },
    sub !== 'all' && activeCategory && { label: subcategoryLabel(category, sub), clear: { sub: '' } },
    age !== 'all' && { label: AGE_GROUPS.find((a) => a.id === age)?.label || age, clear: { age: '' } },
    province !== 'all' && { label: province, clear: { il: '' } },
    cond !== 'all' && { label: CONDITION_LABELS[cond], clear: { cond: '' } },
    freeOnly && { label: 'Sadece bağış', clear: { free: '' } },
    (min !== null || max !== null) && { label: `${min ?? 0} – ${max ?? '∞'} TL`, clear: { min: '', max: '' } },
  ].filter(Boolean)

  const clearFilters = () => setParams({}, { replace: true })

  return (
    <div className="container py-3 py-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
        <div>
          <h1 className="h3 fw-bold text-pink-600 mb-0">
            {q ? `“${q}” için sonuçlar` : activeCategory ? `${activeCategory.emoji} ${activeCategory.label}` : 'Tüm Ürünler'}
          </h1>
          <span className="text-muted small">
            {loading && products.length === 0 ? 'Yükleniyor…' : `${filteredProducts.length}${hasMore && !hasActiveFilters ? '+' : ''} ürün`}
          </span>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button
            type="button"
            className="btn btn-outline-pink rounded-pill d-lg-none btn-sm"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
          >
            <Icon name="list" size={16} /> Filtreler{chips.length > 0 && ` (${chips.length})`}
          </button>
          <select
            className="form-select form-select-sm sort-select"
            value={sort}
            onChange={(e) => setParam({ sort: e.target.value === 'new' ? '' : e.target.value })}
            aria-label="Sıralama"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="chip-row mb-3">
          {chips.map((c) => (
            <button key={c.label} type="button" className="chip chip--active" onClick={() => setParam(c.clear)}>
              {c.label} <Icon name="close" size={12} strokeWidth={2.6} />
            </button>
          ))}
          <button type="button" className="chip chip--ghost" onClick={clearFilters}>Tümünü temizle</button>
        </div>
      )}

      <div className="row g-4">
        {/* SOL FİLTRE PANELİ */}
        <aside className="col-12 col-lg-3">
          <div className={`filter-sidebar ${filtersOpen ? '' : 'd-none d-lg-block'}`}>
            {/* Kategori (+ seçiliyse alt kategori) */}
            <div className="filter-group">
              <h6 className="filter-group-title">Kategori</h6>
              <ul className="filter-list">
                <li>
                  <button
                    className={`filter-list-btn ${category === 'all' ? 'is-active' : ''}`}
                    onClick={() => setParam({ category: '', sub: '' })}
                  >
                    ✨ Tümü
                  </button>
                </li>
                {CATEGORIES.map((cat) => (
                  <li key={cat.id}>
                    <button
                      className={`filter-list-btn ${category === cat.id ? 'is-active' : ''}`}
                      onClick={() => setParam({ category: cat.id, sub: '' })}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                    {category === cat.id && cat.subcategories.length > 0 && (
                      <ul className="filter-sublist">
                        <li>
                          <button
                            className={`filter-list-btn filter-list-btn--sub ${sub === 'all' ? 'is-active' : ''}`}
                            onClick={() => setParam({ sub: '' })}
                          >
                            Tümü
                          </button>
                        </li>
                        {cat.subcategories.map((s) => (
                          <li key={s.id}>
                            <button
                              className={`filter-list-btn filter-list-btn--sub ${sub === s.id ? 'is-active' : ''}`}
                              onClick={() => setParam({ sub: s.id })}
                            >
                              {s.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Fiyat */}
            <div className="filter-group">
              <h6 className="filter-group-title">Fiyat Aralığı (TL)</h6>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="number" min="0" inputMode="numeric" placeholder="Min"
                  value={minPrice} onChange={(e) => setParam({ min: e.target.value })}
                  className="form-control form-control-sm" aria-label="Minimum fiyat"
                />
                <span className="text-muted">–</span>
                <input
                  type="number" min="0" inputMode="numeric" placeholder="Max"
                  value={maxPrice} onChange={(e) => setParam({ max: e.target.value })}
                  className="form-control form-control-sm" aria-label="Maksimum fiyat"
                />
              </div>
              <div className="form-check form-switch mt-2">
                <input
                  className="form-check-input" type="checkbox" id="freeOnly"
                  checked={freeOnly} onChange={(e) => setParam({ free: e.target.checked })}
                />
                <label className="form-check-label small" htmlFor="freeOnly">🎁 Sadece bağış</label>
              </div>
            </div>

            {/* Durum */}
            <div className="filter-group">
              <h6 className="filter-group-title">Ürün Durumu</h6>
              <ul className="filter-list">
                <li>
                  <button className={`filter-list-btn ${cond === 'all' ? 'is-active' : ''}`} onClick={() => setParam({ cond: '' })}>
                    Hepsi
                  </button>
                </li>
                {Object.entries(CONDITION_LABELS).map(([id, label]) => (
                  <li key={id}>
                    <button className={`filter-list-btn ${cond === id ? 'is-active' : ''}`} onClick={() => setParam({ cond: id })}>
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Yaş Grubu */}
            <div className="filter-group">
              <h6 className="filter-group-title">Yaş Grubu</h6>
              <ul className="filter-list">
                <li>
                  <button className={`filter-list-btn ${age === 'all' ? 'is-active' : ''}`} onClick={() => setParam({ age: '' })}>
                    Tüm Yaşlar
                  </button>
                </li>
                {AGE_GROUPS.map((a) => (
                  <li key={a.id}>
                    <button className={`filter-list-btn ${age === a.id ? 'is-active' : ''}`} onClick={() => setParam({ age: a.id })}>
                      {a.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* İl */}
            <div className="filter-group">
              <h6 className="filter-group-title">İl</h6>
              <select className="form-select form-select-sm" value={province} onChange={(e) => setParam({ il: e.target.value })}>
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
          {loading && products.length === 0 ? (
            <div className="text-center py-5">
              <div className="spinner-border text-pink-600"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-5">
              <div className="display-1 mb-3">📭</div>
              <h3 className="h5">{hasActiveFilters ? 'Bu kriterlere uyan ürün bulunamadı' : 'Henüz ürün yok'}</h3>
              {hasActiveFilters && (
                <button type="button" className="btn btn-outline-pink rounded-pill mt-2" onClick={clearFilters}>
                  Filtreleri temizle
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="row g-3 g-md-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="col-6 col-md-4">
                    <ProductCard
                      product={product}
                      isFavorited={favoriteIds.has(product.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  </div>
                ))}
              </div>
              {hasMore && !hasActiveFilters && (
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
        </div>
      </div>
    </div>
  )
}

export default Products
