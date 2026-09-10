# Cici Dolap

0-12 yaş çocuk ürünleri için ikinci el pazarı. React (Vite) + Firebase
(Auth + Firestore) + Cloudflare Worker/R2 (ürün görselleri).

## Kurulum

```bash
npm install
cp .env.example .env   # içine VITE_IMAGE_WORKER_URL yaz (aşağıya bak)
npm run dev
```

`npm run build` → `dist/` · `npm run lint` · `npm run preview`

## Ortam değişkenleri (`.env`)

| Değişken | Açıklama |
| --- | --- |
| `VITE_IMAGE_WORKER_URL` | Görsel yükleme Worker'ının adresi, ör. `https://cicidolap-images.cicidolap.workers.dev` |

`.env` git'e girmez. Firebase yapılandırması (apiKey vb.) gizli değildir ve
`src/firebase.js` içinde durur — gerçek güvenlik Firestore kurallarındadır.

## Firebase (Auth + Firestore)

Proje: **cici-dolap**. Kurallar ve index'ler bu repoda:

- `firestore.rules` — güvenlik kuralları
- `firestore.indexes.json` — bileşik index'ler (ürün listesi sorgusu)

### Yayınlama

Firebase CLI ile (önerilen):

```bash
npm i -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

CLI yoksa: `firestore.rules` içeriğini **Firebase Console → Firestore
Database → Rules** sekmesine yapıştırıp "Yayınla" de. Kurallar
yayınlanmadan favoriler ve mesajlaşma çalışmaz.

## Görseller — Cloudflare Worker + R2

Firebase Storage bucket'ı oluşturulamadığı için ürün görselleri Cloudflare
R2'de tutuluyor. Ayrıntı: [`cloudflare-worker/README.md`](cloudflare-worker/README.md).

- Yükleme öncesi görsel tarayıcıda küçültülüp sıkıştırılıyor (`src/imageUpload.js`).
- Ürün silinince görsel de R2'den siliniyor.

## Örnek ürün ekleme

```bash
node scripts/seedProducts.js   # admin@cici-dolap.com şifresini sorar
```

## Mimari notlar

- `src/chat.js` — ürün bazlı çift yönlü mesajlaşma (`conversations/{cid}/messages`).
- `src/hooks/useFavorites.js` — favoriler (iyimser güncelleme).
- Admin yetkisi hem arayüzde hem kurallarda e-posta karşılaştırmasıyla
  (`admin@cici-dolap.com`). Tek admin için yeterli; çoğalırsa custom claim gerekir.
- `android/` — Capacitor. Web build'i `dist/`'ten alır (`npx cap sync` sonrası).
