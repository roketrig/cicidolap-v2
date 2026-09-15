// src/pages/EditProduct.jsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { ADMIN_EMAIL } from '../constants'
import { TURKISH_PROVINCES } from '../data/turkishProvinces'
import { CATEGORIES, AGE_GROUPS, subcategoriesFor } from '../data/categories'
import { uploadProductImage, deleteProductImage } from '../imageUpload'
import { CONTACT_PREF, KVKK_CONSENT_LABEL, saveListingPhone, removeListingPhone, fetchListingPhone } from '../contact'

const PHONE_REGEX = /^0?5\d{9}$/ // 05xx xxx xx xx (boşluklar temizlendikten sonra)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')          // form içi hatalar (telefon, görsel, kayıt)
  const [fatalError, setFatalError] = useState('') // ürün yok / yetki yok — tüm sayfayı kaplar
  const [success, setSuccess] = useState('')
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [phoneConsent, setPhoneConsent] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    subcategory: '',
    ageGroup: '',
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

  const subcategoryOptions = subcategoriesFor(formData.category)

  useEffect(() => {
    fetchProduct()
  }, [id])

  // Görsel önizleme blob URL'sini temizle.
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

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

        setCurrentImageUrl(data.imageUrl || '')
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
    const { name, value } = e.target
    setFormData(prev => {
      if (name === 'category') {
        return { ...prev, category: value, subcategory: '' }
      }
      return { ...prev, [name]: value }
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
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

    setSubmitting(true)

    let newImageUrl = ''
    let idToken = null
    try {
      if (image) {
        idToken = await auth.currentUser.getIdToken()
        newImageUrl = await uploadProductImage(image, idToken)
      }

      const { phone: _omitPhone, ...rest } = formData
      const productData = {
        ...rest,
        city: `${formData.province} / ${formData.district}`,
        price: parseFloat(formData.price) || 0,
        // Eski ilanlarda herkese açık dokümanda kalmış olabilecek telefonu
        // KVKK gereği temizliyoruz (numara artık listingContacts'te).
        phone: deleteField(),
        phoneConsentAt: wantsPhone ? serverTimestamp() : deleteField(),
        updatedAt: serverTimestamp()
      }
      if (newImageUrl) productData.imageUrl = newImageUrl

      await updateDoc(doc(db, 'products', id), productData)

      // Telefon numarasını ayrı koleksiyonda yönet
      if (wantsPhone) {
        await saveListingPhone(id, ownerId || auth.currentUser.uid, normalizedPhone)
      } else {
        await removeListingPhone(id)
      }

      // Yeni görsel yüklendiyse eskisini R2'den temizle.
      if (newImageUrl && currentImageUrl && currentImageUrl !== newImageUrl) {
        deleteProductImage(currentImageUrl, idToken).catch(() => {})
        setCurrentImageUrl(newImageUrl)
      }

      setSuccess('✅ Ürün başarıyla güncellendi!')
      setTimeout(() => {
        navigate(`/product/${id}`)
      }, 2000)
    } catch (err) {
      console.error('Ürün güncelleme hatası:', err)
      setError('Ürün güncellenirken bir hata oluştu: ' + err.message)
      // Güncelleme başarısızsa yeni yüklenen görseli öksüz bırakma.
      if (newImageUrl && idToken) {
        deleteProductImage(newImageUrl, idToken).catch(() => {})
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
              <div className="alert alert-danger alert-dismissible fade show">
                ⚠️ {error}
                <button type="button" className="btn-close" onClick={() => setError('')}></button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Ürün Görseli */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Ürün Görseli</label>
                <div className="d-flex align-items-center gap-3">
                  <div className="flex-shrink-0" style={{ width: '90px', height: '90px' }}>
                    {imagePreview || currentImageUrl ? (
                      <img
                        src={imagePreview || currentImageUrl}
                        alt="Ürün görseli"
                        className="img-fluid rounded-3 object-fit-cover w-100 h-100 border"
                      />
                    ) : (
                      <div className="d-flex align-items-center justify-content-center bg-light rounded-3 w-100 h-100">
                        <span className="fs-3 opacity-25">📷</span>
                      </div>
                    )}
                  </div>
                  <label className="btn btn-outline-secondary flex-grow-1 py-3 border-dashed">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="d-none" />
                    <span className="small">{currentImageUrl ? 'Görseli değiştir' : 'Resim seç'}</span>
                  </label>
                </div>
                <small className="text-muted">JPG, PNG, WebP (Max 5MB). Boş bırakırsan mevcut görsel korunur.</small>
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
    </div>
  )
}

export default EditProduct
