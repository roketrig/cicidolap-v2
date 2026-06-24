// src/App.jsx
import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import AddProduct from './pages/AddProduct'
import ProductDetail from './pages/ProductDetail'
import AdminPanel from './pages/AdminPanel'
import Profile from './pages/Profile'
import EditProduct from './pages/EditProduct'
import Messages from './pages/Messages'
import Products from './pages/Products'
function Header({ user }) {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
                {user.email === 'admin@cici-dolap.com' && (
                  <li className="nav-item">
                    <Link to="/admin" className="nav-link">⚙️ Admin</Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link to="/messages" className="nav-link position-relative">
                    💬 Mesajlar
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">3</span>
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
      <Header user={user} />
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/product/:id" element={<ProductDetail user={user} />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/profile" element={<Profile user={user} />} />
        <Route path="/edit-product/:id" element={<EditProduct />} />
        <Route path="/messages" element={<Messages user={user} />} />
        <Route path="/products" element={<Products />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App