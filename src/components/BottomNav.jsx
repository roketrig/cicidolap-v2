// src/components/BottomNav.jsx
//
// Mobil (web ≤ 991px + mağaza uygulaması) alt gezinme çubuğu — Dolap/Letgo/
// Vinted gibi alışveriş uygulamalarındaki standart düzen. Tam ekran
// akışlarda (sohbet, ilan formu) gizli. Giriş/kayıt ekranlarında görünür:
// misafir "Mesajlar"/"Profil"e dokununca girişe düşüyor ve menü gizlenirse
// uygulamada geri dönecek yer kalmıyordu.
import React from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import Icon from './Icon'

const HIDDEN_ON = [/^\/messages\/.+/, /^\/add-product/, /^\/edit-product/]

export default function BottomNav({ user, unreadCount }) {
  const { pathname } = useLocation()
  if (HIDDEN_ON.some((re) => re.test(pathname))) return null

  const item = (to, icon, label, extra) => (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => `bnav-item ${isActive ? 'is-active' : ''}`}>
      <span className="bnav-icon">
        <Icon name={icon} size={23} />
        {extra}
      </span>
      <span className="bnav-label">{label}</span>
    </NavLink>
  )

  return (
    <nav className="bottom-nav d-lg-none" aria-label="Ana gezinme">
      {item('/', 'home', 'Ana Sayfa')}
      {item('/products', 'grid', 'Keşfet')}
      <Link to={user ? '/add-product' : '/login'} className="bnav-sell" aria-label="İlan ver">
        <span className="bnav-sell-btn">
          <Icon name="plus" size={26} strokeWidth={2.4} />
        </span>
        <span className="bnav-label">İlan Ver</span>
      </Link>
      {item(
        '/messages', // misafire "Giriş yapmalısın" ekranını gösterir
        'chat',
        'Mesajlar',
        unreadCount > 0 ? <span className="bnav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null
      )}
      {item(user ? '/profile' : '/login', 'user', user ? 'Profil' : 'Giriş')}
    </nav>
  )
}
