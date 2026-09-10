// src/imageUpload.js
//
// Ürün görsellerini Cloudflare Worker + R2 üzerinden yükler. Firebase
// Storage bucket'ı oluşturulamadığı (muhtemelen faturalandırma sorunu)
// için görsel yükleme bu Worker'a taşındı — bkz. cloudflare-worker/.
//
// Worker adresi .env dosyasındaki VITE_IMAGE_WORKER_URL değişkeninden
// okunur. Worker henüz deploy edilip bu değişken ayarlanmadan resim
// yükleme denenirse anlaşılır bir hata fırlatılır.

const IMAGE_WORKER_URL = import.meta.env.VITE_IMAGE_WORKER_URL

// Verilen dosyayı Worker'a yükler ve herkese açık görsel URL'sini döner.
// `idToken`, auth.currentUser.getIdToken() ile alınan Firebase ID token'ıdır.
export async function uploadProductImage(file, idToken) {
  if (!IMAGE_WORKER_URL) {
    throw new Error(
      'Resim yükleme servisi ayarlanmamış. Lütfen .env dosyasında VITE_IMAGE_WORKER_URL değerini tanımlayın (bkz. cloudflare-worker/README.md).'
    )
  }

  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`${IMAGE_WORKER_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
    body: formData,
  })

  if (!response.ok) {
    let errorMessage = 'Resim yüklenirken bir hata oluştu.'
    try {
      const data = await response.json()
      if (data?.error) errorMessage = data.error
    } catch {
      // yanıt JSON değilse varsayılan mesaj kullanılır
    }
    throw new Error(errorMessage)
  }

  const data = await response.json()
  return data.url
}

// Bir görseli siler (ör. ürün silinirken ya da yeni görselle
// değiştirilirken). Sessizce başarısız olur — silme hatası kullanıcının
// işlemini engellemeyecek kadar önemsizdir, sadece konsola loglanır.
export async function deleteProductImage(imageUrl, idToken) {
  if (!IMAGE_WORKER_URL || !imageUrl) return
  try {
    const path = imageUrl.replace(IMAGE_WORKER_URL, '')
    if (!path.startsWith('/images/')) return
    await fetch(`${IMAGE_WORKER_URL}${path}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${idToken}` },
    })
  } catch (err) {
    console.error('Eski görsel silinirken hata (göz ardı edildi):', err)
  }
}
