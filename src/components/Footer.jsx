// src/components/Footer.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/cicidolap-logo.png'
import { CATEGORIES } from '../data/categories'

export default function Footer() {
  const link = { color: 'rgba(255,255,255,0.78)' }
  return (
    <footer className="cd-footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-12 col-md-4">
            <img src={logo} alt="Cici Dolap" className="footer-logo mb-3" />
            <p className="small mb-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
              0-12 yaş çocuk ürünleri için sıcacık ikinci el pazarı. Çocuğunun büyüyen eşyalarına
              yeni bir yuva bul, ihtiyacın olanı uygun fiyata keşfet. 💗
            </p>
            <p className="small mb-0" style={{ color: 'rgba(255,255,255,0.75)' }}>
              ✉️ <a href="mailto:info@cicidolap.com.tr" style={link}>info@cicidolap.com.tr</a>
            </p>
          </div>

          <div className="col-6 col-md-3 offset-md-1">
            <h6 className="cd-footer-title">Kategoriler</h6>
            <ul className="cd-footer-links">
              {CATEGORIES.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link to={`/products?category=${c.id}`} style={link}>{c.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-6 col-md-4">
            <h6 className="cd-footer-title">Yardım & Yasal</h6>
            <ul className="cd-footer-links">
              <li><Link to="/yardim" style={link}>Nasıl çalışır? / SSS</Link></li>
              <li><Link to="/yardim#guvenlik" style={link}>Güvenli alışveriş ipuçları</Link></li>
              <li><Link to="/gizlilik" style={link}>Gizlilik & KVKK</Link></li>
              <li><Link to="/kullanim-sartlari" style={link}>Kullanım Şartları</Link></li>
              <li><Link to="/hesap-sil" style={link}>Hesabımı Sil</Link></li>
            </ul>
          </div>
        </div>

        <hr />
        <div className="text-center">
          <small>© {new Date().getFullYear()} Cici Dolap · Sevgiyle, Türkiye'de 🇹🇷</small>
        </div>
      </div>
    </footer>
  )
}
