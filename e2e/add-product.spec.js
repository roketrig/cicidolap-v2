// İlan verme ve düzenleme — uygulamanın ana özelliği. Mobil ekranda:
// kayıt ol → eksik alan uyarıları → fotoğraflı ilan ver (Türkçe fiyat
// "1.500") → Firestore'a doğru yazıldı mı → düzenle (fiyat "49,90").
// Firestore/Auth yerel emülatörde (gerçek firestore.rules ile), görsel
// servisi taklit ediliyor.
import { test, expect } from '@playwright/test'
import path from 'node:path'

const FIRESTORE = 'http://127.0.0.1:8080/v1/projects/cici-dolap/databases/(default)/documents'
const PHOTO = path.resolve('public/favicon-512.png')

// Emülatörde kuralları atlayarak (owner) ürünleri oku.
async function listProducts(request) {
  const res = await request.get(`${FIRESTORE}/products`, { headers: { Authorization: 'Bearer owner' } })
  const body = await res.json()
  return (body.documents || []).map((d) => ({
    id: d.name.split('/').pop(),
    fields: Object.fromEntries(
      Object.entries(d.fields).map(([k, v]) => [k, v.stringValue ?? v.integerValue ?? v.doubleValue ?? v.arrayValue ?? v.booleanValue ?? v])
    ),
  }))
}

test('ilan ver ve düzenle', async ({ page, request }) => {
  const uploads = []
  await page.route('https://images.e2e.test/upload', async (route) => {
    const body = route.request().postDataBuffer()
    uploads.push(body.length)
    await route.fulfill({ json: { url: `https://images.e2e.test/images/test/${uploads.length}.jpg` } })
  })
  await page.route('https://images.e2e.test/images/**', (route) => route.fulfill({ path: PHOTO }))

  // Kayıt ol (her çalıştırmada yeni hesap)
  const email = `e2e-${Date.now()}@example.test`
  await page.goto('/register')
  await page.getByPlaceholder('Örn: Ayşe').fill('Test Kullanıcı')
  await page.locator('main input[type=email]').fill(email)
  await page.locator('main input[type=password]').nth(0).fill('test-sifre-123')
  await page.locator('main input[type=password]').nth(1).fill('test-sifre-123')
  await page.locator('#agreeTerms').check()
  await page.locator('main form button[type=submit]').click()
  await expect(page).toHaveURL(/\/$/)

  await page.goto('/add-product')
  const submit = page.locator('main form button[type=submit]')
  const toast = page.locator('.cd-toast')

  // Fotoğrafsız → üstte görünür hata
  await submit.click()
  await expect(page.locator('.alert-danger')).toContainText('en az bir fotoğraf')
  await expect(page.locator('.alert-danger')).toBeInViewport()

  // Fotoğraf ekle, alanları boş bırak → Başlık uyarısı (WebView'da tarayıcı
  // uyarısı çıkmadığı için bizim mesajımız görünmeli)
  await page.locator('main input[type=file]').first().setInputFiles(PHOTO)
  await expect(page.locator('.imgpick-tile')).toHaveCount(1)
  await submit.click()
  await expect(toast).toContainText('Başlık')
  await expect(page.locator('main [name=title]')).toHaveClass(/is-invalid/)

  // Formu doldur; fiyat Türkçe biçimde
  await page.locator('main [name=title]').fill('E2E bebek arabası')
  await expect(page.locator('main [name=title]')).not.toHaveClass(/is-invalid/)
  await page.locator('main [name=category]').selectOption({ index: 1 })
  await page.locator('main [name=ageGroup]').selectOption({ index: 1 })
  if (await page.locator('main [name=subcategory]').count()) {
    await page.locator('main [name=subcategory]').selectOption({ index: 1 })
  }
  await page.locator('main [name=price]').fill('abc')
  await page.locator('main [name=description]').fill('Az kullanılmış, temiz.')
  await page.locator('main [name=province]').selectOption('İstanbul')
  await page.locator('main [name=district]').fill('Kadıköy')
  await submit.click()
  await expect(toast).toContainText('Fiyatı sadece rakamla')

  await page.locator('main [name=price]').fill('1.500')
  await submit.click()
  await expect(page.locator('.alert-success')).toContainText('Ürün başarıyla eklendi')
  expect(uploads).toHaveLength(1)
  expect(uploads[0]).toBeLessThan(5 * 1024 * 1024)

  const [product] = (await listProducts(request)).filter((p) => p.fields.title === 'E2E bebek arabası')
  expect(product, 'ürün Firestore\'a yazılmalı').toBeTruthy()
  expect(Number(product.fields.price)).toBe(1500)
  expect(product.fields.status).toBe('pending')
  expect(product.fields.district).toBe('Kadıköy')
  expect(product.fields.imageUrls.values).toHaveLength(1)

  // Düzenle: fiyat "49,90"
  await page.goto(`/edit-product/${product.id}`)
  await expect(page.locator('main [name=price]')).toHaveValue('1500')
  await page.locator('main [name=price]').fill('49,90')
  await page.locator('main form button[type=submit]').click()
  await expect(page.locator('.alert-success')).toContainText('güncellendi')
  const [edited] = (await listProducts(request)).filter((p) => p.id === product.id)
  expect(Number(edited.fields.price)).toBe(49.9)
})
