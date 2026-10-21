// src/account.js
//
// Hesap silme (Google Play, hesap açılabilen her uygulamada kullanıcının
// hesabını + verilerini silebilmesini zorunlu kılıyor — bkz.
// android/RELEASE.md madde 3, ve UI tarafı için src/pages/DeleteAccount.jsx).
//
// Kapsam: kullanıcının kendi ÜRÜNLERİ (+ R2 görselleri + telefon kaydı),
// FAVORİLERİ ve Firebase Auth hesabı siliniyor. Konuşmalar/mesajlar
// bilerek silinmiyor — bunlar tek taraflı değil, karşı tarafın da parçası
// olduğu ortak bir yazışma; bu kapsam Gizlilik sayfasında açıkça belirtiliyor.
//
// Firebase, hassas işlemler (hesap silme dahil) için YAKIN ZAMANLI giriş
// ister — bu yüzden önce şifreyle yeniden kimlik doğrulaması yapılıyor.

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
} from 'firebase/firestore'
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from 'firebase/auth'
import { db } from './firebase'
import { deleteProductImages } from './imageUpload'
import { productImages } from './utils'
import { removeListingPhone } from './contact'

// Yanlış şifre / çok eski oturum gibi durumlarda anlaşılır mesaj döner.
export async function reauthenticate(user, password) {
  const credential = EmailAuthProvider.credential(user.email, password)
  await reauthenticateWithCredential(user, credential)
}

// Kullanıcının kendi ürünlerini (görsel + telefon kaydı dahil) ve
// favorilerini siler. Firestore rules zaten "sadece kendi verin" der,
// burada ekstra bir kontrole gerek yok. Tek tek ürünlerde hata olsa bile
// diğerleriyle devam eder — silme sürecinin tamamı tek bir ürün yüzünden
// yarıda kalmasın diye.
async function deleteOwnedData(user) {
  const idToken = await user.getIdToken(true)

  const productsSnap = await getDocs(
    query(collection(db, 'products'), where('userId', '==', user.uid))
  )
  for (const productDoc of productsSnap.docs) {
    const product = productDoc.data()
    try {
      await deleteProductImages(productImages(product), idToken)
    } catch (err) {
      console.error('Ürün görseli silinemedi (göz ardı edildi):', err)
    }
    await removeListingPhone(productDoc.id) // kendi içinde hataları yutuyor
    try {
      await deleteDoc(doc(db, 'products', productDoc.id))
    } catch (err) {
      console.error('Ürün silinemedi:', productDoc.id, err)
    }
  }

  // Kullanıcının engelleme kayıtları (başkalarının engel kayıtları kalır).
  try {
    const blocksSnap = await getDocs(
      query(collection(db, 'blocks'), where('blockerId', '==', user.uid))
    )
    for (const b of blocksSnap.docs) await deleteDoc(doc(db, 'blocks', b.id))
  } catch (err) {
    console.error('Engel kayıtları silinemedi (göz ardı edildi):', err)
  }

  const favoritesSnap = await getDocs(
    query(collection(db, 'favorites'), where('userId', '==', user.uid))
  )
  for (const favDoc of favoritesSnap.docs) {
    try {
      await deleteDoc(doc(db, 'favorites', favDoc.id))
    } catch (err) {
      console.error('Favori silinemedi:', favDoc.id, err)
    }
  }
}

// Tam hesap silme akışı: yeniden kimlik doğrula → verileri sil → Auth
// hesabını sil. Sıra önemli: Auth hesabı silinince request.auth artık
// mevcut olmayacağından Firestore kurallarına göre yazma yetkisi kalmaz.
export async function deleteMyAccount(user, password) {
  await reauthenticate(user, password)
  await deleteOwnedData(user)
  await deleteUser(user)
}
