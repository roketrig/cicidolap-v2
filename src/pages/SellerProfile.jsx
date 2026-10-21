// src/pages/SellerProfile.jsx
//
// Herkese açık satıcı sayfası: satıcının onaylı ilanları + şikayet/engelle.
import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import ProductCard from '../components/ProductCard'
import ReportModal from '../components/ReportModal'
import Icon from '../components/Icon'
import { useFavorites } from '../hooks/useFavorites'
import { useSafety } from '../context/SafetyContext'
import { nameOrEmail } from '../utils'

function SellerProfile({ user }) {
  const { uid } = useParams()
  const { favoriteIds, toggleFavorite } = useFavorites(user)
  const { isBlocked, block, unblock } = useSafety()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const snap = await getDocs(
          query(collection(db, 'products'), where('userId', '==', uid), where('status', '==', 'approved'))
        )
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        if (!cancelled) setProducts(list)
      } catch (err) {
        console.error('Satıcı ilanları yüklenemedi:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [uid])

  const sellerName = nameOrEmail(products[0]?.userName, products[0]?.userEmail)
  const isMe = user?.uid === uid
  const blocked = isBlocked(uid)
  const active = products.filter((p) => !p.sold)
  const soldCount = products.length - active.length

  const toggleBlock = async () => {
    if (!user) return
    if (!blocked && !window.confirm(`${sellerName} adlı kullanıcıyı engellemek istiyor musun? İlanlarını görmeyeceksin ve sana mesaj gönderemeyecek.`)) return
    setBusy(true)
    try {
      if (blocked) await unblock(uid)
      else await block(uid, sellerName)
    } catch (err) {
      console.error('Engelleme işlemi başarısız:', err)
      alert('İşlem yapılamadı. Lütfen tekrar dene.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container py-4">
      <div className="seller-head">
        <div className="seller-avatar">{sellerName.charAt(0).toLocaleUpperCase('tr')}</div>
        <div className="flex-grow-1 min-w-0">
          <h1 className="h3 fw-bold mb-1 text-truncate">{sellerName}</h1>
          <div className="text-muted small">
            {active.length} aktif ilan{soldCount > 0 && <> · {soldCount} satılan</>}
          </div>
        </div>
        {isMe ? (
          <Link to="/profile" className="btn btn-outline-pink btn-sm rounded-pill">Profilime git</Link>
        ) : (
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => setReportOpen(true)}>
              <Icon name="flag" size={15} /> Şikayet et
            </button>
            {user && (
              <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={toggleBlock} disabled={busy}>
                <Icon name="block" size={15} /> {blocked ? 'Engeli kaldır' : 'Engelle'}
              </button>
            )}
          </div>
        )}
      </div>

      {blocked && (
        <div className="alert alert-secondary mt-3">Bu kullanıcıyı engelledin. İlanları listelerde gösterilmiyor.</div>
      )}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-pink-600"></div></div>
      ) : products.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-4 mb-2">📭</div>
          <h3 className="h5">Bu satıcının yayında ilanı yok</h3>
        </div>
      ) : (
        <div className="row g-3 g-md-4 mt-1">
          {products.map((product) => (
            <div key={product.id} className="col-6 col-md-4 col-lg-3">
              <ProductCard
                product={product}
                isFavorited={favoriteIds.has(product.id)}
                onToggleFavorite={toggleFavorite}
              />
            </div>
          ))}
        </div>
      )}

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        user={user}
        type="user"
        targetId={uid}
        targetOwnerId={uid}
        title="Kullanıcıyı şikayet et"
      />
    </div>
  )
}

export default SellerProfile
