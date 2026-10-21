// src/pages/Terms.jsx
//
// Kullanım Şartları. NOT: Bu metin bir taslaktır; yayına almadan önce bir
// hukukçuya kontrol ettirilmesi önerilir (bkz. Gizlilik.jsx'teki aynı not).
import React from 'react'
import { Link } from 'react-router-dom'

function Terms() {
  return (
    <div className="container py-4" style={{ maxWidth: '760px' }}>
      <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5">
        <h1 className="fw-bold text-pink-600 mb-1">Kullanım Şartları</h1>
        <p className="text-muted small mb-4">Son güncelleme: 2026</p>

        <section className="mb-4">
          <h2 className="h5 fw-bold">1. Platform Hakkında</h2>
          <p className="text-muted mb-0">
            Cici Dolap ("Platform"), kullanıcıların 0-12 yaş çocuk ürünlerini
            aralarında alıp satabildiği/bağışlayabildiği bir ikinci el ilan
            platformudur. Platform, ilan sahibi ile alıcı arasındaki
            alışverişin <strong>tarafı değildir</strong> — sadece tarafları bir araya
            getirir. Ödeme, teslimat ve ürünün durumu tamamen taraflar
            arasındaki anlaşmaya bağlıdır.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="h5 fw-bold">2. Üyelik ve Yaş Şartı</h2>
          <p className="text-muted mb-0">
            Platform'a üye olmak için <strong>18 yaşını doldurmuş</strong>{' '}
            olman gerekir. Satılan ürünler çocuklar için olsa da, hesap
            açan, ilan veren ve mesajlaşan kişinin yetişkin olması
            gerekiyor. Verdiğin bilgilerin (ad, e-posta, telefon) doğru ve
            güncel olduğunu kabul edersin.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="h5 fw-bold">3. İlan Verme Kuralları</h2>
          <ul className="text-muted mb-0">
            <li>İlan verdiğin ürünün yasal sahibi olmalısın.</li>
            <li>Geri çağrılmış (recall), sahte, çalıntı, güvensiz veya
              yasa dışı ürün ilanı veremezsin.</li>
            <li>Ürün açıklaması ve fotoğrafları gerçeği yansıtmalı; ürünün
              durumunu (yeni/kullanılmış/yıpranmış) doğru beyan etmelisin.</li>
            <li>İlanlar admin onayından sonra yayına girer; Platform,
              gerekçe belirtmeden bir ilanı reddetme veya kaldırma hakkını
              saklı tutar.</li>
          </ul>
        </section>

        <section className="mb-4">
          <h2 className="h5 fw-bold">4. İletişim ve Davranış</h2>
          <p className="text-muted mb-0">
            Diğer kullanıcılara karşı saygılı davranmalısın. Taciz, spam,
            dolandırıcılık girişimi veya Platform'u amacı dışında kullanma
            (ör. toplu reklam gönderme) yasaktır. Bu kurallara uymayan
            hesaplar askıya alınabilir veya kalıcı olarak kapatılabilir.
          </p>
        </section>

        <section className="mb-4" id="icerik-politikasi">
          <h2 className="h5 fw-bold">5. Uygunsuz İçerik, Şikayet ve Engelleme</h2>
          <p className="text-muted mb-2">
            Platform'da <strong>uygunsuz, saldırgan, çocuklar için zararlı, yasa dışı veya
            aldatıcı içeriğe ve davranışa tolerans gösterilmez</strong>. Bu tür içerik
            paylaşan hesaplar uyarı yapılmadan kısıtlanabilir.
          </p>
          <ul className="text-muted mb-0">
            <li>Her ilanda ve kullanıcı profilinde <strong>Şikayet et</strong> seçeneği vardır;
              mesajlaşma ekranından konuşmayı da şikayet edebilirsin. Şikayetler yönetici
              ekibimizce incelenir; uygun görülen içerik kaldırılır ve ilgili hesap kısıtlanır.</li>
            <li>Rahatsız olduğun kullanıcıyı <strong>engelleyebilirsin</strong>: engellediğin kişi
              sana mesaj gönderemez, ilanları da sana gösterilmez. Engellediklerini Profil &gt;
              Engellediklerim bölümünden yönetirsin.</li>
            <li>Konuşma şikayetlerinde, şikayet ettiğin konuşmanın son mesajları incelenmek üzere
              şikayet kaydına eklenir.</li>
          </ul>
        </section>

        <section className="mb-4">
          <h2 className="h5 fw-bold">6. Sorumluluk Sınırı</h2>
          <p className="text-muted mb-0">
            Platform, kullanıcılar arasındaki alışverişin güvenliğini,
            ürünlerin doğruluğunu veya karşı tarafın taahhütlerini yerine
            getireceğini garanti etmez. Yüz yüze buluşmalarda güvenli,
            kalabalık ve tercihen kamuya açık yerleri seç. Anlaşmazlık
            durumunda Platform arabuluculuk yapmaya çalışabilir ama bunu
            taahhüt etmez.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="h5 fw-bold">7. Ücretlendirme</h2>
          <p className="text-muted mb-0">
            İlan verme şu an için ücretsizdir. Platform, ileride bazı
            hizmetler için ücret uygulayabilir; herhangi bir ücret
            değişikliği önceden duyurulur ve mevcut ilanlarını etkilemez.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="h5 fw-bold">8. Hesap Silme</h2>
          <p className="text-muted mb-0">
            Hesabını istediğin zaman silebilirsin — bkz.{' '}
            <Link to="/hesap-sil" className="text-pink-600 fw-bold">Hesabımı Sil</Link>.
            Kurallara aykırı kullanım tespit edilirse Platform da hesabını
            askıya alabilir veya kapatabilir.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="h5 fw-bold">9. Değişiklikler</h2>
          <p className="text-muted mb-0">
            Bu şartlar zaman zaman güncellenebilir. Önemli değişikliklerde
            seni bilgilendirmeye çalışırız; Platform'u kullanmaya devam
            etmen güncel şartları kabul ettiğin anlamına gelir.
          </p>
        </section>

        <p className="text-muted small mb-4">
          Sorularun için: <strong>info@cicidolap.com.tr</strong>. Kişisel
          verilerinle ilgili detaylar için{' '}
          <Link to="/gizlilik" className="text-pink-600 fw-bold">Gizlilik & KVKK Aydınlatma Metni</Link>'ni incele.
        </p>

        <Link to="/" className="btn btn-pink rounded-pill px-4 mt-2">← Ana Sayfaya Dön</Link>
      </div>
    </div>
  )
}

export default Terms
