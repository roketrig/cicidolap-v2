// scripts/seedProducts.js
//
// Cici Dolap - Örnek Ürün Ekleme Scripti
// ----------------------------------------
// Vitrinin boş görünmemesi için admin hesabınla giriş yapıp veritabanına
// birkaç örnek ürün (doğrudan "approved" durumunda, yani anında ana
// sayfada görünür) ekler.
//
// GÜVENLİK: Şifren hiçbir yere kaydedilmiyor, loglanmıyor, bana ya da
// başka bir yere gönderilmiyor — sadece bu script çalışırken bir kere
// Firebase'e giriş yapmak için, senin bilgisayarında, senin elinle
// yazdığın haliyle kullanılıyor. Firebase config'i zaten uygulamanın
// kendisinde de var (src/firebase.js) — bu "apiKey" gizli bir sır değil,
// gerçek erişim kontrolü Firestore Security Rules'ta.
//
// ÖN KOŞUL: Bu scriptin çalışabilmesi için firestore.rules dosyasındaki
// güncel hali (admin'in "approved" statüsüyle doğrudan ürün
// oluşturabilmesine izin veren kural) Firebase Console'dan yayınlanmış
// olmalı. Yayınlamadan çalıştırırsan "permission-denied" hatası alırsın.
//
// ÇALIŞTIRMA:
//   node scripts/seedProducts.js
//
// (package.json zaten "type": "module" ve "firebase" paketini içerdiği
// için ekstra bir kurulum gerekmez.)

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import readline from 'node:readline'

const firebaseConfig = {
  apiKey: 'AIzaSyDblg2ewqKF-GSi_89x5T5O7Jur2ebXt9g',
  authDomain: 'cici-dolap.firebaseapp.com',
  projectId: 'cici-dolap',
  storageBucket: 'cici-dolap.firebasestorage.app',
  messagingSenderId: '712264809977',
  appId: '1:712264809977:web:c9218b1ea92152a3281128'
}

const ADMIN_EMAIL = 'admin@cici-dolap.com'

const SAMPLE_PRODUCTS = [
  {
    title: 'Bebek Tulum Seti (3-6 Ay)',
    category: 'Bebek (3-12 ay)',
    price: 150,
    description: '3-6 ay bebekler için 3 parça pamuklu tulum seti. Çok az giyildi, lekesiz ve yıpranmamış durumda.',
    condition: 'like-new',
    province: 'İstanbul',
    district: 'Kadıköy',
    phone: '05551234567'
  },
  {
    title: 'Ahşap Eğitici Küp Seti',
    category: 'Yürüme (1-2 yaş)',
    price: 0,
    description: 'Boyalı, doğal ahşap eğitici küp seti. Hiç kullanılmadı, kutusunda duruyor. Bağış olarak veriyorum.',
    condition: 'new',
    province: 'Ankara',
    district: 'Çankaya',
    phone: '05559876543'
  },
  {
    title: 'Kız Çocuğu Kışlık Mont (5 Yaş)',
    category: 'Çocuk (3-6 yaş)',
    price: 280,
    description: 'Bir kış boyunca giyildi, iç astarı sıcak tutuyor. Fermuar ve düğmeler sağlam, yıpranma yok.',
    condition: 'used',
    province: 'İzmir',
    district: 'Bornova',
    phone: '05335551122'
  },
  {
    title: 'Okul Çantası + Kalem Kutusu',
    category: 'Okul (7-12 yaş)',
    price: 200,
    description: 'Bir dönem kullanıldı, tüm fermuarları sorunsuz çalışıyor. Kalem kutusu hediye.',
    condition: 'used',
    province: 'Bursa',
    district: 'Nilüfer',
    phone: '05445556677'
  },
  {
    title: 'Yenidoğan Battaniye ve Bere Seti',
    category: 'Yenidoğan (0-3 ay)',
    price: 90,
    description: 'Yumuşak organik pamuktan battaniye ve bere seti. Sadece bir kez kullanıldı, yıkandı.',
    condition: 'like-new',
    province: 'Antalya',
    district: 'Muratpaşa',
    phone: '05321112233'
  }
]

// Şifreyi terminalde görünmeden almak için basit bir "gizli girdi"
// yardımcı fonksiyonu. Bazı terminallerde (ör. bazı Windows kabukları)
// setRawMode desteklenmeyebilir; öyle bir durumda otomatik olarak
// normal (görünür) girdiye düşer, script yine çalışır.
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

    let rawModeSupported = true
    try {
      process.stdin.setRawMode(true)
    } catch {
      rawModeSupported = false
    }

    if (!rawModeSupported) {
      rl.question(question, (answer) => {
        rl.close()
        resolve(answer)
      })
      return
    }

    process.stdout.write(question)
    let input = ''
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    const BACKSPACE = '\u007f'
    const CTRL_C = '\u0003'
    const EOF = '\u0004'

    const onData = (chunk) => {
      const char = chunk.toString('utf8')
      if (char === '\n' || char === '\r' || char === EOF) {
        process.stdin.setRawMode(false)
        process.stdin.removeListener('data', onData)
        process.stdout.write('\n')
        rl.close()
        resolve(input)
        return
      }
      if (char === CTRL_C) {
        process.stdin.setRawMode(false)
        process.exit(1)
      }
      if (char === BACKSPACE) {
        input = input.slice(0, -1)
        return
      }
      input += char
    }
    process.stdin.on('data', onData)
  })
}

async function main() {
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)

  const password = await askHidden(`"${ADMIN_EMAIL}" şifresini gir: `)

  console.log('Giriş yapılıyor...')
  await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password)
  console.log('Giriş başarılı. Örnek ürünler ekleniyor...\n')

  for (const product of SAMPLE_PRODUCTS) {
    const docRef = await addDoc(collection(db, 'products'), {
      ...product,
      city: `${product.province} / ${product.district}`,
      imageUrl: '',
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email,
      status: 'approved',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    console.log(`✓ Eklendi: ${product.title}  (id: ${docRef.id})`)
  }

  console.log('\nTamamlandı! Ana sayfayı yenileyip kontrol edebilirsin.')
  process.exit(0)
}

main().catch((err) => {
  console.error('\nHata:', err.code || err.message)
  if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
    console.error('Şifre yanlış görünüyor, tekrar dene.')
  } else if (err.code === 'permission-denied' || err.message?.includes('permission')) {
    console.error("Firestore rules henüz Firebase Console'dan yayınlanmamış olabilir (bkz. firestore.rules).")
  }
  process.exit(1)
})
