// src/pages/AddProduct.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { auth, db } from '../firebase'
import { uploadProductImage, deleteProductImage } from '../imageUpload'
import { TURKISH_PROVINCES } from '../data/turkishProvinces'
import { CONTACT_PREF, KVKK_CONSENT_LABEL, saveListingPhone } from '../contact'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const PHONE_REGEX = /^0?5\d{9}$/ // 05xx xxx xx xx (boşluklar temizlendikten sonra)

function AddProduct() {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    price: '',
    description: '',
    condition: 'new',
    province: '',
    district: '',
    contactPref: CONTACT_PREF.MESSAGE,
    phone: ''
  })
  const [phoneConsent, setPhoneConsent] = useState(false)
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  // Seçilen görselin önizleme URL'sini (blob:) değişince/çıkışta serbest bırak.
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Eskiden burada hiç doğrulama yoktu; formda "Max 5MB" yazsa da
    // kullanıcı istediği boyutta/tipte dosya seçebiliyordu ve hata ancak
    // yüklerken (ya da hiç) ortaya çıkıyordu. Artık aynı anda hem
    // kullanıcıya anında geri bildirim veriyoruz hem de Worker'daki
    // sınırla tutarlı davranıyoruz (bkz. cloudflare-worker/src/index.js).
    if (!file.type.startsWith('image/')) {
      setError('Lütfen sadece resim dosyası seç (JPG, PNG, WebP).')
      e.target.value = ''
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Resim 5MB'dan büyük olamaz. Lütfen daha küçük bir dosya seç.")
      e.target.value = ''
      return
    }

    setError('')
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!auth.currentUser) {
      setError('Lütfen önce giriş yapın!')
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

    // Görsel yüklendikten sonra Firestore'a yazma başarısız olursa,
    // yüklenen görseli R2'de öksüz bırakmamak için bu iki değeri
    // catch bloğunda kullanıyoruz.
    let imageUrl = ''
    let idToken = null

    try {
      if (image) {
        // Görseller artık Cloudflare R2'ye, kullanıcıya özel bir klasöre
        // yükleniyor (products/{uid}/...). Worker, Firebase ID token'ını
        // doğrulayarak kullanıcının sadece kendi klasörüne yazabildiğini
        // garanti eder (bkz. cloudflare-worker/src/index.js).
        idToken = await auth.currentUser.getIdToken()
        imageUrl = await uploadProductImage(image, idToken)
      }

      // Not: telefon numarası KVKK gereği herkese açık "products"
      // dokümanına YAZILMIYOR. Kullanıcı "Mesaj + telefon" seçtiyse numara
      // ayrı "listingContacts" dokümanına kaydediliyor (bkz. src/contact.js).
      const { phone: _omitPhone, ...rest } = formData
      const productData = {
        ...rest,
        // "city" alanı, il/ilçeyi tek bir metinde birleştirip eski
        // ekranlarla (ProductDetail, AdminPanel vb.) geriye dönük uyumlu
        // kalmayı sağlıyor. Filtreleme/arama için province ayrı bir alan
        // olarak da saklanıyor (bkz. Home.jsx'teki il filtresi).
        city: `${formData.province} / ${formData.district}`,
        price: parseFloat(formData.price) || 0,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        userName: auth.currentUser.displayName || '',
        imageUrl: imageUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      if (wantsPhone) {
        productData.phoneConsentAt = serverTimestamp()
      }

      const productRef = await addDoc(collection(db, 'products'), productData)

      if (wantsPhone) {
        await saveListingPhone(productRef.id, auth.currentUser.uid, normalizedPhone)
      }

      setSuccess('🎉 Ürün başarıyla eklendi! Admin onayından sonra yayınlanacak.')
      setFormData({
        title: '',
        category: '',
        price: '',
        description: '',
        condition: 'new',
        province: '',
        district: '',
        contactPref: CONTACT_PREF.MESSAGE,
        phone: ''
      })
      setPhoneConsent(false)
      setImage(null)
      setImagePreview(null)

      setTimeout(() => {
        navigate('/')
      }, 3000)

    } catch (err) {
      console.error('Ürün ekleme hatası:', err)
      setError('Ürün eklenirken bir hata oluştu: ' + err.message)
      // Ürün kaydı oluşmadıysa yüklenmiş görseli temizle.
      if (imageUrl && idToken) {
        deleteProductImage(imageUrl, idToken).catch(() => {})
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-7">
          <div className="card shadow-lg border-0 rounded-4 p-4">
            <div className="text-center mb-4">
              <h1 className="fw-bold text-pink-600">📦 Ürün Ekle</h1>
              <p className="text-muted">Satmak veya bağışlamak istediğin ürünü detaylıca anlat</p>
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
              {/* Resim Yükleme */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Ürün Görseli</label>
                <div className="d-flex align-items-center gap-3">
                  <label className="btn btn-outline-secondary w-100 py-3 border-dashed">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="d-none"
                    />
                    <div className="d-flex flex-column align-items-center">
                      <span className="display-6">📷</span>
                      <span className="small">Resim seç veya sürükle</span>
                    </div>
                  </label>
                  {imagePreview && (
                    <div className="flex-shrink-0" style={{ width: '80px', height: '80px' }}>
                      <img src={imagePreview} alt="Önizleme" className="img-fluid rounded-3 object-fit-cover w-100 h-100" />
                    </div>
                  )}
                </div>
                <small className="text-muted">JPG, PNG, WebP (Max 5MB)</small>
              </div>

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
                  placeholder="Ürünü detaylıca anlat... (boyut, marka, renk, kullanım durumu vs.)"
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

              {/* İletişim tercihi (KVKK) */}
              <div className="mt-4">
                <label className="form-label fw-semibold">Alıcılar sana nasıl ulaşsın?</label>
                <div className="d-flex flex-column gap-2">
                  <label className={`contact-pref-option ${formData.contactPref === CONTACT_PREF.MESSAGE ? 'is-active' : ''}`}>
                    <input
                      type="radio"
                      name="contactPref"
                      value={CONTACT_PREF.MESSAGE}
                      checked={formData.contactPref === CONTACT_PREF.MESSAGE}
                      onChange={handleChange}
                    />
                    <span>
                      <strong>💬 Sadece mesajla</strong>
                      <small className="d-block text-muted">Numaran hiçbir şekilde paylaşılmaz. Önerilen.</small>
                    </span>
                  </label>
                  <label className={`contact-pref-option ${formData.contactPref === CONTACT_PREF.PHONE ? 'is-active' : ''}`}>
                    <input
                      type="radio"
                      name="contactPref"
                      value={CONTACT_PREF.PHONE}
                      checked={formData.contactPref === CONTACT_PREF.PHONE}
                      onChange={handleChange}
                    />
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
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="05xx xxx xx xx"
                    className="form-control"
                  />
                  <div className="form-check mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="phoneConsent"
                      checked={phoneConsent}
                      onChange={(e) => setPhoneConsent(e.target.checked)}
                    />
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

              {/* Gönder Butonu */}
              <div className="d-grid mt-4">
                <button
                  type="submit"
                  className="btn btn-pink py-2 rounded-pill"
                  disabled={loading}
                >
                  {loading ? 'Gönderiliyor...' : '🚀 Ürünü Gönder'}
                </button>
              </div>

              <p className="text-center text-muted small mt-3">
                Ürünün admin onayından sonra vitrinde görünecektir.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddProduct
