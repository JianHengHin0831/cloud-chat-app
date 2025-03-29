// firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAk7UITYRxCKdyms5JWD_4Wn-b6mEzJbr0",
  authDomain: "my-nuxt-app-b8742.firebaseapp.com",
  projectId: "my-nuxt-app-b8742",
  storageBucket: "my-nuxt-app-b8742.firebasestorage.app",
  messagingSenderId: "433505340364",
  appId: "1:433505340364:web:721396c426b03677ce2b69",
  measurementId: "G-75LWWWXX3H",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Realtime Database
const db = getDatabase(app);

// Initialize Authentication
const auth = getAuth(app);

const storage = getStorage(app);

// Initialize Functions
const functions = getFunctions(app);

// Providers
const googleProvider = new GoogleAuthProvider();

export { app, db, storage, functions, auth, googleProvider };
