// src/App.jsx
import React, { Suspense, lazy, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth'
import { auth } from './firebase'
import { setupNative } from './native'
import { useUnreadCount } from './hooks/useUnreadCount'
import { SafetyProvider, useSafety } from './context/SafetyContext'
import Header from './components/Header'
import Footer from './components/Footer'
import BottomNav from './components/BottomNav'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'

// Ana sayfa dışındaki ekranlar ihtiyaç olunca yükleniyor — uygulama açılışı
// (özellikle mobilde) çok daha hızlı.
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const AddProduct = lazy(() => import('./pages/AddProduct'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const Profile = lazy(() => import('./pages/Profile'))
const EditProduct = lazy(() => import('./pages/EditProduct'))
const Messages = lazy(() => import('./pages/Messages'))
const Conversation = lazy(() => import('./pages/Conversation'))
// En sık açılan ekran: açılıştan kısa süre sonra arka planda önceden
// yükleniyor ki ana sayfadaki çip/kategori dokunuşları beklemeden geçsin.
const loadProducts = () => import('./pages/Products')
const Products = lazy(loadProducts)
const Favorites = lazy(() => import('./pages/Favorites'))
const SellerProfile = lazy(() => import('./pages/SellerProfile'))
const BlockedUsers = lazy(() => import('./pages/BlockedUsers'))
const Help = lazy(() => import('./pages/Help'))
const Gizlilik = lazy(() => import('./pages/Gizlilik'))
const Terms = lazy(() => import('./pages/Terms'))
const DeleteAccount = lazy(() => import('./pages/DeleteAccount'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageSpinner() {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
      <div className="spinner-border text-pink-600" role="status">
        <span className="visually-hidden">Yükleniyor...</span>
      </div>
    </div>
  )
}

// Router içinde bir kez: donanım geri tuşu, durum çubuğu, klavye.
function NativeBridge() {
  const navigate = useNavigate()
  useEffect(() => setupNative(navigate), [navigate])
  return null
}

// Sayfa değişince en üste kaydır; #hash varsa o öğeye git.
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

// Üstte ince bilgi bantları: e-posta doğrulama, yönetici yasağı.
function Banners({ user }) {
  const { isBanned } = useSafety()
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('cd-verify-dismissed') === '1')
  const [, forceRender] = useState(0)
  const [status, setStatus] = useState('')

  const resend = async () => {
    try {
      await sendEmailVerification(auth.currentUser)
      setStatus('Doğrulama e-postası gönderildi. Gelen kutunu (ve spam klasörünü) kontrol et.')
    } catch (err) {
      console.error(err)
      setStatus('Şu an gönderilemedi, biraz sonra tekrar dene.')
    }
  }

  const check = async () => {
    try {
      await auth.currentUser.reload()
      forceRender((n) => n + 1)
      if (!auth.currentUser.emailVerified) setStatus('Henüz doğrulanmamış görünüyor.')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      {isBanned && (
        <div className="app-banner app-banner--danger">
          Hesabın yönetici tarafından kısıtlandı; ilan ve mesaj gönderemezsin. Bir yanlışlık olduğunu
          düşünüyorsan info@cicidolap.com.tr adresine yaz.
        </div>
      )}
      {user && !user.emailVerified && !dismissed && (
        <div className="app-banner">
          <span>
            ✉️ E-postanı doğrula ({user.email}).{' '}
            {status && <strong>{status}</strong>}
          </span>
          <span className="d-flex gap-2 flex-shrink-0">
            <button type="button" className="app-banner-btn" onClick={resend}>Tekrar gönder</button>
            <button type="button" className="app-banner-btn" onClick={check}>Doğruladım</button>
            <button
              type="button"
              className="app-banner-btn"
              aria-label="Kapat"
              onClick={() => {
                sessionStorage.setItem('cd-verify-dismissed', '1')
                setDismissed(true)
              }}
            >
              ✕
            </button>
          </span>
        </div>
      )}
    </>
  )
}

function Shell({ user }) {
  const unreadCount = useUnreadCount(user)
  useEffect(() => {
    const t = setTimeout(loadProducts, 1500)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="app-shell d-flex flex-column min-vh-100">
      <NativeBridge />
      <ScrollManager />
      <Header user={user} unreadCount={unreadCount} />
      <Banners user={user} />
      <main className="flex-grow-1 app-main">
        <ErrorBoundary>
          <Suspense fallback={<PageSpinner />}>
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/add-product" element={<AddProduct />} />
              <Route path="/product/:id" element={<ProductDetail user={user} />} />
              <Route path="/satici/:uid" element={<SellerProfile user={user} />} />
              <Route path="/admin" element={<AdminPanel user={user} />} />
              <Route path="/profile" element={<Profile user={user} />} />
              <Route path="/engellenenler" element={<BlockedUsers user={user} />} />
              <Route path="/edit-product/:id" element={<EditProduct />} />
              <Route path="/messages" element={<Messages user={user} />} />
              <Route path="/messages/:conversationId" element={<Conversation user={user} />} />
              <Route path="/products" element={<Products user={user} />} />
              <Route path="/favorites" element={<Favorites user={user} />} />
              <Route path="/yardim" element={<Help />} />
              <Route path="/gizlilik" element={<Gizlilik />} />
              <Route path="/kullanim-sartlari" element={<Terms />} />
              <Route path="/hesap-sil" element={<DeleteAccount user={user} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <BottomNav user={user} unreadCount={unreadCount} />
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) return <PageSpinner />

  return (
    <BrowserRouter>
      <SafetyProvider user={user}>
        <Shell user={user} />
      </SafetyProvider>
    </BrowserRouter>
  )
}

export default App
