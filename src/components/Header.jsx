// src/components/Header.jsx
//
// Üst çubuk: logo + kalıcı arama + hızlı aksiyonlar. Masaüstünde altında
// kategori menüsü (CategoryNav), mobilde alt gezinme çubuğu (BottomNav)
// tamamlıyor. Eski hamburger menü kaldırıldı.
import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { ADMIN_EMAIL } from '../constants'
import { displayName } from '../utils'
import logo from '../assets/cicidolap-logo.png'
import Icon from './Icon'
import CategoryNav from './CategoryNav'

export default function Header({ user, unreadCount }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [term, setTerm] = useState('')

  // /products?q=... açıkken arama kutusu o değeri göstersin.
  useEffect(() => {
    if (location.pathname === '/products') {
      setTerm(new URLSearchParams(location.search).get('q') || '')
    }
  }, [location.pathname, location.search])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = term.trim()
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/')
    } catch (error) {
      console.error('Çıkış yaparken hata:', error)
    }
  }

  const searchForm = (
    <form className="header-search" onSubmit={handleSearch} role="search">
      <Icon name="search" size={18} className="header-search-icon" />
      <input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Tulum, bebek arabası, oyuncak ara…"
        aria-label="Ürün ara"
        enterKeyHint="search"
      />
      <button type="submit" className="header-search-btn">Ara</button>
    </form>
  )

  return (
    <header className="site-header sticky-top">
      <div className="container header-row">
        <Link to="/" className="navbar-brand d-flex align-items-center me-0">
          <img src={logo} alt="Cici Dolap" className="navbar-logo" />
        </Link>

        <div className="header-search-wrap d-none d-lg-block">{searchForm}</div>

        <nav className="header-actions" aria-label="Hesap">
          {user ? (
            <>
              <Link to="/add-product" className="btn btn-pink rounded-pill px-3 d-none d-lg-inline-flex align-items-center gap-1">
                <Icon name="plus" size={18} strokeWidth={2.4} /> İlan Ver
              </Link>
              <Link to="/favorites" className="header-icon-btn" aria-label="Favorilerim" title="Favorilerim">
                <Icon name="heart" size={22} />
              </Link>
              <Link to="/messages" className="header-icon-btn d-none d-lg-inline-flex" aria-label="Mesajlar" title="Mesajlar">
                <Icon name="chat" size={22} />
                {unreadCount > 0 && <span className="header-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </Link>
              {user.email === ADMIN_EMAIL && (
                <Link to="/admin" className="header-icon-btn d-none d-lg-inline-flex" aria-label="Admin" title="Admin paneli">
                  <Icon name="settings" size={22} />
                </Link>
              )}
              <Link to="/profile" className="header-user d-none d-lg-inline-flex" title="Profilim">
                <span className="header-avatar">{displayName(user).charAt(0).toLocaleUpperCase('tr')}</span>
                <span className="header-user-name">{displayName(user)}</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-outline-secondary btn-sm rounded-pill d-none d-lg-inline-block">
                Çıkış
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline-pink btn-sm rounded-pill px-3">Giriş</Link>
              <Link to="/register" className="btn btn-pink btn-sm rounded-pill px-3 d-none d-sm-inline-block">Kayıt Ol</Link>
            </>
          )}
        </nav>
      </div>

      {/* Mobil arama satırı (anasayfada hero içindeki arama zaten var) */}
      {!['/', '/login', '/register', '/forgot-password'].includes(location.pathname) && (
        <div className="container header-search-mobile d-lg-none">{searchForm}</div>
      )}

      <CategoryNav />
    </header>
  )
}
