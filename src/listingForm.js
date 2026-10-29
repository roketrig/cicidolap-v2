// src/listingForm.js
//
// "İlan Ver" ve "İlanı Düzenle" formlarının ortak doğrulaması. Formlar
// noValidate: Android/iOS uygulamasındaki WebView tarayıcının "bu alanı
// doldurun" balonunu göstermiyor — eksik bir alan varken düğme sessizce
// hiçbir şey yapmıyordu ve kullanıcı ilan veremediğini sanıyordu.

// Türkçe yazılmış fiyatı sayıya çevirir: "1.500" → 1500, "49,90" → 49.9,
// "1.250,50 TL" → 1250.5. Anlaşılamazsa NaN.
export function parsePrice(input) {
  let s = String(input ?? '').replace(/tl|₺|\s/gi, '')
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.')
  else s = s.replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN
  return Number(s)
}

export const MAX_PRICE = 1000000

const REQUIRED = [
  ['title', 'Başlık'],
  ['category', 'Kategori'],
  ['ageGroup', 'Yaş grubu'],
  ['subcategory', 'Alt kategori'],
  ['price', 'Fiyat'],
  ['condition', 'Ürün durumu'],
  ['description', 'Açıklama'],
  ['province', 'İl'],
  ['district', 'İlçe'],
]

// İlk hatalı alanı { field, message } olarak döner; sorun yoksa null.
// `hasSubcategories`: seçili kategorinin alt kategorisi varsa alan zorunlu.
export function validateListing(formData, { hasSubcategories }) {
  for (const [field, label] of REQUIRED) {
    if (field === 'subcategory' && !hasSubcategories) continue
    if (!String(formData[field] ?? '').trim()) {
      return { field, message: `Lütfen "${label}" alanını doldur.` }
    }
  }
  const price = parsePrice(formData.price)
  if (Number.isNaN(price)) {
    return { field: 'price', message: 'Fiyatı sadece rakamla yaz (örn: 250 ya da 1.500). Bağış için 0 yaz.' }
  }
  if (price > MAX_PRICE) {
    return { field: 'price', message: 'Fiyat çok yüksek görünüyor, lütfen kontrol et.' }
  }
  return null
}

// Hatalı alanı kırmızıyla işaretleyip ekrana getirir ve odaklar. İşaret,
// kullanıcı alanı değiştirince (bkz. clearFieldError) kalkar.
export function showFieldError(form, field) {
  const el = form?.querySelector(`[name="${field}"]`)
  if (!el) return
  el.classList.add('is-invalid')
  el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  el.focus({ preventScroll: true })
}

export function clearFieldError(e) {
  e.target.classList.remove('is-invalid')
}
