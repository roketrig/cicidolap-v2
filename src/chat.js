// src/chat.js
//
// Ürün bazlı, çift yönlü mesajlaşma. Her ürün + alıcı çifti için tek bir
// "conversations/{cid}" dokümanı ve altında "messages" alt koleksiyonu var.
// Satıcı her zaman ürünün sahibi (product.userId), alıcı ise mesajı ilk
// başlatan kişidir.
//
//   conversations/{productId}__{buyerId}
//     participants: [sellerId, buyerId]   -> "array-contains" sorgusu için
//     lastText / lastAt / lastSenderId    -> liste ekranında önizleme
//     lastReadAt: { [uid]: Timestamp }    -> okunmamış rozetini hesaplamak için
//   conversations/{cid}/messages/{mid}
//     senderId / text / createdAt
//
// Eski tek yönlü "messages" koleksiyonunun yerini aldı.

import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const MAX_MESSAGE_LENGTH = 2000

// Konuşma kimliği ürün + alıcıdan türetiliyor; böylece aynı kişi aynı ürün
// için ikinci bir konuşma açamıyor ve güvenlik kuralları kimliği
// doğrulayabiliyor.
export function conversationId(productId, buyerId) {
  return `${productId}__${buyerId}`
}

// Bir mesajı konuşmaya ekler ve konuşmanın "son mesaj" özetini günceller.
// Gönderen için okundu zamanını da ilerletir (kendi mesajın okunmamış
// sayılmaz).
export async function addMessage(cid, senderId, rawText) {
  const text = (rawText || '').trim().slice(0, MAX_MESSAGE_LENGTH)
  if (!text) return

  await addDoc(collection(db, 'conversations', cid, 'messages'), {
    senderId,
    text,
    createdAt: serverTimestamp(),
  })

  await updateDoc(doc(db, 'conversations', cid), {
    lastText: text,
    lastAt: serverTimestamp(),
    lastSenderId: senderId,
    [`lastReadAt.${senderId}`]: serverTimestamp(),
  })
}

// Alıcının bir ürün hakkında ilk mesajı göndermesi: konuşma yoksa oluşturur,
// sonra mesajı ekler. Var olan konuşmaya tekrar yazınca sadece mesaj eklenir.
// Konuşma kimliğini döner (thread ekranına yönlendirmek için).
export async function startConversation({ product, buyer, text }) {
  const cid = conversationId(product.id, buyer.uid)
  const convRef = doc(db, 'conversations', cid)
  const snap = await getDoc(convRef)

  if (!snap.exists()) {
    await setDoc(convRef, {
      productId: product.id,
      productTitle: product.title || '',
      productImageUrl: product.imageUrl || '',
      sellerId: product.userId,
      buyerId: buyer.uid,
      participants: [product.userId, buyer.uid],
      sellerEmail: product.userEmail || '',
      buyerEmail: buyer.email || '',
      createdAt: serverTimestamp(),
      lastReadAt: {},
    })
  }

  await addMessage(cid, buyer.uid, text)
  return cid
}

// Kullanıcı konuşmayı açtığında kendi okundu zamanını günceller. Sessizce
// başarısız olur — okundu işareti kritik değil.
export async function markConversationRead(cid, uid) {
  try {
    await updateDoc(doc(db, 'conversations', cid), {
      [`lastReadAt.${uid}`]: serverTimestamp(),
    })
  } catch (err) {
    console.error('Konuşma okundu olarak işaretlenemedi:', err)
  }
}

// Konuşmada bu kullanıcı için okunmamış mesaj var mı? Son mesajı karşı taraf
// attıysa ve kullanıcının okundu zamanı son mesajdan eskiyse okunmamıştır.
export function isUnread(conv, uid) {
  if (!conv || !conv.lastSenderId || conv.lastSenderId === uid) return false
  const lastAt = conv.lastAt
  if (!lastAt?.toMillis) return false
  const lastRead = conv.lastReadAt?.[uid]
  if (!lastRead?.toMillis) return true
  return lastAt.toMillis() > lastRead.toMillis()
}

// Konuşmadaki "karşı taraf" bilgisi (thread başlığı için).
export function otherParty(conv, uid) {
  const amSeller = conv.sellerId === uid
  return {
    id: amSeller ? conv.buyerId : conv.sellerId,
    email: amSeller ? conv.buyerEmail : conv.sellerEmail,
    myRole: amSeller ? 'seller' : 'buyer',
  }
}
