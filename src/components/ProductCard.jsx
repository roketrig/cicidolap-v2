// src/components/ProductCard.jsx
//
// Home.jsx ve Products.jsx'teki ürün listeleme kartı — favori kalbi ve
// "Satıldı" şeridi burada tek yerden yönetiliyor, iki sayfada da aynı
// markup tekrar tekrar yazılmıyor.
import React from 'react'
import { Link } from 'react-router-dom'

// Favori kalbi artık emoji değil, SVG. Emoji (🤍 / ❤️) bazı Windows/Android
// sürümlerinde neredeyse aynı görünüyordu; SVG ile "dolu kırmızı" ve "boş
// çerçeve" hâli her cihazda net ayırt ediliyor.
function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M12 20.7s-6.75-4.28-9.4-8.02C.86 9.9 1.73 6.4 4.8 5.5c1.94-.57 3.94.33 5.2 1.96C11.26 5.83 13.26 4.93 15.2 5.5c3.07.9 3.94 4.4 2.2 7.18C18.75 16.42 12 20.7 12 20.7z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ProductCard({ product, isFavorited, onToggleFavorite }) {
  return (
    <div className="card product-card h-100 shadow-sm position-relative">
      {product.sold && (
        <div className="product-sold-ribbon">Satıldı</div>
      )}

      <div className="product-image d-flex align-items-center justify-content-center bg-light position-relative">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="img-fluid h-100 object-fit-cover"
            style={product.sold ? { opacity: 0.55 } : undefined}
          />
        ) : (
          <span className="display-1 opacity-25">🧸</span>
        )}

        {onToggleFavorite && (
          <button
            type="button"
            className={`favorite-btn ${isFavorited ? 'is-active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              onToggleFavorite(product.id)
            }}
            aria-pressed={isFavorited}
            aria-label={isFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            title={isFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            <HeartIcon filled={isFavorited} />
          </button>
        )}
      </div>

      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <h5 className="card-title fw-bold text-truncate">{product.title}</h5>
          <span className={`badge badge-${product.condition}`}>
            {product.condition === 'new' ? 'Yeni' :
              product.condition === 'like-new' ? 'Az Kullanılmış' :
                product.condition === 'used' ? 'Kullanılmış' : 'Yıpranmış'}
          </span>
        </div>
        <p className="card-text small text-muted">
          {product.category}
          {product.province && <> · 📍 {product.province}</>}
        </p>
        <div className="d-flex justify-content-between align-items-center mt-2">
          <span className="fs-5 fw-bold text-pink-600">
            {product.price === 0 ? '🎁 Bağış' : `${product.price} TL`}
          </span>
        </div>
        <Link
          to={`/product/${product.id}`}
          className="btn btn-pink w-100 mt-3 rounded-pill"
        >
          {product.sold ? '👀 İlana Bak' : '✨ İncele'}
        </Link>
      </div>
    </div>
  )
}
