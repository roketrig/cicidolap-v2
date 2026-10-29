import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, indexedDBLocalPersistence, connectAuthEmulator } from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDblg2ewqKF-GSi_89x5T5O7Jur2ebXt9g",
  authDomain: "cici-dolap.firebaseapp.com",
  projectId: "cici-dolap",
  storageBucket: "cici-dolap.firebasestorage.app",
  messagingSenderId: "712264809977",
  appId: "1:712264809977:web:c9218b1ea92152a3281128"
};

const app = initializeApp(firebaseConfig);

// Authentication ve Firestore servislerini dışa aktar.
// NOT: Firebase Storage artık kullanılmıyor — ürün görselleri Cloudflare R2'ye
// taşındı (bkz. cloudflare-worker/ klasörü ve src/imageUpload.js).
//
// Mağaza uygulamasında (Capacitor) getAuth() kullanılmıyor: getAuth, popup/
// redirect girişi için authDomain'den bir iframe yüklüyor ve iOS WebView'ında
// (capacitor:// şeması) bu yükleme takılıp onAuthStateChanged hiç tetiklenmiyor
// — uygulama açılış çarkında kalıyor. Sadece e-posta/şifre girişi
// kullandığımız için popup çözümleyicisine gerek yok.
export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
  : getAuth(app);
export const db = getFirestore(app);

// Uçtan uca testler (npm run test:e2e) gerçek veritabanı yerine yerel
// Firebase emülatörlerine bağlanır — bkz. e2e/ ve firebase.json.
if (import.meta.env.VITE_FIREBASE_EMULATORS === "1") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
