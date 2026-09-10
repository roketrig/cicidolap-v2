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

// Yüklemeden önce görseli tarayıcıda küçültür/sıkıştırır. Telefondan
// çekilen 3-5 MB'lık fotoğraflar ~200-400 KB'a iner — hem yükleme hızlanır
// hem de kart listeleri çok daha hızlı açılır. Başarısız olursa (ör.
// bozuk dosya) sessizce orijinali döner.
export async function compressImage(file, { maxDimension = 1600, quality = 0.82 } = {}) {
  if (!file || !file.type?.startsWith('image/') || file.type === 'image/gif') {
    return file
  }
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const img = await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = dataUrl
    })

    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
    // Zaten küçük ve dosya boyutu makulse hiç uğraşma
    if (scale === 1 && file.size <= 600 * 1024) return file

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    )
    if (!blob || blob.size >= file.size) return file // faydası yoksa orijinal

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() })
  } catch (err) {
    console.warn('Görsel sıkıştırılamadı, orijinali yükleniyor:', err)
    return file
  }
}

// Verilen dosyayı Worker'a yükler ve herkese açık görsel URL'sini döner.
// `idToken`, auth.currentUser.getIdToken() ile alınan Firebase ID token'ıdır.
export async function uploadProductImage(file, idToken) {
  if (!IMAGE_WORKER_URL) {
    throw new Error(
      'Resim yükleme servisi ayarlanmamış. Lütfen .env dosyasında VITE_IMAGE_WORKER_URL değerini tanımlayın (bkz. cloudflare-worker/README.md).'
    )
  }

  const optimized = await compressImage(file)
  const formData = new FormData()
  formData.append('image', optimized)

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
