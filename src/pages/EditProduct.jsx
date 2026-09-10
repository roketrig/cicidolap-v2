// src/pages/EditProduct.jsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { ADMIN_EMAIL } from '../constants'
import { TURKISH_PROVINCES } from '../data/turkishProvinces'

const PHONE_REGEX = /^0?5\d{9}$/ // 05xx xxx xx xx (boşluklar temizlendikten sonra)

function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    price: '',
    description: '',
    condition: 'new',
    province: '',
    district: '',
    phone: ''
  })

  const categories = [
    'Yenidoğan (0-3 ay)',
    'Bebek (3-12 ay)',
    'Yürüme (1-2 yaş)',
    'Çocuk (3-6 yaş)',
    'Okul (7-12 yaş)'
  ]

  const conditions = [
    { value: 'new', label: 'Yeni (Kullanılmadı)' },
    { value: 'like-new', label: 'Az Kullanılmış' },
    { value: 'used', label: 'Kullanılmış' },
    { value: 'worn', label: 'Yıpranmış' }
  ]

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const docRef = doc(db, 'products', id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        // Kullanıcı kontrolü - sadece kendi ürününü ya da admin düzenleyebilir.
        const isOwner = data.userId === auth.currentUser?.uid
        const isAdmin = auth.currentUser?.email === ADMIN_EMAIL
        if (!isOwner && !isAdmin) {
          setError('Bu ürünü düzenleme yetkiniz yok!')
          setLoading(false)
          return
        }

        // "province"/"district" alanları sonradan eklendi. Daha eski
        // ürünlerde sadece birleşik "city" metni var (Örn: "İstanbul /
        // Kadıköy") — mümkünse onu ayrıştırıp formu önceden dolduruyoruz,
        // ayrıştıramazsak kullanıcı ilini yeniden seçer.
        let province = data.province || ''
        let district = data.district || ''
        if (!province && data.city) {
          const parts = data.city.split('/').map(p => p.trim())
          province = TURKISH_PROVINCES.includes(parts[0]) ? parts[0] : ''
          district = parts[1] || (province ? '' : data.city)
        }

        setFormData({
          title: data.title || '',
          category: data.category || '',
          price: data.price?.toString() || '',
          description: data.description || '',
          condition: data.condition || 'new',
          province,
          district,
          phone: data.phone || ''
        })
      } else {
        setError('Ürün bulunamadı')
      }
    } catch (err) {
      console.error('Ürün yüklenirken hata:', err)
      setError('Ürün yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const normalizedPhone = formData.phone.replace(/\s+/g, '')
    if (!PHONE_REGEX.test(normalizedPhone)) {
      setError('Lütfen geçerli bir cep telefonu numarası gir (Örn: 05xx xxx xx xx).')
      return
    }

    setSubmitting(true)

    try {
      const productData = {
        ...formData,
        phone: normalizedPhone,
        city: `${formData.province} / ${formData.district}`,
        price: parseFloat(formData.price) || 0,
        updatedAt: serverTimestamp()
      }

      await updateDoc(doc(db, 'products', id), productData)

      setSuccess('✅ Ürün başarıyla güncellendi!')
      setTimeout(() => {
        navigate(`/product/${id}`)
      }, 2000)
    } catch (err) {
      console.error('Ürün güncelleme hatası:', err)
      setError('Ürün güncellenirken bir hata oluştu: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-pink-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container text-center py-5">
        <div className="display-1 mb-3">😕</div>
        <h2>{error}</h2>
        <Link to="/profile" className="btn btn-pink rounded-pill px-4 mt-3">
          Profilime Dön
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-7">
          <div className="card shadow-lg border-0 rounded-4 p-4">
            <div className="text-center mb-4">
              <h1 className="fw-bold text-pink-600">✏️ Ürün Düzenle</h1>
              <p className="text-muted">Ürün bilgilerini güncelle</p>
            </div>

            {success && (
              <div className="alert alert-success alert-dismissible fade show">
                {success}
                <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Ürün Başlığı */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Ürün Başlığı <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Örn: Bebek Tulum 3-6 Ay"
                  className="form-control"
                  required
                />
              </div>

              {/* Kategori */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Kategori <span className="text-danger">*</span></label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Kategori seç</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Fiyat ve Durum */}
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Fiyat (TL) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="form-control"
                    required
                    min="0"
                    step="0.01"
                  />
                  <small className="text-muted">Bağış yapacaksan 0 yaz</small>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Ürün Durumu <span className="text-danger">*</span></label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    {conditions.map((cond) => (
                      <option key={cond.value} value={cond.value}>{cond.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Açıklama */}
              <div className="mb-3 mt-3">
                <label className="form-label fw-semibold">Ürün Açıklaması <span className="text-danger">*</span></label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Ürünü detaylıca anlat..."
                  rows="4"
                  className="form-control"
                  required
                />
              </div>

              {/* Konum */}
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">İl <span className="text-danger">*</span></label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">İl seç</option>
                    {TURKISH_PROVINCES.map((il) => (
                      <option key={il} value={il}>{il}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">İlçe / Semt <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="Örn: Kadıköy"
                    className="form-control"
                    required
                  />
                </div>
              </div>

              {/* İletişim */}
              <div className="row g-3 mt-0">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Telefon <span className="text-danger">*</span></label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="05xx xxx xx xx"
                    className="form-control"
                    required
                  />
                </div>
              </div>

              {/* Butonlar */}
              <div className="d-flex gap-2 mt-4">
                <button
                  type="submit"
                  className="btn btn-pink flex-grow-1 py-2 rounded-pill"
                  disabled={submitting}
                >
                  {submitting ? 'Güncelleniyor...' : '💾 Güncelle'}
                </button>
                <Link
                  to={`/product/${id}`}
                  className="btn btn-outline-secondary flex-grow-1 py-2 rounded-pill text-center"
                >
                  İptal
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditProduct
