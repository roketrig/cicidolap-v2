// Cici Dolap - Görsel Yükleme Worker'ı
//
// NEDEN GEREKLİ: Firebase Storage bucket oluşturma (muhtemelen faturalandırma
// sorunu yüzünden) çalışmıyordu. Bu Worker, ürün görsellerinin yüklenmesi ve
// okunması işini Firebase Storage yerine Cloudflare R2 üzerinden yapar.
// Giriş/kayıt (Firebase Auth) ve ürün/mesaj/favori verileri (Firestore)
// olduğu gibi Firebase'de kalmaya devam eder — sadece resimler taşındı.
//
// Nasıl çalışır:
//  - POST /upload         -> Giriş yapmış kullanıcı kendi klasörüne resim yükler.
//  - GET  /images/:uid/:ad -> Herkes (giriş yapmamış dahil) resmi görüntüleyebilir.
//  - DELETE /images/:uid/:ad -> Sadece resmin sahibi ya da admin silebilir.
//
// Kimlik doğrulama Firebase Admin SDK OLMADAN yapılıyor (Admin SDK,
// Cloudflare Workers ortamında çalışmaz). Bunun yerine istekle gelen
// Firebase ID token'ı, Google'ın herkese açık genel anahtarlarıyla (JWKS)
// doğrudan doğrulanıyor.

import { createRemoteJWKSet, jwtVerify } from 'jose'

// Firebase ID token'larını imzalayan Google servis hesabının genel anahtarları.
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB - Firebase Storage kuralıyla aynı sınır

// Worker "isolate" yaşadığı sürece JWKS'i tekrar tekrar indirmemek için
// modül kapsamında bir kere oluşturuluyor (jose kendi içinde de önbellekler).
let jwksCache = null
function getJwks() {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(new URL(JWKS_URL))
  }
  return jwksCache
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8' },
  })
}

// Authorization: Bearer <token> başlığındaki Firebase ID token'ını doğrular.
// Geçerliyse { uid, email } döner, değilse null.
async function verifyFirebaseToken(request, env) {
  const authHeader = request.headers.get('Authorization') || ''
  const match = authHeader.match(/^Bearer (.+)$/)
  if (!match) return null

  try {
    const { payload } = await jwtVerify(match[1], getJwks(), {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
    })
    // Firebase ID token'larında kullanıcı kimliği hem "sub" hem "user_id"
    // alanında bulunur; "sub" standart JWT alanı olduğu için onu kullanıyoruz.
    if (!payload.sub) return null
    return { uid: payload.sub, email: payload.email || null }
  } catch (err) {
    return null
  }
}

// Dosya adını güvenli hale getirir: sadece harf/rakam/nokta/tire/alt çizgi
// kalır, böylece R2 anahtarına ("key") enjekte edilebilecek "/" ya da ".."
// gibi karakterler temizlenmiş olur.
function sanitizeFileName(name) {
  const cleaned = (name || 'resim').replace(/[^a-zA-Z0-9._-]/g, '_')
  return cleaned.slice(-100) || 'resim'
}

function guessContentType(key) {
  const ext = key.split('.').pop().toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  return 'image/jpeg'
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) })
    }

    // --- GET /images/{uid}/{dosyaAdi} : herkese açık okuma ---
    if (request.method === 'GET' && url.pathname.startsWith('/images/')) {
      const key = 'products/' + url.pathname.slice('/images/'.length)
      const object = await env.BUCKET.get(key)
      if (!object) {
        return new Response('Görsel bulunamadı', { status: 404, headers: corsHeaders(origin) })
      }
      const headers = new Headers(corsHeaders(origin))
      headers.set('Content-Type', object.httpMetadata?.contentType || guessContentType(key))
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      if (object.httpEtag) headers.set('ETag', object.httpEtag)
      return new Response(object.body, { headers })
    }

    // --- POST /upload : giriş yapmış kullanıcı resim yükler ---
    if (request.method === 'POST' && url.pathname === '/upload') {
      const user = await verifyFirebaseToken(request, env)
      if (!user) {
        return jsonResponse({ error: 'Giriş yapmanız gerekiyor.' }, 401, origin)
      }

      let formData
      try {
        formData = await request.formData()
      } catch {
        return jsonResponse({ error: 'Geçersiz istek gövdesi.' }, 400, origin)
      }

      const file = formData.get('image')
      if (!file || typeof file === 'string') {
        return jsonResponse({ error: 'Resim dosyası bulunamadı.' }, 400, origin)
      }
      if (!file.type || !file.type.startsWith('image/')) {
        return jsonResponse({ error: 'Sadece resim dosyası yükleyebilirsiniz.' }, 400, origin)
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return jsonResponse({ error: "Resim 5MB'dan büyük olamaz." }, 400, origin)
      }

      const fileName = `${Date.now()}_${sanitizeFileName(file.name)}`
      const key = `products/${user.uid}/${fileName}`

      await env.BUCKET.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
      })

      const publicUrl = `${url.origin}/images/${user.uid}/${fileName}`
      return jsonResponse({ url: publicUrl }, 200, origin)
    }

    // --- DELETE /images/{uid}/{dosyaAdi} : sadece sahibi ya da admin ---
    if (request.method === 'DELETE' && url.pathname.startsWith('/images/')) {
      const user = await verifyFirebaseToken(request, env)
      if (!user) {
        return jsonResponse({ error: 'Giriş yapmanız gerekiyor.' }, 401, origin)
      }

      const rest = url.pathname.slice('/images/'.length)
      const ownerUid = rest.split('/')[0]
      const isAdmin = Boolean(user.email && env.ADMIN_EMAIL && user.email === env.ADMIN_EMAIL)

      if (user.uid !== ownerUid && !isAdmin) {
        return jsonResponse({ error: 'Bu resmi silme yetkiniz yok.' }, 403, origin)
      }

      await env.BUCKET.delete('products/' + rest)
      return jsonResponse({ ok: true }, 200, origin)
    }

    return new Response('Bulunamadı', { status: 404, headers: corsHeaders(origin) })
  },
}
