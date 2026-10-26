# App Store'a Yayınlama Rehberi — Cici Dolap (iOS)

Kod tarafında hazırlananlar ✅, senin (Mac / Apple hesabı gerektirdiği için)
yapman gerekenler ☐. Android için bkz. `android/RELEASE.md`; mağaza metinleri
için `store/listing-tr.md`.

> iOS uygulaması macOS + Xcode ile derlenir. Mac olmadığı için derleme
> **GitHub Actions**'ın Mac sunucusunda yapılıyor (`.github/workflows/ios-testflight.yml`).

## 1. Tek seferlik kurulum ☐

Apple Developer hesabı ✅ onaylandı. Sırayla:

1. **App Store Connect'te uygulamayı oluştur** — [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → Uygulamalar → **+** → Yeni Uygulama:
   - Platform: iOS · Ad: `Cici Dolap` · Birincil dil: Türkçe
   - Paket Kimliği (Bundle ID): `com.cicidolap.app` — listede yoksa önce
     [developer.apple.com → Identifiers](https://developer.apple.com/account/resources/identifiers/list) → **+** → App IDs → App → Explicit: `com.cicidolap.app` ile kaydet, sonra geri dön.
   - SKU: `cicidolap-ios` (sadece senin için bir etiket)
2. **App Store Connect API anahtarı oluştur** — Kullanıcılar ve Erişim → **Entegrasyonlar** → App Store Connect API → Takım Anahtarları → **+**:
   - Ad: `GitHub Actions` · Erişim: **Admin** (sertifika/profil otomatik oluşturulabilsin diye gerekiyor)
   - `.p8` dosyasını indir — **yalnızca bir kez indirilebilir**, parola yöneticine/güvenli bir yere de kaydet.
   - Aynı sayfadaki **Issuer ID** ve anahtarın **Key ID**'sini not et.
3. **Team ID'ni bul** — [developer.apple.com/account](https://developer.apple.com/account) → Üyelik ayrıntıları → *Team ID* (10 karakter).
4. **GitHub'a ekle** — repo → Settings → Secrets and variables → Actions:
   - **Secrets** sekmesi → New repository secret:
     | Ad | Değer |
     |---|---|
     | `APPLE_TEAM_ID` | Team ID |
     | `ASC_KEY_ID` | Key ID |
     | `ASC_ISSUER_ID` | Issuer ID |
     | `ASC_KEY_P8` | `.p8` dosyasının **tüm içeriği** (Not Defteri ile aç, `-----BEGIN PRIVATE KEY-----` dahil kopyala) |
   - **Variables** sekmesi → New repository variable:
     `VITE_IMAGE_WORKER_URL` = `.env` dosyandaki / Vercel'deki değerin aynısı.

Bu değerleri bana gönderme; doğrudan GitHub'a gir.

## 2. Her yeni sürümde ☐

1. GitHub → **Actions** → **iOS → TestFlight** → **Run workflow**.
2. ~15-25 dk: web derlemesi → Xcode arşivi → imzalama → App Store Connect'e yükleme.
   Build numarası otomatik artar (GitHub çalıştırma numarası), sürüm `1.0`.
   Yeni bir mağaza sürümünde `ios/App/App.xcodeproj/project.pbxproj` içindeki `MARKETING_VERSION`'ı artır.
3. Yükleme sonrası App Store Connect → **TestFlight**'ta build 10-30 dk içinde "İşleniyor"dan çıkar.
   iPhone'una **TestFlight** uygulamasını kurup kendini dahili test kullanıcısı olarak ekle ve dene.
4. Her şey yolundaysa: Uygulama sayfası → iOS Uygulaması 1.0 → **Build** bölümünden bu build'i seç → İncelemeye Gönder.

> Mac'in olursa alternatif: `npm run build && npx cap sync ios && npx cap open ios`,
> Xcode'da Team'i seç → Product → Archive → Distribute App.

## 3. App Store Connect ☐

- Yeni uygulama oluştur (Bundle ID: `com.cicidolap.app`, dil: Türkçe).
- Metinler, anahtar kelimeler, URL'ler: `store/listing-tr.md`.
- **Gizlilik politikası URL'si:** https://cicidolap.com.tr/gizlilik
- **App Privacy (veri gizliliği) formu** — uygulamanın topladıkları:

| Veri | Amaç | Kullanıcıya bağlı | İzleme (tracking) |
|---|---|---|---|
| E-posta, Ad (Contact Info) | Hesap / uygulama işlevi | Evet | Hayır |
| Telefon (şartlı, rıza ile) | İletişim / ilan | Evet | Hayır |
| Fotoğraflar (User Content) | İlan | Evet | Hayır |
| Mesajlar (User Content) | Mesajlaşma | Evet | Hayır |
| Kullanıcı kimliği | Hesap / uygulama işlevi | Evet | Hayır |

  Reklam/analitik SDK'sı yok → **“Data Used to Track You” boş bırakılır.**
- **Yaş derecelendirmesi:** `store/listing-tr.md` içindeki öneriye bak.
- **App Review Information:** test hesabı + not (hazır metin `store/listing-tr.md`'de) ☐ test hesabını sen oluştur.
- **Hesap silme:** Apple, hesap açılabiliyorsa uygulama içinden silmeyi şart koşar ✅ (Profil → Hesabımı sil).

## 4. Kullanıcı üretimi içerik (Guideline 1.2) — ✅ kodda hazır

Apple, UGC içeren uygulamalarda şunları arar; hepsi uygulamada var:

| Gereksinim | Uygulamada |
|---|---|
| Uygunsuz içeriği filtreleme / önceden onay | İlanlar yönetici onayından geçiyor |
| Şikayet mekanizması | İlan, profil ve konuşmada “Şikayet et” |
| Kullanıcı engelleme | “Engelle” + Profil → Engellediklerim |
| Şikayetlere zamanında aksiyon | Admin paneli → Şikayetler (ilanı reddet, kullanıcıyı yasakla) |
| İletişim bilgisi | Yardım sayfası + info@cicidolap.com.tr |
| Kabul edilebilir içerik şartları | Kullanım Şartları madde 5 |

☐ **Yayından önce:** `firestore.rules` dosyasını Firebase Console'dan yayınla
(yoksa şikayet/engelleme çalışmaz) ve admin hesabıyla **Şikayetler** sekmesini bir kez dene.
☐ Şikayetleri düzenli (en az günlük) kontrol edeceğini taahhüt etmen gerekir —
Apple bunu inceleme sırasında sorabilir.

## 5. Diğer notlar

- **Sign in with Apple gerekmez:** yalnızca kendi e-posta/şifre girişimiz var; Google/Facebook gibi üçüncü taraf girişi yok.
- **Uygulama içi satın alma yok** → App Store Connect'te IAP/abonelik tanımlama. İleride iyzico ile fiziksel ürün ödemesi eklenirse (fiziksel ürün/hizmet) Apple'ın %30 komisyon kuralı kapsamına girmez; yine de o aşamada tekrar kontrol edeceğiz.
- `Info.plist` içinde kamera/fotoğraf kütüphanesi açıklamaları (Türkçe) ve `ITSAppUsesNonExemptEncryption=false` ✅ ekli.
- Çentik/Home Indicator payları CSS'te `env(safe-area-inset-*)` ile karşılanıyor ✅.
- Splash ve ikon ✅ (opak 1024×1024 ikon; Apple şeffaflık kabul etmez).
- Web sürümünden farklı olarak uygulamada footer gizli; yasal linkler Profil menüsünde ✅.
