// src/components/CategoryNav.jsx
//
// Masaüstü kategori menüsü (e-bebek benzeri): üzerine gelince alt kategoriler
// "mega menü" olarak açılıyor, tıklayınca /products filtreli açılıyor.
// Mobilde gizli — orada alt gezinme çubuğu + Keşfet sayfası var.
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CATEGORIES } from '../data/categories'

export default function CategoryNav() {
  const [openId, setOpenId] = useState(null)
  const navigate = useNavigate()
  const open = CATEGORIES.find((c) => c.id === openId)

  const go = (params) => {
    setOpenId(null)
    navigate(`/products?${new URLSearchParams(params).toString()}`)
  }

  return (
    <div className="category-nav d-none d-lg-block" onMouseLeave={() => setOpenId(null)}>
      <div className="container position-relative">
        <ul className="category-nav-list">
          <li>
            <Link to="/products" className="category-nav-link" onMouseEnter={() => setOpenId(null)}>
              ✨ Tüm Ürünler
            </Link>
          </li>
          {CATEGORIES.map((cat) => (
            <li key={cat.id} onMouseEnter={() => setOpenId(cat.id)}>
              <button
                type="button"
                className={`category-nav-link ${openId === cat.id ? 'is-open' : ''}`}
                onClick={() => go({ category: cat.id })}
                onFocus={() => setOpenId(cat.id)}
              >
                {cat.emoji} {cat.shortLabel || cat.label}
              </button>
            </li>
          ))}
        </ul>

        {open && open.subcategories.length > 0 && (
          <div className="mega-panel" role="menu">
            <div className="mega-panel-title">
              {open.emoji} {open.label}
            </div>
            <div className="mega-panel-grid">
              {open.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  role="menuitem"
                  className="mega-panel-link"
                  onClick={() => go({ category: open.id, sub: sub.id })}
                >
                  {sub.label}
                </button>
              ))}
            </div>
            <button type="button" className="mega-panel-all" onClick={() => go({ category: open.id })}>
              {open.label} kategorisindeki tüm ürünler →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
