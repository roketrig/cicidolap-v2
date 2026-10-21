// src/safety.js
//
// Kullanıcı üretimi içerik (ilan + mesaj) olan uygulamalarda Google Play ve
// App Store (Kural 1.2) şunları zorunlu tutuyor: uygunsuz içeriği/kullanıcıyı
// ŞİKAYET edebilme, kullanıcıyı ENGELLEYEBİLME ve yöneticinin bunlara
// aksiyon alabilmesi. Bu modül ilk ikisinin istemci tarafı; admin tarafı
// AdminPanel.jsx'teki "Şikayetler" sekmesinde, kurallar firestore.rules'ta.
//
//   reports/{id}            şikayet kaydı (sadece admin okur)
//   blocks/{blocker}_{blocked}  engelleme (sadece engelleyen okur/siler)
//   bans/{uid}              yönetici yasağı (sadece admin yazar)

import {
  collection,
  addDoc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export const REPORT_REASONS = [
  { id: 'inappropriate', label: 'Uygunsuz içerik' },
  { id: 'fraud', label: 'Sahte ürün / dolandırıcılık şüphesi' },
  { id: 'prohibited', label: 'Yasaklı veya güvensiz ürün' },
  { id: 'harassment', label: 'Taciz / rahatsız edici davranış' },
  { id: 'spam', label: 'Spam / reklam' },
  { id: 'other', label: 'Diğer' },
]

export function reasonLabel(id) {
  return REPORT_REASONS.find((r) => r.id === id)?.label || id
}

// type: 'listing' | 'user' | 'conversation'
// evidence: konuşma şikayetlerinde şikayet edenin gördüğü son mesajlar (özel
// mesajlara admin erişimi vermek yerine kanıt şikayete eklenir).
export async function submitReport({ reporter, type, targetId, targetOwnerId, reason, details, evidence }) {
  await addDoc(collection(db, 'reports'), {
    type,
    targetId,
    targetOwnerId: targetOwnerId || '',
    reporterId: reporter.uid,
    reason,
    details: (details || '').trim().slice(0, 1000),
    status: 'open',
    ...(evidence?.length ? { evidence: evidence.slice(-20) } : {}),
    createdAt: serverTimestamp(),
  })
}

export async function blockUser(blocker, blockedId, blockedName) {
  await setDoc(doc(db, 'blocks', `${blocker.uid}_${blockedId}`), {
    blockerId: blocker.uid,
    blockedId,
    blockedName: blockedName || '',
    createdAt: serverTimestamp(),
  })
}

export async function unblockUser(blocker, blockedId) {
  await deleteDoc(doc(db, 'blocks', `${blocker.uid}_${blockedId}`))
}

// Kullanıcının engellediği kişiler: [{ blockedId, blockedName }]
export async function fetchBlocked(uid) {
  const snap = await getDocs(query(collection(db, 'blocks'), where('blockerId', '==', uid)))
  return snap.docs.map((d) => d.data())
}

// Yönetici yasağı var mı? (kullanıcı kendi dokümanını okuyabilir)
export async function fetchIsBanned(uid) {
  try {
    const snap = await getDoc(doc(db, 'bans', uid))
    return snap.exists()
  } catch {
    return false
  }
}
