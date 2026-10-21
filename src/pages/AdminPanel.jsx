// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import { ADMIN_EMAIL } from '../constants'
import { deleteProductImages } from '../imageUpload'
import { removeListingPhone } from '../contact'
import { subcategoryLabel } from '../data/categories'
import { productImages, formatPrice, timeAgo } from '../utils'
import { reasonLabel } from '../safety'

const TYPE_LABEL = { listing: 'İlan', user: 'Kullanıcı', conversation: 'Konuşma' }

function AdminPanel({ user }) {
  const [tab, setTab] = useState('products') // products | reports
  const [products, setProducts] = useState([])
  const [reports, setReports] = useState([])
  const [bans, setBans] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showResolved, setShowResolved] = useState(false)

  const isAdmin = user?.email === ADMIN_EMAIL

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        // Şimdilik son 500 kayıt yeterli; büyürse buraya sayfalama eklenmeli.
        const [prodSnap, repSnap, banSnap] = await Promise.all([
          getDocs(query(collection(db, 'products'), limit(500))),
          getDocs(query(collection(db, 'reports'), limit(500))).catch((err) => {
            console.warn('Şikayetler okunamadı (kurallar yayınlanmamış olabilir):', err?.code || err)
            return null
          }),
          getDocs(query(collection(db, 'bans'), limit(500))).catch(() => null),
        ])
        if (cancelled) return
        const byDate = (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        setProducts(prodSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byDate))
        setReports(repSnap ? repSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byDate) : [])
        setBans(new Set(banSnap ? banSnap.docs.map((d) => d.id) : []))
      } catch (error) {
        console.error('Admin verileri yüklenirken hata:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  const flash = (text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3500)
  }

  const setStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'products', id), { status })
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
      flash(status === 'approved' ? '✅ Ürün onaylandı!' : '❌ Ürün reddedildi!')
    } catch (error) {
      console.error('Durum güncelleme hatası:', error)
      flash('İşlem başarısız oldu.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ürünü silmek istediğine emin misin?')) return
    const product = products.find((p) => p.id === id)
    try {
      await deleteDoc(doc(db, 'products', id))
      removeListingPhone(id) // varsa iletişim kaydını da sil (KVKK)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      flash('🗑️ Ürün silindi!')

      // Worker, admin e-postasını tanıdığı için başkasının görselini de silebilir.
      const urls = productImages(product)
      if (urls.length && auth.currentUser) {
        try {
          const idToken = await auth.currentUser.getIdToken()
          await deleteProductImages(urls, idToken)
        } catch (imgErr) {
          console.error('Görseller silinemedi (göz ardı edildi):', imgErr)
        }
      }
    } catch (error) {
      console.error('Silme hatası:', error)
    }
  }

  const setReportStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'reports', id), { status, handledAt: serverTimestamp() })
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    } catch (error) {
      console.error('Şikayet güncellenemedi:', error)
      flash('İşlem başarısız oldu.')
    }
  }

  const handleBan = async (report) => {
    const uid = report.targetOwnerId
    if (!uid) return
    if (!window.confirm('Bu kullanıcı yasaklanacak ve tüm ilanları reddedilecek. Emin misin?')) return
    try {
      await setDoc(doc(db, 'bans', uid), { reason: report.reason, reportId: report.id, createdAt: serverTimestamp() })
      const theirs = await getDocs(query(collection(db, 'products'), where('userId', '==', uid)))
      await Promise.all(theirs.docs.map((d) => updateDoc(d.ref, { status: 'rejected' })))
      setBans((prev) => new Set(prev).add(uid))
      setProducts((prev) => prev.map((p) => (p.userId === uid ? { ...p, status: 'rejected' } : p)))
      await setReportStatus(report.id, 'resolved')
      flash('🚫 Kullanıcı yasaklandı, ilanları reddedildi.')
    } catch (error) {
      console.error('Yasaklama hatası:', error)
      flash('Yasaklanamadı. Firestore kurallarını yayınladın mı?')
    }
  }

  const handleUnban = async (uid) => {
    try {
      await deleteDoc(doc(db, 'bans', uid))
      setBans((prev) => {
        const next = new Set(prev)
        next.delete(uid)
        return next
      })
      flash('Yasak kaldırıldı.')
    } catch (error) {
      console.error('Yasak kaldırılamadı:', error)
    }
  }

  const rejectReportedListing = async (report) => {
    await setStatus(report.targetId, 'rejected')
    await setReportStatus(report.id, 'resolved')
  }

  // Bu sayfaya sadece admin hesabı erişebilir. Asıl güvenlik firestore.rules
  // dosyasındaki kurallarla sağlanıyor (rules Firebase Console'dan
  // yayınlanmadan bu arayüz kontrolü tek başına yeterli değildir).
  if (!isAdmin) {
    return (
      <div className="container text-center py-5">
        <div className="display-1 mb-3">🔒</div>
        <h2>Bu sayfaya erişim yetkin yok</h2>
        <p className="text-muted">Admin paneli sadece yönetici hesabına açıktır.</p>
        <Link to="/" className="btn btn-pink rounded-pill px-4">Ana Sayfaya Dön</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-pink-600"></div>
      </div>
    )
  }

  const pendingCount = products.filter((p) => p.status === 'pending').length
  const openReports = reports.filter((r) => r.status === 'open')
  const shownReports = showResolved ? reports : openReports

  return (
    <div className="container py-3 py-md-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 fw-bold text-pink-600 mb-0">🛠️ Yönetim</h1>
      </div>

      <div className="seg-tabs mb-3" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'products'} className={tab === 'products' ? 'is-active' : ''} onClick={() => setTab('products')}>
          İlanlar{pendingCount > 0 && ` (${pendingCount} bekliyor)`}
        </button>
        <button type="button" role="tab" aria-selected={tab === 'reports'} className={tab === 'reports' ? 'is-active' : ''} onClick={() => setTab('reports')}>
          Şikayetler{openReports.length > 0 && ` (${openReports.length})`}
        </button>
      </div>

      {message && (
        <div className="alert alert-info alert-dismissible py-2">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {tab === 'products' && (
        products.length === 0 ? (
          <div className="text-center py-5"><p className="text-muted">Henüz hiç ürün yok</p></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Ürün</th>
                  <th>Kategori</th>
                  <th>Fiyat</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="d-flex gap-2 align-items-center">
                        {productImages(product)[0] && (
                          <img src={productImages(product)[0]} alt="" width="44" height="44" style={{ objectFit: 'cover', borderRadius: 8 }} />
                        )}
                        <div>
                          <Link to={`/product/${product.id}`} className="fw-bold text-dark text-decoration-none">{product.title}</Link>
                          {product.sold && <span className="badge bg-dark ms-2">Satıldı</span>}
                          <div><small className="text-muted">{product.userEmail}{bans.has(product.userId) && ' · 🚫 yasaklı'}</small></div>
                        </div>
                      </div>
                    </td>
                    <td>{subcategoryLabel(product.category, product.subcategory)}</td>
                    <td className="fw-bold text-pink-600">{formatPrice(product.price)}</td>
                    <td>
                      <span className={`badge ${
                        product.status === 'approved' ? 'bg-success' :
                        product.status === 'rejected' ? 'bg-danger' :
                        'bg-warning text-dark'
                      }`}>
                        {product.status === 'approved' ? 'Onaylı' : product.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        {product.status !== 'approved' && (
                          <button onClick={() => setStatus(product.id, 'approved')} className="btn btn-success btn-sm">Onayla</button>
                        )}
                        {product.status !== 'rejected' && (
                          <button onClick={() => setStatus(product.id, 'rejected')} className="btn btn-danger btn-sm">Reddet</button>
                        )}
                        <button onClick={() => handleDelete(product.id)} className="btn btn-outline-secondary btn-sm">🗑️ Sil</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'reports' && (
        <>
          <div className="form-check form-switch mb-3">
            <input className="form-check-input" type="checkbox" id="showResolved" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
            <label className="form-check-label small" htmlFor="showResolved">Çözülenleri de göster</label>
          </div>

          {shownReports.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <div className="display-4 mb-2">🎉</div>
              Bekleyen şikayet yok.
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {shownReports.map((r) => (
                <div key={r.id} className="card shadow-sm border-0">
                  <div className="card-body">
                    <div className="d-flex flex-wrap justify-content-between gap-2">
                      <div>
                        <span className="badge bg-secondary me-2">{TYPE_LABEL[r.type] || r.type}</span>
                        <strong>{reasonLabel(r.reason)}</strong>
                        {r.status !== 'open' && (
                          <span className={`badge ms-2 ${r.status === 'resolved' ? 'bg-success' : 'bg-light text-dark'}`}>
                            {r.status === 'resolved' ? 'Çözüldü' : 'Reddedildi'}
                          </span>
                        )}
                      </div>
                      <small className="text-muted">{timeAgo(r.createdAt)}</small>
                    </div>
                    {r.details && <p className="mt-2 mb-2">{r.details}</p>}

                    {r.type === 'conversation' && r.evidence?.length > 0 && (
                      <div className="report-evidence">
                        {r.evidence.map((m, i) => (
                          <div key={i} className={m.senderId === r.reporterId ? 'is-reporter' : ''}>
                            <small>{m.senderId === r.reporterId ? 'Şikayet eden' : 'Karşı taraf'}:</small> {m.text}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {r.type === 'listing' && (
                        <>
                          <Link to={`/product/${r.targetId}`} className="btn btn-outline-secondary btn-sm">İlanı aç</Link>
                          <button className="btn btn-danger btn-sm" onClick={() => rejectReportedListing(r)}>İlanı reddet</button>
                        </>
                      )}
                      {r.type === 'user' && (
                        <Link to={`/satici/${r.targetId}`} className="btn btn-outline-secondary btn-sm">Profili aç</Link>
                      )}
                      {r.targetOwnerId && (
                        bans.has(r.targetOwnerId) ? (
                          <button className="btn btn-outline-dark btn-sm" onClick={() => handleUnban(r.targetOwnerId)}>Yasağı kaldır</button>
                        ) : (
                          <button className="btn btn-dark btn-sm" onClick={() => handleBan(r)}>🚫 Kullanıcıyı yasakla</button>
                        )
                      )}
                      {r.status === 'open' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => setReportStatus(r.id, 'resolved')}>Çözüldü</button>
                          <button className="btn btn-outline-secondary btn-sm" onClick={() => setReportStatus(r.id, 'dismissed')}>Geçersiz</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminPanel
