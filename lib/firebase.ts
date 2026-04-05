import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD2unswHpAyZnqCcfpPvmN23yP0LKEO6KU",
  authDomain: "molarmind-c7de4.firebaseapp.com",
  projectId: "molarmind-c7de4",
  storageBucket: "molarmind-c7de4.firebasestorage.app",
  messagingSenderId: "224128758387",
  appId: "1:224128758387:web:80110d5c24c15beabb7006",
  measurementId: "G-YZM4LLHS7L"
};

// Initialize Firebase only if we have environment variables and haven't already
const app = getApps().length === 0 && firebaseConfig.projectId ? initializeApp(firebaseConfig) : getApps()[0];
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

export { app, db, auth };
