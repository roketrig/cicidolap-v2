// src/components/ProductCard.jsx
import React from 'react'
import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  return (
    <div className="product-card-v0">
      {/* Görsel Alanı */}
      <div className="product-image-v0 flex items-center justify-center">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.title} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <span className="text-5xl opacity-50">🧸</span>
        )}
      </div>
      
      {/* Bilgi Alanı */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="product-title-v0">{product.title}</h3>
          <span className={`badge-${product.condition}`}>
            {product.condition === 'new' ? 'Yeni' :
             product.condition === 'like-new' ? 'Az Kullanılmış' :
             product.condition === 'used' ? 'Kullanılmış' : 'Yıpranmış'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-2">{product.category}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="product-price-v0">
            {product.price === 0 ? '🎁 Bağış' : `${product.price} TL`}
          </span>
        </div>
        <Link 
          to={`/product/${product.id}`}
          className="mt-3 w-full block text-center bg-pink-500 hover:bg-pink-600 text-white font-medium py-2.5 rounded-xl transition-all duration-300 hover:scale-105"
        >
          ✨ İncele
        </Link>
      </div>
    </div>
  )
}