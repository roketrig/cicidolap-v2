// Uçtan uca testler — ilan verme akışı her sürümden önce burada sınanır.
// Çalıştır: npm run test:e2e (Firebase emülatörlerini açar, testleri koşar,
// kapatır). Gerçek veritabanına ve görsel servisine dokunulmaz.
import { defineConfig, devices } from '@playwright/test'

const PORT = 5174

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    ...devices['Pixel 7'],
    // Yerelde kurulu Edge yeterli; CI'da Playwright'ın Chromium'u kurulur.
    channel: process.env.CI ? undefined : 'msedge',
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    env: {
      VITE_FIREBASE_EMULATORS: '1',
      VITE_IMAGE_WORKER_URL: 'https://images.e2e.test',
    },
  },
})
