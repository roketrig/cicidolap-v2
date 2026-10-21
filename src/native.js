// src/native.js
//
// Capacitor (Android/iOS) ile web arasındaki farkları tek yerde topluyor.
// Web'de her şey sessizce no-op'a düşüyor — aynı kod hem tarayıcıda hem
// mağaza uygulamasında çalışıyor.
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Keyboard } from '@capacitor/keyboard'
import { Share } from '@capacitor/share'

export const isNative = () => Capacitor.isNativePlatform()
export const platform = () => Capacitor.getPlatform() // 'web' | 'android' | 'ios'

// <html> üstüne sınıf ekliyoruz; CSS buna bakıp web footer'ını gizleyip
// uygulamaya özel boşlukları ayarlıyor.
export function markPlatformOnRoot() {
  const root = document.documentElement
  root.classList.add(`platform-${platform()}`)
  if (isNative()) root.classList.add('is-native')
}

// Durum çubuğu, klavye ve donanım geri tuşu. Router içinden bir kez çağrılır.
// Temizleme fonksiyonu döner.
export function setupNative(navigate) {
  if (!isNative()) return () => {}
  const handles = []
  const add = async (promise) => {
    try {
      const h = await promise
      if (h?.remove) handles.push(h)
    } catch (err) {
      console.warn('Yerel dinleyici eklenemedi:', err)
    }
  }

  StatusBar.setStyle({ style: Style.Light }).catch(() => {})

  // Android donanım geri tuşu: önce uygulama içinde geri, ana sayfadaysa çık.
  add(CapApp.addListener('backButton', () => {
    const idx = window.history.state?.idx ?? 0
    if (idx > 0) {
      navigate(-1)
    } else if (window.location.pathname !== '/') {
      navigate('/', { replace: true })
    } else {
      CapApp.exitApp()
    }
  }))

  // Klavye açıkken alt gezinme çubuğu gizlensin (CSS: html.keyboard-open).
  const root = document.documentElement
  add(Keyboard.addListener('keyboardWillShow', () => root.classList.add('keyboard-open')))
  add(Keyboard.addListener('keyboardWillHide', () => root.classList.remove('keyboard-open')))

  return () => handles.forEach((h) => h.remove())
}

// Paylaş: mağaza uygulamasında yerel paylaşım sayfası, web'de Web Share API,
// o da yoksa bağlantıyı panoya kopyalar. 'shared' | 'copied' | 'cancelled' döner.
export async function shareLink({ title, text, url }) {
  try {
    if (isNative()) {
      await Share.share({ title, text, url, dialogTitle: 'Paylaş' })
      return 'shared'
    }
    if (navigator.share) {
      await navigator.share({ title, text, url })
      return 'shared'
    }
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch (err) {
    if (err?.name === 'AbortError') return 'cancelled'
    console.warn('Paylaşılamadı:', err)
    return 'cancelled'
  }
}
