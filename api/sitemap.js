// api/sitemap.js — /sitemap.xml (Vercel fonksiyonu, bkz. vercel.json)
//
// Sabit sayfalar + kategori sayfaları + yayındaki (onaylı, satılmamış)
// ilanlar. Her istekte Firestore'dan üretildiği için yeni onaylanan ilan
// deploy gerekmeden sitemap'e girer, satılan çıkar. Yanıt CDN'de 1 saat
// önbellekleniyor; Firestore'u yalnızca saatte bir okuyor.
//
// Firestore'a anahtarsız (herkese açık) REST sorgusu atılıyor: kurallar
// status == 'approved' ilanları herkese okutuyor, sorgu da bu koşulla.
import { CATEGORIES } from '../src/data/categories.js'

const SITE = 'https://cicidolap.com.tr'
const RUN_QUERY = 'https://firestore.googleapis.com/v1/projects/cici-dolap/databases/(default)/documents:runQuery'
const MAX_LISTINGS = 45000 // sitemap başına sınır 50.000 adres

const STATIC_PAGES = [
  ['/', '1.0'],
  ['/products', '0.9'],
  ['/yardim', '0.5'],
  ['/gizlilik', '0.3'],
  ['/kullanim-sartlari', '0.3'],
]

async function fetchListings() {
  const res = await fetch(RUN_QUERY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'products' }],
        where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'approved' } } },
        select: { fields: [{ fieldPath: 'sold' }, { fieldPath: 'updatedAt' }, { fieldPath: 'createdAt' }] },
        limit: MAX_LISTINGS,
      },
    }),
  })
  if (!res.ok) throw new Error(`Firestore ${res.status}: ${await res.text()}`)
  const rows = await res.json()
  return rows
    .filter((r) => r.document && !r.document.fields?.sold?.booleanValue)
    .map((r) => {
      const f = r.document.fields || {}
      const ts = f.updatedAt?.timestampValue || f.createdAt?.timestampValue
      return { id: r.document.name.split('/').pop(), lastmod: ts ? ts.slice(0, 10) : null }
    })
}

const url = (loc, priority, lastmod) =>
  `  <url><loc>${SITE}${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<priority>${priority}</priority></url>`

export default async function handler(req, res) {
  let listings = []
  try {
    listings = await fetchListings()
  } catch (err) {
    // İlanlar alınamasa da sabit sayfalarla geçerli bir sitemap dön.
    console.error('Sitemap: ilanlar alınamadı', err)
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...STATIC_PAGES.map(([loc, p]) => url(loc, p)),
    ...CATEGORIES.map((c) => url(`/products?category=${c.id}`, '0.8')),
    ...listings.map((l) => url(`/product/${l.id}`, '0.7', l.lastmod)),
    '</urlset>',
  ].join('\n')

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}
