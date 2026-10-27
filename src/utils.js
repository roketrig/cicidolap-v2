// src/utils.js
// Küçük, paylaşılan yardımcılar.

// Kullanıcının görünen adı: önce Firebase profil adı (displayName), yoksa
// e-postanın "@" öncesi kısmı, o da yoksa genel bir etiket. E-posta adresini
// olduğu gibi arayüzde göstermekten kaçınmak için her yerde bunu kullanıyoruz.
export function displayName(user) {
  if (!user) return 'Kullanıcı'
  return user.displayName?.trim() || emailToName(user.email) || 'Kullanıcı'
}

// Kaydedilmiş ad + e-postadan en iyi görünen adı seçer (ürün/konuşma
// dokümanlarında saklanan sellerName/buyerName için).
export function nameOrEmail(name, email) {
  return (name && name.trim()) || emailToName(email) || 'Kullanıcı'
}

// Arama metni üst sınırı — uzun metin başlık/etiketleri taşırıyordu.
export const SEARCH_MAX_LENGTH = 50

// Basit e-posta kontrolü. iOS WebView tarayıcının "bu alanı doldurun"
// balonlarını göstermediği için formlar boş/hatalı alanı kendisi bildiriyor.
export function emailError(email) {
  const v = email.trim()
  if (!v) return 'E-posta adresini yaz.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Geçerli bir e-posta adresi yaz.'
  return ''
}

// Firebase Auth hata kodlarını okunur Türkçe mesaja çevirir.
export function authErrorMessage(err) {
  const code = err?.code || ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-posta veya şifre hatalı.'
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi.'
    case 'auth/email-already-in-use':
      return 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.'
    case 'auth/weak-password':
      return 'Şifre çok zayıf. En az 6 karakter kullan.'
    case 'auth/too-many-requests':
      return 'Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar dene.'
    case 'auth/network-request-failed':
      return 'İnternet bağlantısı sorunlu görünüyor. Tekrar dene.'
    case 'auth/user-disabled':
      return 'Bu hesap devre dışı bırakılmış.'
    default:
      return 'Bir hata oluştu. Lütfen tekrar dene.'
  }
}

export function emailToName(email) {
  if (!email || typeof email !== 'string') return ''
  const local = email.split('@')[0]
  if (!local) return ''
  // "ayse.yilmaz" / "ayse_yilmaz" -> "Ayşe Yilmaz" değil ama "Ayse Yilmaz"
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\d+/g, '')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase('tr') + w.slice(1))
    .join(' ')
}

// "2 saat önce" tarzı göreli zaman (Firestore Timestamp, Date ya da ms alır).
export function timeAgo(value) {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value : value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return ''
  const sec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (sec < 60) return 'Az önce'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} dk önce`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} saat önce`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} gün önce`
  const month = Math.floor(day / 30)
  if (month < 12) return `${month} ay önce`
  return `${Math.floor(month / 12)} yıl önce`
}

// 1500 -> "1.500 TL", 0 -> "Bağış"
export function formatPrice(price) {
  const n = Number(price) || 0
  if (n === 0) return 'Bağış'
  return `${n.toLocaleString('tr-TR')} TL`
}

export const CONDITION_LABELS = {
  new: 'Yeni',
  'like-new': 'Az Kullanılmış',
  used: 'Kullanılmış',
  worn: 'Yıpranmış',
}

export function conditionLabel(value) {
  return CONDITION_LABELS[value] || 'Kullanılmış'
}

// Bir ürünün tüm görsel adresleri (eski tek-görselli ilanlar için imageUrl'e düşer).
export function productImages(product) {
  if (Array.isArray(product?.imageUrls) && product.imageUrls.length) return product.imageUrls
  return product?.imageUrl ? [product.imageUrl] : []
}
