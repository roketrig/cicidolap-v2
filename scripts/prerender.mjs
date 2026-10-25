// scripts/prerender.mjs
//
// Yasal sayfaları (gizlilik, şartlar, yardım, hesap silme) build sonrası statik
// HTML olarak dist/<yol>/index.html içine yazar. Uygulama tek sayfalık (SPA)
// olduğu için bu sayfaların metni JavaScript çalışmayan istemcilere (Google Play
// ve App Store denetleyicileri, arama botları) görünmüyordu. React, sayfa
// yüklenince #root içeriğini kendi çıktısıyla değiştirir; kullanıcı için
// davranış aynı kalır.
import { createServer } from 'vite'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'

const PAGES = [
  { route: '/gizlilik', module: '/src/pages/Gizlilik.jsx', title: 'Gizlilik & KVKK Aydınlatma Metni — Cici Dolap' },
  { route: '/kullanim-sartlari', module: '/src/pages/Terms.jsx', title: 'Kullanım Şartları — Cici Dolap' },
  { route: '/yardim', module: '/src/pages/Help.jsx', title: 'Yardım Merkezi — Cici Dolap' },
  { route: '/hesap-sil', module: '/src/pages/DeleteAccount.jsx', title: 'Hesabımı Sil — Cici Dolap' },
]

const dist = path.resolve('dist')
const template = await readFile(path.join(dist, 'index.html'), 'utf8')
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })

try {
  for (const page of PAGES) {
    const mod = await vite.ssrLoadModule(page.module)
    const Page = mod.default
    const html = renderToString(
      React.createElement(StaticRouter, { location: page.route }, React.createElement(Page, { user: null }))
    )
    const out = template
      .replace(/<title>.*?<\/title>/, `<title>${page.title}</title>`)
      .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
    if (out === template) throw new Error(`Şablon güncellenemedi: ${page.route}`)
    const dir = path.join(dist, page.route)
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, 'index.html'), out)
    console.log(`prerender ✓ ${page.route} (${html.length} karakter)`)
  }
} finally {
  await vite.close()
}
