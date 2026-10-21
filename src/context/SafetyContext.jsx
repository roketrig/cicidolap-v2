// src/context/SafetyContext.jsx
//
// Engellenenler + yasak durumunu uygulama genelinde tek seferde yükleyip
// paylaşıyor (Home, Products, Messages, ProductDetail... hepsi aynı veriyi
// kullanıyor). Firestore kuralları henüz yayınlanmamışsa (blocks koleksiyonu
// izinli değilse) hata fırlatmak yerine boş liste ile devam eder.
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { blockUser, unblockUser, fetchBlocked, fetchIsBanned } from '../safety'

const SafetyContext = createContext({
  blocked: [],
  blockedIds: new Set(),
  isBanned: false,
  isBlocked: () => false,
  block: async () => {},
  unblock: async () => {},
})

export function SafetyProvider({ user, children }) {
  const [blocked, setBlocked] = useState([])
  const [isBanned, setIsBanned] = useState(false)

  useEffect(() => {
    if (!user) {
      setBlocked([])
      setIsBanned(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const list = await fetchBlocked(user.uid)
        if (!cancelled) setBlocked(list)
      } catch (err) {
        console.warn('Engellenenler yüklenemedi (kurallar yayınlanmamış olabilir):', err?.code || err)
      }
      const banned = await fetchIsBanned(user.uid)
      if (!cancelled) setIsBanned(banned)
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const blockedIds = useMemo(() => new Set(blocked.map((b) => b.blockedId)), [blocked])

  const block = useCallback(
    async (blockedId, blockedName) => {
      if (!user) return
      await blockUser(user, blockedId, blockedName)
      setBlocked((prev) =>
        prev.some((b) => b.blockedId === blockedId) ? prev : [...prev, { blockedId, blockedName }]
      )
    },
    [user]
  )

  const unblock = useCallback(
    async (blockedId) => {
      if (!user) return
      await unblockUser(user, blockedId)
      setBlocked((prev) => prev.filter((b) => b.blockedId !== blockedId))
    },
    [user]
  )

  const value = useMemo(
    () => ({
      blocked,
      blockedIds,
      isBanned,
      isBlocked: (uid) => blockedIds.has(uid),
      block,
      unblock,
    }),
    [blocked, blockedIds, isBanned, block, unblock]
  )

  return <SafetyContext.Provider value={value}>{children}</SafetyContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSafety() {
  return useContext(SafetyContext)
}
