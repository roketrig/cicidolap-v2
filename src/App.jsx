// src/App.jsx
import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase'
import { ADMIN_EMAIL } from './constants'
import { isUnread } from './chat'
import { displayName } from './utils'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import AddProduct from './pages/AddProduct'
import ProductDetail from './pages/ProductDetail'
import AdminPanel from './pages/AdminPanel'
import Profile from './pages/Profile'
import EditProduct from './pages/EditProduct'
import Messages from './pages/Messages'
import Conversation from './pages/Conversation'
import Products from './pages/Products'
import Favorites from './pages/Favorites'
import Gizlilik from './pages/Gizlilik'
import NotFound from './pages/NotFound'
import ErrorBoundary from './components/ErrorBoundary'
import logo from './assets/cicidolap-logo.png'

function Header({ user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Sayfa değişince açık mobil menüyü kapat.
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  // Okunmamış mesaj rozeti: kullanıcının katıldığı konuşmalardan, son
  // mesajı karşı tarafın attığı ve henüz okunmamış olanların sayısı.
  // Canlı (onSnapshot) güncelleniyor, 0 iken rozet hiç görünmüyor.
  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0
      snapshot.forEach((docSnap) => {
        if (isUnread(docSnap.data(), user.uid)) count++
      })
      setUnreadCount(count)
    }, (error) => {
      console.error('Okunmamış mesaj sayısı alınırken hata:', error)
    })
    return () => unsubscribe()
  }, [user])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/')
    } catch (error) {
      console.error('Çıkış yaparken hata:', error)
    }
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container">
              <Link to="/" className="navbar-brand d-flex align-items-center">
                <img src={logo} alt="Cici Dolap" className="navbar-logo" />
              </Link>
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menüyü aç/kapat"
          aria-expanded={isMenuOpen}
          aria-controls="ana-menu"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div id="ana-menu" className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
          <ul className="navbar-nav ms-auto align-items-center gap-2">
            <li className="nav-item">
              <Link to="/" className="nav-link">Ana Sayfa</Link>
            </li>

            {user ? (
              <>
                <li className="nav-item">
                  <Link to="/add-product" className="btn btn-pink rounded-pill px-4">
                    ➕ Ürün Ekle
                  </Link>
                </li>
                {user.email === ADMIN_EMAIL && (
                  <li className="nav-item">
                    <Link to="/admin" className="nav-link">⚙️ Admin</Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link to="/favorites" className="nav-link">🤍 Favorilerim</Link>
                </li>
                <li className="nav-item">
                  <Link to="/messages" className="nav-link position-relative">
                    💬 Mesajlar
                    {unreadCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/profile" className="nav-link">👤 {displayName(user)}</Link>
                </li>
                <li className="nav-item">
                  <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">Çıkış</button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link to="/login" className="nav-link">Giriş</Link>
                </li>
                <li className="nav-item">
                  <Link to="/register" className="btn btn-pink rounded-pill px-4">Kayıt Ol</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="cd-footer">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <img src={logo} alt="Cici Dolap" className="footer-logo" />
          </div>
          <p className="mb-0 small" style={{ color: 'rgba(255,255,255,0.75)' }}>
            0-12 yaş çocuk ürünleri için sıcacık ikinci el pazarı 💗
          </p>
        </div>
        <hr />
        <div className="text-center">
          <small>
            © {new Date().getFullYear()} Cici Dolap · Sevgiyle, Türkiye'de 🇹🇷
            {' · '}
            <Link to="/gizlilik" style={{ color: 'rgba(255,255,255,0.75)' }}>Gizlilik & KVKK</Link>
          </small>
        </div>
      </div>
    </footer>
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-pink-600" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="d-flex flex-column min-vh-100">
        <Header user={user} />
        <div className="flex-grow-1">
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/product/:id" element={<ProductDetail user={user} />} />
            <Route path="/admin" element={<AdminPanel user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/edit-product/:id" element={<EditProduct />} />
            <Route path="/messages" element={<Messages user={user} />} />
            <Route path="/messages/:conversationId" element={<Conversation user={user} />} />
            <Route path="/products" element={<Products user={user} />} />
            <Route path="/favorites" element={<Favorites user={user} />} />
            <Route path="/gizlilik" element={<Gizlilik />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
