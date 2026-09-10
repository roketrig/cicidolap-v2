// src/hooks/useFavorites.js
//
// Favori ürünlerin ortak yönetimi. Home, Products, Favorites ve
// ProductDetail sayfalarının hepsi bu hook'u kullanıyor — eskiden aynı
// "fetchFavorites" + "handleToggleFavorite" mantığı üç ayrı dosyada
// kopyalanmıştı.
//
// Önemli fark: kalp artık İYİMSER güncelleniyor — tıklanınca anında
// değişiyor, Firestore yazması sonra yapılıyor ve hata olursa geri
// alınıp kullanıcıya bildiriliyor. Eskiden state yalnızca "await" başarılı
// dönerse güncelleniyordu; kurallar/çevrimdışı bir sorunda kalp hiç
// değişmiyor ve sebebi belli olmuyordu.

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export function useFavorites(user) {
  const [favoriteIds, setFavoriteIds] = useState(() => new Set())
  // favoriteIds'in güncel kopyasını ref'te tutuyoruz ki toggleFavorite'in
  // kimliği değişmesin (ProductCard React.memo ile sarılı — her favori
  // değişiminde tüm kartların yeniden render olmasını engelliyor).
  const favoriteIdsRef = useRef(favoriteIds)
  useEffect(() => {
    favoriteIdsRef.current = favoriteIds
  }, [favoriteIds])

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set())
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'favorites'), where('userId', '==', user.uid))
        )
        if (!cancelled) {
          setFavoriteIds(new Set(snap.docs.map((d) => d.data().productId)))
        }
      } catch (error) {
        console.error('Favoriler yüklenirken hata:', error)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const toggleFavorite = useCallback(
    async (productId) => {
      if (!user) {
        alert('Favorilere eklemek için lütfen giriş yapın!')
        return
      }

      const favRef = doc(db, 'favorites', `${user.uid}_${productId}`)
      const wasFavorited = favoriteIdsRef.current.has(productId)

      // 1) Arayüzü hemen güncelle
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        if (wasFavorited) next.delete(productId)
        else next.add(productId)
        return next
      })

      // 2) Firestore'a yaz, hata olursa geri al
      try {
        if (wasFavorited) {
          await deleteDoc(favRef)
        } else {
          await setDoc(favRef, {
            userId: user.uid,
            productId,
            createdAt: serverTimestamp(),
          })
        }
      } catch (error) {
        console.error('Favori güncellenemedi:', error)
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          if (wasFavorited) next.add(productId)
          else next.delete(productId)
          return next
        })
        alert('Favori kaydedilemedi. Lütfen tekrar dene.')
      }
    },
    [user]
  )

  return { favoriteIds, toggleFavorite }
}
