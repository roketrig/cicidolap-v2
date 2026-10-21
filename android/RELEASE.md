# Google Play'e Yayınlama Rehberi — Cici Dolap

Bu dosya, Android uygulamasını Google Play Store'a yayınlarken unutulmaması
gereken her şeyi tek yerde topluyor. Kod tarafında hazırlananlar ✅,
senin (hesap/kimlik/ödeme gerektirdiği için) yapman gerekenler ☐.

## 1. Release imzalama anahtarı (keystore)

Play Store'a yüklenecek her APK/AAB imzalı olmalı. **Bu anahtarı ben
oluşturamam** — şifresini benimle paylaşman "parola" paylaşmak anlamına
gelir ve bunu hiçbir zaman yapmamalısın. Kendi terminalinde çalıştır:

```bash
cd android
keytool -genkeypair -v -storetype PKCS12 -keystore cicidolap-release.jks -alias cicidolap -keyalg RSA -keysize 2048 -validity 10000
```

Sana bir mağaza şifresi ve bir anahtar şifresi soracak — **ikisini de bir
parola yöneticisine kaydet.** Bu dosyayı (`cicidolap-release.jks`) ve
şifreleri kaybedersen, Play Store'daki uygulamayı **bir daha asla**
güncelleyemezsin (yeni bir uygulama olarak sıfırdan yayınlaman gerekir).

Sonra:
1. `android/keystore.properties.example` dosyasını `android/keystore.properties`
   olarak kopyala, içindeki `storePassword`/`keyPassword` değerlerini
   gerçek şifrelerinle doldur (bu dosya git'e girmez, `.gitignore`'da).
2. `npm run build && npx cap sync android`
3. `cd android && ./gradlew bundleRelease` (Windows: `gradlew.bat bundleRelease`)
4. Çıktı: `android/app/build/outputs/bundle/release/app-release.aab` — Play
   Console'a yüklenecek dosya bu.

✅ Gradle tarafı hazır (`build.gradle` artık `keystore.properties` varsa
otomatik imzalıyor, yoksa sorunsuz imzasız derliyor).

## 2. Google Play Console hesabı ☐

- [play.google.com/console](https://play.google.com/console) → geliştirici
  hesabı aç. **Tek seferlik 25$** ücret + kimlik doğrulama (birkaç gün
  sürebilir, en erken bunu başlat).
- Yeni **kişisel** hesaplar için Google artık **kapalı test** (closed
  testing) zorunlu tutuyor: en az **12 test kullanıcısı**, en az **14 gün**
  boyunca aktif kullanmalı, ondan sonra prod'a (herkese açık) geçiş izni
  açılıyor. Bunu zamanlamana dahil et — son ana bırakma.

## 3. Hesap silme — ✅ KOD TARAFI HAZIR, sen sadece linki gireceksin

Play Store, hesap açmaya izin veren her uygulamadan **hem uygulama içinden
hem de web'den** (uygulamayı yüklemeden/silmeden) hesap silme talebi
alınabilmesini **zorunlu kılıyor**. Bunsuz uygulama reddedilir.

- Uygulama içi: **Profilim → "Hesabımı Sil"** (şifre onayı ister, geri
  alınamaz).
- Web/giriş yapamayanlar için: **`https://cicidolap.com.tr/hesap-sil`** —
  giriş yapmadan da açılıyor, hem kendin silmen için hem de
  destek e-postasıyla talep bırakman için yönlendiriyor.

Play Console → **Politika → Uygulama içeriği → Hesap silme** bölümüne bu
URL'yi ekle: `https://cicidolap.com.tr/hesap-sil`

## 4. Gizlilik Politikası ve Kullanım Şartları — ✅ hazır

- Gizlilik: `https://cicidolap.com.tr/gizlilik`
- Kullanım Şartları: `https://cicidolap.com.tr/kullanim-sartlari`

Play Console → Store listing → "Privacy Policy" alanına gizlilik linkini
gir. **İkisi de taslak — yayına almadan önce bir hukukçuya kontrol
ettirmeni öneririm** (özellikle KVKK ve tüketici hakları açısından).

## 5. Veri Güvenliği (Data Safety) formu ☐

Play Console → Politika → Uygulama içeriği → Veri güvenliği. Uygulamanın
gerçekten topladığı veriler:

| Veri | Toplanıyor mu | Amaç | Paylaşılıyor mu |
|---|---|---|---|
| E-posta | Evet (kayıt) | Hesap işlevi | Hayır |
| Ad | Evet (kayıt) | Hesap işlevi, ilanlarda görünür | Diğer kullanıcılarla (ilan/mesajda) |
| Telefon numarası | Şartlı — sadece kullanıcı "Mesaj + telefon" seçerse | İlan iletişimi | Açık rıza verirse diğer kullanıcılarla |
| Fotoğraflar | Evet (ürün görseli) | İlan | Herkese açık (onaylı ilanlarda) |
| Konum (il/ilçe) | Evet, kullanıcı elle giriyor (GPS YOK) | İlan | Herkese açık (onaylı ilanlarda) |
| Mesajlar | Evet | Alıcı-satıcı iletişimi | Sadece konuşmanın diğer tarafı |
| Cihaz/analitik | Hayır (üçüncü taraf analitik/reklam SDK'sı yok) | — | — |

"Uygulamanız çocuklara mı yönelik?" sorusuna **Hayır** — ürünler çocuklar
için ama uygulamayı kullanan (kayıt olan, mesajlaşan, satan) taraf
yetişkinler. Bunu netleştirmek için kayıt formuna 18 yaş onayı eklendi
(bkz. madde 7).

## 6. İçerik derecelendirme (Content Rating) ☐

Play Console'daki IARC anketini doldur. Uygulamada: kullanıcı üretimi
içerik (ilan/mesaj), fotoğraf yükleme, konum paylaşımı var; şiddet/cinsel
içerik/kumar yok. "Kullanıcılar arası mesajlaşma var mı?" → Evet.

## 7. Kayıt formunda 18 yaş / şartlar onayı — ✅ hazır

Kayıt formu artık "18 yaşındayım ve Kullanım Şartları'nı kabul ediyorum"
onayı istiyor (işaretlenmeden kayıt olunamıyor).

## 8. Mağaza görselleri ve metinleri

- **Uygulama ikonu** 512×512 — ✅ hazır (`public/favicon-512.png`, Android ikonları `mipmap-*`)
- **Öne çıkan görsel (feature graphic)** 1024×500 — ✅ `store/feature-graphic-1024x500.png`
- **Kısa/tam açıklama, kategori, URL'ler** — ✅ `store/listing-tr.md`
- **Telefon ekran görüntüleri** en az 2 tane — ☐ uygulamayı gerçek ilanlarla doldurduktan sonra cihazdan al
- **Kategori**: Alışveriş (Shopping)

## 9. Diğer teknik kontroller — ✅ hazır

- `targetSdkVersion`/`compileSdkVersion` 36 — Play'in güncel şart sınırının
  üzerinde, sorun yok.
- İstenen izin sadece `INTERNET` — minimal, ekstra açıklama gerekmiyor.
- `versionCode 1` / `versionName "1.0"` — ilk yayın için hazır; her
  güncellemede `versionCode`'u artırman gerekecek.

## 10. Yayından sonra unutma

- E-posta doğrulama (kayıtta gönderiliyor ✅) zorunlu değil ama spam/sahte
  hesapları azaltır — istersen ileride "doğrulanmamış hesap" rozetini
  ilanlarda gösterebiliriz.
- Kullanıcı üretimi içerik (UGC) politikası ✅: ilan/kullanıcı/konuşma
  şikayeti, kullanıcı engelleme, admin panelinde şikayet inceleme ve
  kullanıcı yasaklama eklendi. **Önce `firestore.rules` dosyasını Firebase
  Console'dan yayınla**, sonra admin hesabıyla Şikayetler sekmesini dene.
  Play Console → Uygulama içeriği bölümündeki UGC sorularına "şikayet,
  engelleme ve moderasyon var" şeklinde yanıt ver.
- iOS için: bkz. `ios/RELEASE.md`.
- iyzico/hizmet bedeli entegrasyonu — ayrı konuşacağız (anlaşma
  netleşince).
