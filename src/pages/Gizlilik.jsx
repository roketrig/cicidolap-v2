// src/pages/Gizlilik.jsx
//
// KVKK Aydınlatma Metni + gizlilik özeti.
// NOT: Bu metin bir taslaktır; yayına almadan önce bir hukukçuya
// (KVKK danışmanına) kontrol ettirilmesi önerilir.
import React from 'react'
import { Link } from 'react-router-dom'

function Gizlilik() {
  return (
    <div className="container py-4" style={{ maxWidth: '760px' }}>
      <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5">
        <h1 className="fw-bold text-pink-600 mb-1">Gizlilik & KVKK Aydınlatma Metni</h1>
        <p className="text-muted small mb-4">Son güncelleme: 2026</p>

        <section className="mb-4">
          <h2 className="h5 fw-bold">1. Veri Sorumlusu</h2>
          <p className="text-muted mb-0">
            Cici Dolap ("Platform"), 6698 sayılı Kişisel Verilerin Korunması Kanunu
            ("KVKK") kapsamında veri sorumlusudur. Bu metin, Platform'u kullanırken
            işlenen kişisel verilerini ve haklarını açıklar.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="h5 fw-bold">2. İşlenen Kişisel Veriler</h2>
          <ul className="text-muted mb-0">
            <li><strong>Kimlik / İletişim:</strong> ad, e-posta adresi.</li>
            <li><strong>Telefon numarası:</strong> yalnızca ilan verirken "Mesaj + telefon"
              seçeneğini işaretleyip <em>açık rıza</em> verirsen işlenir ve ilanında
              gösterilir. "Sadece mesajla" seçersen telefon numaran hiç toplanmaz.</li>
            <li><strong>İlan verileri:</strong> ürün başlığı, açıklaması, fotoğrafı,
              fiyatı, il/ilçe bilgisi.</li>
            <li><strong>Mesajlaşma:</strong> diğer kullanıcılarla yaptığın yazışmaların
              içeriği ve zamanı.</li>
            <li><strong>Kullanım verileri:</strong> favoriler, oturum bilgisi.</li>
          </ul>
        </section>

        <section className="mb-4">
          <h2 className="h5 fw-bold">3. İşleme Amaçları ve Hukuki Sebepler</h2>
          <ul className="text-muted mb-0">
            <li>Üyelik oluşturma ve kimlik doğrulama — <em>sözleşmenin kurulması/ifası</em>.</li>
            <li>İlan yayınlama, arama, favori — <em>sözleşmenin ifası, meşru menfaat</em>.</li>
            <li>Alıcı–satıcı iletişimi (uygulama içi mesaj) — <em>sözleşmenin ifası</em>.</li>
            <li>Telefon numarasının ilanda gösterilmesi — <em>açık rıza</em> (dilediğin
              zaman ilanı düzenleyip "Sadece mesajla"ya geçerek geri alabilirsin).</li>
            <li>Dolandırıcılık/kötüye kullanım önleme, hukuki yükümlülükler — <em>meşru
              menfaat, hukuki yükümlülük</em>.</li>
          </ul>
        </section>

        <section className="mb-4">
          <h2 className="h5 fw-bold">4. Verilerin Paylaşımı</h2>
          <p className="text-muted mb-0">
            E-posta adresin diğer kullanıcılarla <strong>hiçbir zaman</strong> paylaşılmaz.
            Telefon numaran yalnızca sen açık rıza verdiysen ve karşı taraf Platform'a
            giriş yapmışsa görüntülenebilir. Veriler; barındırma ve altyapı hizmeti
            aldığımız tedarikçilerde (Google Firebase, Cloudflare) KVKK'ya uygun şekilde
            saklanır. Yasal talep hâlinde yetkili kamu kurumlarıyla paylaşılabilir.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="h5 fw-bold">5. Saklama Süresi</h2>
          <p className="text-muted mb-0">
            Veriler, üyeliğin sürdüğü ve ilgili mevzuatın öngördüğü süre boyunca saklanır.
            İlanını sildiğinde ilana ait telefon kaydı da silinir. Hesabının tamamen
            silinmesini istersen aşağıdaki adresten başvurabilirsin.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="h5 fw-bold">6. Haklarınız (KVKK m. 11)</h2>
          <p className="text-muted mb-0">
            Kişisel verilerinin işlenip işlenmediğini öğrenme, bunlara ilişkin bilgi
            talep etme, düzeltilmesini veya silinmesini isteme, işlemeye itiraz etme ve
            zararın giderilmesini talep etme haklarına sahipsin. Profil sayfandan adını
            ve ilan iletişim tercihini kendin güncelleyebilirsin.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="h5 fw-bold">7. Başvuru</h2>
          <p className="text-muted mb-0">
            Taleplerini <strong>cicidolap@…</strong> adresine iletebilirsin. (Yayına
            almadan önce buraya gerçek başvuru adresini yaz.)
          </p>
        </section>

        <section className="mb-4">
          <h2 className="h5 fw-bold">8. Çerezler</h2>
          <p className="text-muted mb-0">
            Platform yalnızca oturumun açık kalması için gerekli teknik verileri
            tarayıcında saklar; reklam/izleme amaçlı üçüncü taraf çerezleri kullanılmaz.
          </p>
        </section>

        <Link to="/" className="btn btn-pink rounded-pill px-4 mt-2">← Ana Sayfaya Dön</Link>
      </div>
    </div>
  )
}

export default Gizlilik
