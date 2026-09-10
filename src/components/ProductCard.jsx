// src/components/ProductCard.jsx
//
// Home.jsx ve Products.jsx'teki ürün listeleme kartı — favori kalbi ve
// "Satıldı" şeridi burada tek yerden yönetiliyor, iki sayfada da aynı
// markup tekrar tekrar yazılmıyor.
import React from 'react'
import { Link } from 'react-router-dom'

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
            className="favorite-btn"
            onClick={(e) => {
              e.preventDefault()
              onToggleFavorite(product.id)
            }}
            aria-label={isFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            title={isFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            {isFavorited ? '❤️' : '🤍'}
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
