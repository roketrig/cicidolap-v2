// src/pages/Help.jsx
//
// Yardım merkezi: nasıl çalışır, güvenli alışveriş ipuçları, SSS, iletişim.
// Aynı zamanda App Store'un istediği "Destek URL'si" (/yardim).
import React from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { HOW_IT_WORKS, SAFETY_TIPS } from '../data/help'

const FAQ = [
  ['İlan vermek ücretli mi?', 'Hayır, ilan vermek şu an ücretsiz.'],
  ['İlanım neden hemen yayınlanmadı?', 'Tüm ilanlar, güvenlik için yayına girmeden önce yöneticilerimiz tarafından kontrol edilir. Onaylanınca ilanın görünür olur.'],
  ['Telefon numaram herkese açık mı?', 'Hayır. Varsayılan olarak yalnızca uygulama içi mesajla iletişim kurulur. İstersen ilan verirken numaranı, giriş yapmış kullanıcılara "Telefonu Göster" ile açabilirsin.'],
  ['Bir ilanı veya kullanıcıyı nasıl şikayet ederim?', 'İlan sayfasındaki ya da satıcı profilindeki "Şikayet et" butonunu kullan. Rahatsız edici bir kullanıcıyı "Engelle" ile mesajlarından ve ilanlarından uzaklaştırabilirsin.'],
  ['Hesabımı nasıl silerim?', <>Profil sayfasının altından ya da <Link to="/hesap-sil">Hesabımı Sil</Link> sayfasından, istediğin zaman.</>],
  ['Bağış yapabilir miyim?', 'Evet! Fiyat alanına 0 yazarsan ilanın "Bağış" olarak listelenir.'],
]

function Help() {
  return (
    <div className="container py-4" style={{ maxWidth: '860px' }}>
      <h1 className="fw-bold text-pink-600 mb-1">Yardım Merkezi</h1>
      <p className="text-muted mb-4">Cici Dolap'ı kullanırken ihtiyacın olacak her şey burada.</p>

      <section className="mb-5" id="nasil-calisir">
        <h2 className="h4 fw-bold mb-3">Nasıl çalışır?</h2>
        <div className="row g-3">
          {HOW_IT_WORKS.map((s, i) => (
            <div key={s.title} className="col-12 col-md-4">
              <div className="how-card h-100">
                <div className="how-step">{i + 1}</div>
                <div className="how-emoji">{s.emoji}</div>
                <h3 className="h6 fw-bold">{s.title}</h3>
                <p className="small text-muted mb-0">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-5" id="guvenlik">
        <h2 className="h4 fw-bold mb-3">
          <Icon name="shield" size={22} className="me-2 text-pink-600" />
          Güvenli alışveriş ipuçları
        </h2>
        <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4">
          <ul className="mb-0 ps-3">
            {SAFETY_TIPS.map((t) => (
              <li key={t} className="mb-2">{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-5" id="sss">
        <h2 className="h4 fw-bold mb-3">Sık sorulan sorular</h2>
        <div className="faq-list">
          {FAQ.map(([q, a]) => (
            <details key={q} className="faq-item">
              <summary>{q}</summary>
              <p className="text-muted mb-0">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mb-4" id="iletisim">
        <h2 className="h4 fw-bold mb-3">Bize ulaş</h2>
        <p className="text-muted">
          Sorun, öneri ya da şikayetin için: <a href="mailto:info@cicidolap.com.tr"><strong>info@cicidolap.com.tr</strong></a>
        </p>
        <Link to="/" className="btn btn-pink rounded-pill px-4">← Ana Sayfaya Dön</Link>
      </section>
    </div>
  )
}

export default Help
