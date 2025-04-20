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

const poolConfig = {
  poolSize: 100,
  timeout: 30000,
  autoRetry: true,
};

const retryConfig = {
  maxRetries: 3,
  initialDelay: 300,
  maxDelay: 10000,
  factor: 2,
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

const withRetry = async (operation, config = retryConfig) => {
  let lastError;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!isRetryableError(error) || attempt === config.maxRetries) {
        throw error;
      }

      lastError = error;

      await new Promise((resolve) => setTimeout(resolve, delay));

      delay = Math.min(delay * config.factor, config.maxDelay);

      console.warn(
        `Firebase operation failed (attempt ${attempt + 1}/${
          config.maxRetries + 1
        }): ${error.message}. Retrying...`
      );
    }
  }

  throw lastError;
};

const isRetryableError = (error) => {
  const retryableCodes = [
    "NETWORK_ERROR",
    "TIMEOUT",
    "UNAVAILABLE",
    "INTERNAL",
    "RESOURCE_EXHAUSTED",
    "DEADLINE_EXCEEDED",
  ];

  return (
    retryableCodes.includes(error.code) ||
    error.message.includes("network") ||
    error.message.includes("timeout") ||
    error.message.includes("unavailable")
  );
};

// Create a Firebase action with retry
const createRetryableOperation = (operation) => {
  return (...args) => withRetry(() => operation(...args));
};

export {
  app,
  db,
  storage,
  functions,
  auth,
  googleProvider,
  withRetry,
  createRetryableOperation,
};
