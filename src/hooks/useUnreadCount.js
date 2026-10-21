// src/hooks/useUnreadCount.js
//
// Okunmamış mesaj rozeti: kullanıcının katıldığı konuşmalardan, son mesajı
// karşı tarafın attığı ve henüz okunmamış olanların sayısı. Canlı
// (onSnapshot) güncelleniyor. Header ve BottomNav aynı değeri paylaşsın diye
// App'te bir kez çağrılıp prop olarak iniyor.
import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { isUnread } from '../chat'

export function useUnreadCount(user) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setCount(0)
      return
    }
    const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let n = 0
        snapshot.forEach((d) => {
          if (isUnread(d.data(), user.uid)) n++
        })
        setCount(n)
      },
      (error) => console.error('Okunmamış mesaj sayısı alınırken hata:', error)
    )
    return () => unsubscribe()
  }, [user])

  return count
}
