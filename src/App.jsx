// src/App.jsx
import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase'
import { ADMIN_EMAIL } from './constants'
import { isUnread } from './chat'
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
import NotFound from './pages/NotFound'

function Header({ user }) {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

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
<Link to="/" className="navbar-brand fw-bold text-pink-600 d-flex align-items-center gap-2">
  <span className="fs-2">🧸</span>  {/* Yeni Logo: Oyuncak Ayı */}
  <span>Cici Dolap</span>
</Link>
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
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
                  <Link to="/profile" className="nav-link">👤 Profilim</Link>
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
            <span className="fs-3">🧸</span>
            <span className="cd-footer-brand">Cici Dolap</span>
          </div>
          <p className="mb-0 small" style={{ color: 'rgba(255,255,255,0.75)' }}>
            0-12 yaş çocuk ürünleri için sıcacık ikinci el pazarı 💗
          </p>
        </div>
        <hr />
        <div className="text-center">
          <small>© {new Date().getFullYear()} Cici Dolap · Sevgiyle, Türkiye'de 🇹🇷</small>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
