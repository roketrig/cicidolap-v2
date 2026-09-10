import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const auth = getAuth(app);
export const db = getFirestore(app);
