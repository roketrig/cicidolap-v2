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
