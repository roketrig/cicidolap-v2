// src/components/ProductCard.jsx
//
// Not: Bu bileşen daha önce Tailwind sınıfları (w-full, flex, hover:scale-105
// vb.) ile yazılmıştı, ama projede Tailwind hiç derlenmiyordu (src/tailwind.css
// hiçbir yerde import edilmiyordu) ve bileşenin kendisi de Home/Products/Profile
// sayfalarının hiçbirinde kullanılmıyordu — yani kullanılsaydı tamamen
// stilsiz görünecekti. Artık projenin geri kalanıyla aynı Bootstrap +
// index.css sınıflarını kullanıyor, Home.jsx / Products.jsx'teki kart
// düzeniyle birebir aynı.
import React from 'react'
import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  return (
    <div className="card product-card h-100 shadow-sm">
      <div className="product-image d-flex align-items-center justify-content-center bg-light">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="img-fluid h-100 object-fit-cover"
          />
        ) : (
          <span className="display-1 opacity-25">🧸</span>
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
        <p className="card-text small text-muted">{product.category}</p>
        <div className="d-flex justify-content-between align-items-center mt-2">
          <span className="fs-5 fw-bold text-pink-600">
            {product.price === 0 ? '🎁 Bağış' : `${product.price} TL`}
          </span>
        </div>
        <Link
          to={`/product/${product.id}`}
          className="btn btn-pink w-100 mt-3 rounded-pill"
        >
          ✨ İncele
        </Link>
      </div>
    </div>
  )
}
