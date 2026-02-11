
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDqaIHR1FYmpzlR5osbl5YCOFdQN5qCFUA",
  authDomain: "corruptionwatchdog.firebaseapp.com",
  projectId: "corruptionwatchdog",
  storageBucket: "corruptionwatchdog.firebasestorage.app",
  messagingSenderId: "92862060149",
  appId: "1:92862060149:web:b346745f069ef49a1b8a3c",
  measurementId: "G-G5BBED87N9"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
