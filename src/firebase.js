import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 

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

// Authentication ve Firestore servislerini dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 