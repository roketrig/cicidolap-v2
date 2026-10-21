// src/pages/AddProduct.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { uploadPickedImages, deleteProductImages } from '../imageUpload'
import { TURKISH_PROVINCES } from '../data/turkishProvinces'
import { CATEGORIES, AGE_GROUPS, subcategoriesFor } from '../data/categories'
import { CONTACT_PREF, KVKK_CONSENT_LABEL, saveListingPhone } from '../contact'
import ImagePicker from '../components/ImagePicker'
import { useSafety } from '../context/SafetyContext'

const PHONE_REGEX = /^0?5\d{9}$/ // 05xx xxx xx xx (boşluklar temizlendikten sonra)
const MAX_PHOTOS = 5

const CONDITIONS = [
  { value: 'new', label: 'Yeni (Kullanılmadı)' },
  { value: 'like-new', label: 'Az Kullanılmış' },
  { value: 'used', label: 'Kullanılmış' },
  { value: 'worn', label: 'Yıpranmış' },
]

const EMPTY_FORM = {
  title: '',
  category: '',
  subcategory: '',
  ageGroup: '',
  brand: '',
  size: '',
  price: '',
  description: '',
  condition: 'like-new',
  province: '',
  district: '',
  contactPref: CONTACT_PREF.MESSAGE,
  phone: '',
}

function AddProduct() {
  const navigate = useNavigate()
  const { isBanned } = useSafety()
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [phoneConsent, setPhoneConsent] = useState(false)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const subcategoryOptions = subcategoriesFor(formData.category)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      // Kategori değişince eski kategorinin alt kategorisi anlamsız kalır.
      if (name === 'category') return { ...prev, category: value, subcategory: '' }
      return { ...prev, [name]: value }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!auth.currentUser) {
      setError('Lütfen önce giriş yapın!')
      return
    }
    if (isBanned) {
      setError('Hesabın kısıtlandığı için ilan veremezsin.')
      return
    }
    if (photos.length === 0) {
      setError('Lütfen en az bir fotoğraf ekle — fotoğraflı ilanlar çok daha hızlı ilgi görür.')
      return
    }

    const wantsPhone = formData.contactPref === CONTACT_PREF.PHONE
    const normalizedPhone = formData.phone.replace(/\s+/g, '')
    if (wantsPhone) {
      if (!PHONE_REGEX.test(normalizedPhone)) {
        setError('Lütfen geçerli bir cep telefonu numarası gir (Örn: 05xx xxx xx xx).')
        return
      }
      if (!phoneConsent) {
        setError('Telefon numaranın gösterilmesi için KVKK açık rıza onayını işaretlemelisin.')
        return
      }
    }

    setLoading(true)
    // Görseller yüklendikten sonra Firestore yazması başarısız olursa
    // R2'de öksüz kalmasınlar diye catch'te temizlemek için tutuluyor.
    let uploaded = []
    let idToken = null

    try {
      idToken = await auth.currentUser.getIdToken()
      const result = await uploadPickedImages(photos, idToken)
      uploaded = result.uploaded

      // Not: telefon KVKK gereği herkese açık "products" dokümanına
      // YAZILMIYOR (bkz. src/contact.js).
      const { phone: _omitPhone, ...rest } = formData
      const productData = {
        ...rest,
        brand: formData.brand.trim(),
        size: formData.size.trim(),
        // "city": il/ilçeyi birleştirip eski ekranlarla uyumlu kalıyor.
        city: `${formData.province} / ${formData.district}`,
        price: parseFloat(formData.price) || 0,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        userName: auth.currentUser.displayName || '',
        imageUrls: result.urls,
        imageUrl: result.urls[0] || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      if (wantsPhone) productData.phoneConsentAt = serverTimestamp()

      const productRef = await addDoc(collection(db, 'products'), productData)
      if (wantsPhone) {
        await saveListingPhone(productRef.id, auth.currentUser.uid, normalizedPhone)
      }

      setSuccess('🎉 Ürün başarıyla eklendi! Admin onayından sonra yayınlanacak.')
      setFormData(EMPTY_FORM)
      setPhoneConsent(false)
      setPhotos([])
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => navigate('/profile'), 2500)
    } catch (err) {
      console.error('Ürün ekleme hatası:', err)
      setError('Ürün eklenirken bir hata oluştu: ' + err.message)
      if (uploaded.length && idToken) deleteProductImages(uploaded, idToken).catch(() => {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-3 py-md-4">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-7">
          <div className="card shadow-lg border-0 rounded-4 p-3 p-md-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <button type="button" className="btn btn-sm btn-outline-secondary rounded-circle d-lg-none" onClick={() => navigate(-1)} aria-label="Geri">←</button>
              <div>
                <h1 className="h3 fw-bold text-pink-600 mb-0">İlan Ver</h1>
                <p className="text-muted small mb-0">Satmak veya bağışlamak istediğin ürünü anlat</p>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger alert-dismissible fade show">
                ⚠️ {error}
                <button type="button" className="btn-close" onClick={() => setError('')}></button>
              </div>
            )}
            {success && (
              <div className="alert alert-success alert-dismissible fade show">
                ✅ {success}
                <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Fotoğraflar <span className="text-danger">*</span></label>
                <ImagePicker items={photos} onChange={setPhotos} onError={setError} max={MAX_PHOTOS} />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Başlık <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Örn: Chicco bebek arabası, az kullanılmış"
                  className="form-control"
                  maxLength={80}
                  required
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Kategori <span className="text-danger">*</span></label>
                  <select name="category" value={formData.category} onChange={handleChange} className="form-select" required>
                    <option value="">Kategori seç</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Yaş Grubu <span className="text-danger">*</span></label>
                  <select name="ageGroup" value={formData.ageGroup} onChange={handleChange} className="form-select" required>
                    <option value="">Yaş grubu seç</option>
                    {AGE_GROUPS.map((age) => (
                      <option key={age.id} value={age.id}>{age.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {subcategoryOptions.length > 0 && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">Alt Kategori <span className="text-danger">*</span></label>
                  <select name="subcategory" value={formData.subcategory} onChange={handleChange} className="form-select" required>
                    <option value="">Alt kategori seç</option>
                    {subcategoryOptions.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Marka <small className="text-muted fw-normal">(isteğe bağlı)</small></label>
                  <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Örn: Chicco, LC Waikiki" className="form-control" maxLength={40} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Beden / Ölçü <small className="text-muted fw-normal">(isteğe bağlı)</small></label>
                  <input type="text" name="size" value={formData.size} onChange={handleChange} placeholder="Örn: 3-6 ay, 74 cm, 28 numara" className="form-control" maxLength={30} />
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Fiyat (TL) <span className="text-danger">*</span></label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0" className="form-control" required min="0" step="1" inputMode="numeric" />
                  <small className="text-muted">Bağış yapacaksan 0 yaz</small>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Ürün Durumu <span className="text-danger">*</span></label>
                  <select name="condition" value={formData.condition} onChange={handleChange} className="form-select" required>
                    {CONDITIONS.map((cond) => (
                      <option key={cond.value} value={cond.value}>{cond.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3 mt-3">
                <label className="form-label fw-semibold">Açıklama <span className="text-danger">*</span></label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Ürünü detaylıca anlat… (kullanım süresi, eksik/kusur varsa, renk, kutusu var mı vs.)"
                  rows="4"
                  className="form-control"
                  maxLength={2000}
                  required
                />
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">İl <span className="text-danger">*</span></label>
                  <select name="province" value={formData.province} onChange={handleChange} className="form-select" required>
                    <option value="">İl seç</option>
                    {TURKISH_PROVINCES.map((il) => (
                      <option key={il} value={il}>{il}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">İlçe / Semt <span className="text-danger">*</span></label>
                  <input type="text" name="district" value={formData.district} onChange={handleChange} placeholder="Örn: Kadıköy" className="form-control" required />
                </div>
              </div>

              {/* İletişim tercihi (KVKK) */}
              <div className="mt-4">
                <label className="form-label fw-semibold">Alıcılar sana nasıl ulaşsın?</label>
                <div className="d-flex flex-column gap-2">
                  <label className={`contact-pref-option ${formData.contactPref === CONTACT_PREF.MESSAGE ? 'is-active' : ''}`}>
                    <input type="radio" name="contactPref" value={CONTACT_PREF.MESSAGE} checked={formData.contactPref === CONTACT_PREF.MESSAGE} onChange={handleChange} />
                    <span>
                      <strong>💬 Sadece mesajla</strong>
                      <small className="d-block text-muted">Numaran hiçbir şekilde paylaşılmaz. Önerilen.</small>
                    </span>
                  </label>
                  <label className={`contact-pref-option ${formData.contactPref === CONTACT_PREF.PHONE ? 'is-active' : ''}`}>
                    <input type="radio" name="contactPref" value={CONTACT_PREF.PHONE} checked={formData.contactPref === CONTACT_PREF.PHONE} onChange={handleChange} />
                    <span>
                      <strong>📞 Mesaj + telefon</strong>
                      <small className="d-block text-muted">Numaran, giriş yapmış kullanıcılara "Telefonu Göster" ile açılır.</small>
                    </span>
                  </label>
                </div>
              </div>

              {formData.contactPref === CONTACT_PREF.PHONE && (
                <div className="mt-3 p-3 rounded-3" style={{ background: 'var(--cd-bg)' }}>
                  <label className="form-label fw-semibold">Telefon <span className="text-danger">*</span></label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="05xx xxx xx xx" className="form-control" />
                  <div className="form-check mt-3">
                    <input className="form-check-input" type="checkbox" id="phoneConsent" checked={phoneConsent} onChange={(e) => setPhoneConsent(e.target.checked)} />
                    <label className="form-check-label small" htmlFor="phoneConsent">
                      {KVKK_CONSENT_LABEL}{' '}
                      <Link to="/gizlilik" target="_blank" className="text-pink-600">KVKK Aydınlatma Metni</Link>
                    </label>
                  </div>
                </div>
              )}

              <p className="text-muted small mt-2">
                🔒 İletişim bilgilerin KVKK kapsamında korunur. İl/ilçe bilgisi ilanda görünür;
                e-posta adresin diğer kullanıcılarla asla paylaşılmaz.
              </p>

              <div className="d-grid mt-4">
                <button type="submit" className="btn btn-pink btn-lg py-2 rounded-pill" disabled={loading}>
                  {loading ? 'Gönderiliyor...' : '🚀 İlanı Gönder'}
                </button>
              </div>
              <p className="text-center text-muted small mt-3 mb-0">
                İlanın, <Link to="/kullanim-sartlari">Kullanım Şartları</Link>'na uygunluk açısından kontrol edildikten sonra yayına girer.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddProduct
