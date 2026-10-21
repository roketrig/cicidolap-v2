// src/components/ProductCard.jsx
//
// Liste kartı (Dolap/Vinted tarzı): kare görsel, marka, başlık, belirgin fiyat,
// durum + beden, konum ve "ne zaman" bilgisi. Kartın tamamı tıklanabilir
// (stretched-link); favori kalbi onun üstünde.
import React, { memo } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { subcategoryLabel } from '../data/categories'
import { productImages, formatPrice, conditionLabel, timeAgo } from '../utils'

function ProductCard({ product, isFavorited, onToggleFavorite }) {
  const img = productImages(product)[0]
  const isFree = Number(product.price) === 0

  return (
    <article className="pcard">
      <div className="pcard-media">
        {img ? (
          <img
            src={img}
            alt={product.title}
            loading="lazy"
            decoding="async"
            style={product.sold ? { opacity: 0.55 } : undefined}
          />
        ) : (
          <span className="pcard-placeholder">🧸</span>
        )}

        {product.sold && <div className="product-sold-ribbon">Satıldı</div>}
        {isFree && !product.sold && <span className="pcard-tag pcard-tag--free">🎁 Bağış</span>}

        {onToggleFavorite && (
          <button
            type="button"
            className={`favorite-btn ${isFavorited ? 'is-active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite(product.id)
            }}
            aria-pressed={isFavorited}
            aria-label={isFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            title={isFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            <Icon name="heart" size={20} filled={isFavorited} strokeWidth={1.7} />
          </button>
        )}
      </div>

      <div className="pcard-body">
        <div className="pcard-brand">
          {product.brand || subcategoryLabel(product.category, product.subcategory)}
        </div>
        <Link to={`/product/${product.id}`} className="pcard-title stretched-link">
          {product.title}
        </Link>
        <div className={`pcard-price ${isFree ? 'is-free' : ''}`}>{formatPrice(product.price)}</div>
        <div className="pcard-meta">
          <span className={`pcard-cond cond-${product.condition}`}>{conditionLabel(product.condition)}</span>
          {product.size && <span className="pcard-size">{product.size}</span>}
        </div>
        <div className="pcard-foot">
          {product.province && (
            <>
              <Icon name="pin" size={13} /> {product.province}
            </>
          )}
          {product.province && product.createdAt && <span className="mx-1">·</span>}
          {product.createdAt && <span>{timeAgo(product.createdAt)}</span>}
        </div>
      </div>
    </article>
  )
}

// Favori değişince yalnızca ilgili kart yeniden render olsun diye memo'lu.
export default memo(ProductCard)
