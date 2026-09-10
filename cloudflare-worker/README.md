# Cici Dolap - Görsel Yükleme Worker'ı (Cloudflare R2)

Bu klasör, ürün görsellerini Firebase Storage yerine Cloudflare R2'de
saklayan küçük ve bağımsız bir Cloudflare Worker'ıdır. Uygulamanın geri
kalanı (giriş/kayıt, ürün/mesaj/favori verileri) aynen Firebase'de kalmaya
devam eder — sadece resim yükleme/görüntüleme/silme burada yapılır.

Ayrıntılı kurulum adımları için proje köküne dönüp Claude'un sohbette
verdiği talimatları takip edin. Özet:

1. `npm install -g wrangler` (bir kere)
2. `wrangler login`
3. `wrangler r2 bucket create cicidolap-images`
4. Bu klasörde: `npm install`
5. Bu klasörde: `npm run deploy`
6. Çıktıda görünen `https://cicidolap-images.<hesabınız>.workers.dev`
   adresini kopyalayın.
7. Proje kök klasöründe bir `.env` dosyası oluşturup şunu ekleyin:
   `VITE_IMAGE_WORKER_URL=https://cicidolap-images.<hesabınız>.workers.dev`
8. `npm run build` (veya `npm run dev`) ile ana uygulamayı yeniden başlatın.

`wrangler.toml` içindeki `FIREBASE_PROJECT_ID` ve `ADMIN_EMAIL` değerleri
projenizle eşleşmiyorsa güncelleyin, sonra tekrar `npm run deploy` çalıştırın.
