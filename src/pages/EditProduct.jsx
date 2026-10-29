// src/pages/EditProduct.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { ADMIN_EMAIL } from '../constants'
import { TURKISH_PROVINCES } from '../data/turkishProvinces'
import { CATEGORIES, AGE_GROUPS, subcategoriesFor } from '../data/categories'
import { uploadPickedImages, deleteProductImages, pickerItemsFromUrls } from '../imageUpload'
import ImagePicker from '../components/ImagePicker'
import { productImages } from '../utils'
import { CONTACT_PREF, KVKK_CONSENT_LABEL, saveListingPhone, removeListingPhone, fetchListingPhone } from '../contact'
import { parsePrice, validateListing, showFieldError, clearFieldError } from '../listingForm'

const PHONE_REGEX = /^0?5\d{9}$/ // 05xx xxx xx xx (boşluklar temizlendikten sonra)
const MAX_PHOTOS = 5

function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')          // form içi hatalar (telefon, görsel, kayıt)
  const [fatalError, setFatalError] = useState('') // ürün yok / yetki yok — tüm sayfayı kaplar
  const [success, setSuccess] = useState('')
  const [originalUrls, setOriginalUrls] = useState([])
  const [ownerId, setOwnerId] = useState('')
  const [photos, setPhotos] = useState([])
  const [phoneConsent, setPhoneConsent] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    subcategory: '',
    ageGroup: '',
    brand: '',
    size: '',
    price: '',
    description: '',
    condition: 'new',
    province: '',
    district: '',
    contactPref: CONTACT_PREF.MESSAGE,
    phone: ''
  })

  const conditions = [
    { value: 'new', label: 'Yeni (Kullanılmadı)' },
    { value: 'like-new', label: 'Az Kullanılmış' },
    { value: 'used', label: 'Kullanılmış' },
    { value: 'worn', label: 'Yıpranmış' }
  ]

  const [toast, setToast] = useState('')
  const formRef = useRef(null)
  const errorRef = useRef(null)
  const toastTimer = useRef(null)

  // Hata kutusu formun üstünde; kullanıcı en alttaki düğmeye bastığı için
  // görsün diye oraya kaydır.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [error])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // Eksik/hatalı alan: alana git, kırmızı işaretle, mesajı ekranın altında göster.
  const fieldError = (field, message) => {
    showFieldError(formRef.current, field)
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 4000)
  }

  const subcategoryOptions = subcategoriesFor(formData.category)

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
          setFatalError('Bu ürünü düzenleme yetkiniz yok!')
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

        const existing = productImages(data)
        setOriginalUrls(existing)
        setPhotos(pickerItemsFromUrls(existing))
        setOwnerId(data.userId || auth.currentUser?.uid || '')

        // İletişim tercihi: yeni alan "contactPref"; eski ilanlarda alan
        // yoksa ama "phone" varsa telefon tercihi kabul ediyoruz.
        const pref = data.contactPref || (data.phone ? CONTACT_PREF.PHONE : CONTACT_PREF.MESSAGE)
        // Telefon: yeni modelde listingContacts'ten, eski ilanlarda doc'tan
        let phone = data.phone || ''
        if (pref === CONTACT_PREF.PHONE) {
          const fromContacts = await fetchListingPhone(id)
          if (fromContacts) phone = fromContacts
          // Daha önce telefon tercihi verilmişse rıza da alınmış demektir.
          setPhoneConsent(true)
        }

        // Kategori/yaş grubu ayrımından önce eklenmiş ilanlarda "category"
        // alanı eski yaş metnini taşıyordu (ör. "Bebek (3-12 ay)") ve
        // "ageGroup" hiç yoktu. O durumda kaybolmasın diye yaş grubuna
        // aktarıyoruz; ürün kategorisini ise (yeni bilgi) kullanıcının
        // seçmesi gerekiyor.
        const LEGACY_CATEGORY_TO_AGE_GROUP = {
          'Yenidoğan (0-3 ay)': 'yenidogan',
          'Bebek (3-12 ay)': 'bebek',
          'Yürüme (1-2 yaş)': 'yurume',
          'Çocuk (3-6 yaş)': 'cocuk',
          'Okul (7-12 yaş)': 'okul',
        }
        const isKnownCategory = CATEGORIES.some((c) => c.id === data.category)
        const legacyAgeGroup = !isKnownCategory ? LEGACY_CATEGORY_TO_AGE_GROUP[data.category] : undefined

        // Alt kategori, sadece kayıtlı kategorinin GERÇEK bir alt kategorisiyse
        // korunuyor (kategori bilinmiyorsa ya da alt kategori listesi
        // değiştiyse eski/anlamsız bir değeri forma taşımamak için).
        const validSubcategory = isKnownCategory &&
          subcategoriesFor(data.category).some((s) => s.id === data.subcategory)
            ? data.subcategory
            : ''

        setFormData({
          title: data.title || '',
          category: isKnownCategory ? data.category : '',
          subcategory: validSubcategory,
          ageGroup: data.ageGroup || legacyAgeGroup || '',
          brand: data.brand || '',
          size: data.size || '',
          price: data.price?.toString() || '',
          description: data.description || '',
          condition: data.condition || 'new',
          province,
          district,
          contactPref: pref,
          phone
        })
      } else {
        setFatalError('Ürün bulunamadı')
      }
    } catch (err) {
      console.error('Ürün yüklenirken hata:', err)
      setFatalError('Ürün yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    clearFieldError(e)
    const { name, value } = e.target
    setFormData(prev => {
      if (name === 'category') {
        return { ...prev, category: value, subcategory: '' }
      }
      return { ...prev, [name]: value }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (photos.length === 0) {
      setError('En az bir fotoğraf olmalı.')
      return
    }
    const invalid = validateListing(formData, { hasSubcategories: subcategoryOptions.length > 0 })
    if (invalid) {
      fieldError(invalid.field, invalid.message)
      return
    }

    const wantsPhone = formData.contactPref === CONTACT_PREF.PHONE
    const normalizedPhone = formData.phone.replace(/\s+/g, '')
    if (wantsPhone) {
      if (!PHONE_REGEX.test(normalizedPhone)) {
        fieldError('phone', 'Lütfen geçerli bir cep telefonu numarası gir (Örn: 05xx xxx xx xx).')
        return
      }
      if (!phoneConsent) {
        fieldError('phoneConsent', 'Telefon numaranın gösterilmesi için KVKK açık rıza onayını işaretlemelisin.')
        return
      }
    }

    setSubmitting(true)

    let uploaded = []
    let idToken = null
    try {
      idToken = await auth.currentUser.getIdToken()
      const result = await uploadPickedImages(photos, idToken)
      uploaded = result.uploaded

      const { phone: _omitPhone, ...rest } = formData
      const productData = {
        ...rest,
        brand: formData.brand.trim(),
        size: formData.size.trim(),
        imageUrls: result.urls,
        imageUrl: result.urls[0] || '',
        city: `${formData.province} / ${formData.district}`,
        price: parsePrice(formData.price),
        // Eski ilanlarda herkese açık dokümanda kalmış olabilecek telefonu
        // KVKK gereği temizliyoruz (numara artık listingContacts'te).
        phone: deleteField(),
        phoneConsentAt: wantsPhone ? serverTimestamp() : deleteField(),
        updatedAt: serverTimestamp()
      }

      await updateDoc(doc(db, 'products', id), productData)

      // Telefon numarasını ayrı koleksiyonda yönet
      if (wantsPhone) {
        await saveListingPhone(id, ownerId || auth.currentUser.uid, normalizedPhone)
      } else {
        await removeListingPhone(id)
      }

      // Kullanıcının kaldırdığı eski görselleri R2'den temizle.
      const removed = originalUrls.filter((u) => !result.urls.includes(u))
      if (removed.length) deleteProductImages(removed, idToken).catch(() => {})
      setOriginalUrls(result.urls)

      setSuccess('✅ Ürün başarıyla güncellendi!')
      setTimeout(() => {
        navigate(`/product/${id}`)
      }, 2000)
    } catch (err) {
      console.error('Ürün güncelleme hatası:', err)
      setError('Ürün güncellenirken bir hata oluştu: ' + err.message)
      // Güncelleme başarısızsa yeni yüklenen görseli öksüz bırakma.
      if (uploaded.length && idToken) {
        deleteProductImages(uploaded, idToken).catch(() => {})
      }
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

  if (fatalError) {
    return (
      <div className="container text-center py-5">
        <div className="display-1 mb-3">😕</div>
        <h2>{fatalError}</h2>
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

            {error && (
              <div ref={errorRef} className="alert alert-danger alert-dismissible fade show">
                ⚠️ {error}
                <button type="button" className="btn-close" onClick={() => setError('')}></button>
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label fw-semibold">Fotoğraflar <span className="text-danger">*</span></label>
                <ImagePicker items={photos} onChange={setPhotos} onError={setError} max={MAX_PHOTOS} />
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

              {/* Kategori ve Yaş Grubu */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Kategori <span className="text-danger">*</span></label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">Kategori seç</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Yaş Grubu <span className="text-danger">*</span></label>
                  <select
                    name="ageGroup"
                    value={formData.ageGroup}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">Yaş grubu seç</option>
                    {AGE_GROUPS.map((age) => (
                      <option key={age.id} value={age.id}>{age.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Alt Kategori — sadece seçilen kategorinin alt kategorisi varsa */}
              {subcategoryOptions.length > 0 && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">Alt Kategori <span className="text-danger">*</span></label>
                  <select
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
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
                  <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Örn: Chicco" className="form-control" maxLength={40} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Beden / Ölçü <small className="text-muted fw-normal">(isteğe bağlı)</small></label>
                  <input type="text" name="size" value={formData.size} onChange={handleChange} placeholder="Örn: 3-6 ay" className="form-control" maxLength={30} />
                </div>
              </div>

              {/* Fiyat ve Durum */}
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Fiyat (TL) <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Örn: 250"
                    className="form-control"
                    required
                    inputMode="decimal"
                    maxLength={12}
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
                      name="phoneConsent"
                      checked={phoneConsent}
                      onChange={(e) => { clearFieldError(e); setPhoneConsent(e.target.checked) }}
                    />
                    <label className="form-check-label small" htmlFor="phoneConsent">
                      {KVKK_CONSENT_LABEL}{' '}
                      <Link to="/gizlilik" target="_blank" className="text-pink-600">KVKK Aydınlatma Metni</Link>
                    </label>
                  </div>
                </div>
              )}

              <p className="text-muted small mt-2">
                🔒 İletişim bilgilerin KVKK kapsamında korunur. "Sadece mesajla"ya geçersen
                kayıtlı telefon numaran sistemden silinir.
              </p>

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
      {toast && <div className="cd-toast" role="alert">{toast}</div>}
    </div>
  )
}

export default EditProduct
