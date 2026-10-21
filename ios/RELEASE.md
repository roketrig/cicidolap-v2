# App Store'a Yayınlama Rehberi — Cici Dolap (iOS)

Kod tarafında hazırlananlar ✅, senin (Mac / Apple hesabı gerektirdiği için)
yapman gerekenler ☐. Android için bkz. `android/RELEASE.md`; mağaza metinleri
için `store/listing-tr.md`.

> iOS uygulaması **yalnızca macOS + Xcode** ile derlenir/arşivlenir. Bu
> bilgisayarda (Windows) derleme yapılamaz; proje klasörü (`ios/`) hazır.

## 1. Gerekenler ☐

- Mac (Xcode 16+ önerilir) — yoksa Codemagic / Xcode Cloud / MacinCloud gibi bir bulut Mac servisi.
- **Apple Developer Program** üyeliği (yıllık 99$; kimlik doğrulaması birkaç gün sürebilir — en erken bunu başlat).

## 2. İlk derleme ☐

```bash
npm install
npm run build
npx cap sync ios
npx cap open ios
```

Xcode'da:
1. **App** hedefi → *Signing & Capabilities* → Team'i seç, *Automatically manage signing* açık kalsın.
2. Bundle Identifier: `com.cicidolap.app` (Capacitor yapılandırmasıyla aynı; değiştirirsen `capacitor.config.json` içindeki `appId`'yi de değiştir).
3. *General* → Version `1.0`, Build `1`. Her yüklemede Build numarasını artır.
4. Gerçek cihazda veya simülatörde bir kez çalıştırıp giriş, ilan verme, fotoğraf seçme, mesajlaşmayı dene.
5. *Product → Archive → Distribute App → App Store Connect* ile TestFlight'a yükle.

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
