import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // dist: build çıktısı. cloudflare-worker: kendi package.json'ı ve
  // çalışma ortamı olan ayrı bir proje, ayrı lint'lenir. android: Capacitor.
  globalIgnores(['dist', 'cloudflare-worker', 'android']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // React 19 otomatik JSX runtime kullanıyor; "import React" satırı
      // artık gerekli değil ama zararsız — sadece "kullanılmıyor" uyarısını
      // susturuyoruz (bilerek _ ile başlayan değişkenler de yoksayılır).
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^(React|_)',
        argsIgnorePattern: '^_',
      }],
      // exhaustive-deps: faydalı ama bu kod tabanında çoğu useEffect bilerek
      // tek seferlik; hard error yerine uyarı.
      'react-hooks/exhaustive-deps': 'warn',
      // react-hooks v7'nin yeni "react-compiler" tarzı katı kuralları
      // (fonksiyonu tanımlanmadan önce çağırma, effect içinde setState vb.).
      // Bu proje bu kalıplara göre yazılmadı; kapatıyoruz.
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/incompatible-library': 'off',
    },
  },
  {
    // Node ortamında elle çalıştırılan scriptler.
    files: ['scripts/**/*.{js,jsx}', '*.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])
