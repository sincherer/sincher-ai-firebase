import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDRlCDWemX9EQWpBXPHO_0gNUJbNgZlpVg",
  authDomain: "sincher-ai.firebaseapp.com",
  projectId: "sincher-ai",
  storageBucket: "sincher-ai.firebasestorage.app",
  messagingSenderId: "41494066834",
  appId: "1:41494066834:web:8a4173c2920ac8c829584b",
  measurementId: "G-TZHQVL3581"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);