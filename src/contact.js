// src/contact.js
//
// İlan iletişim tercihleri ve telefon numarası yönetimi.
//
// KVKK: Telefon numarası kişisel veridir; ilan sahibinin AÇIK RIZASI
// olmadan gösterilemez. Bu yüzden numara herkese açık "products"
// dokümanında DEĞİL, ayrı "listingContacts/{productId}" dokümanında
// tutulur ve yalnızca giriş yapmış kullanıcılar okuyabilir (bkz.
// firestore.rules). İlan sahibi "Sadece mesaj" seçerse numara hiç
// saklanmaz.

import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// products.contactPref alanının alabileceği değerler
export const CONTACT_PREF = {
  MESSAGE: 'message', // sadece uygulama içi mesaj
  PHONE: 'phone',     // mesaj + telefon (açık rıza ile)
}

export const KVKK_CONSENT_LABEL =
  "Telefon numaramın, ilan yayında olduğu sürece Cici Dolap'a giriş yapmış " +
  'kullanıcılara gösterilmesine açık rıza veriyorum.'

// "05551234567" -> "0555 123 45 67"
export function formatPhone(raw) {
  const d = (raw || '').replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('0')) {
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`
  }
  if (d.length === 10) {
    return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`
  }
  return raw || ''
}

// "tel:" bağlantısı için +90 formatı
export function telHref(raw) {
  const d = (raw || '').replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('0')) return `tel:+90${d.slice(1)}`
  if (d.startsWith('90')) return `tel:+${d}`
  return `tel:+90${d}`
}

// İlan sahibinin telefonunu ayrı koleksiyona yazar.
export async function saveListingPhone(productId, sellerId, phone) {
  await setDoc(doc(db, 'listingContacts', productId), {
    phone,
    sellerId,
    updatedAt: serverTimestamp(),
  })
}

// Telefonu kaldırır (tercih "sadece mesaj"a çevrilince ya da ürün silinince).
// Sessizce başarısız olur.
export async function removeListingPhone(productId) {
  try {
    await deleteDoc(doc(db, 'listingContacts', productId))
  } catch (err) {
    console.error('İletişim kaydı silinemedi (göz ardı edildi):', err)
  }
}

// Giriş yapmış kullanıcı için ilan telefonunu getirir; yoksa '' döner.
export async function fetchListingPhone(productId) {
  try {
    const snap = await getDoc(doc(db, 'listingContacts', productId))
    return snap.exists() ? snap.data().phone || '' : ''
  } catch (err) {
    console.error('İletişim bilgisi alınamadı:', err)
    return ''
  }
}
