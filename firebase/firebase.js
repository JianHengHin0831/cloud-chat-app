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

// 连接池配置
const connectionPoolConfig = {
  poolSize: 100, // 最大连接数
  timeout: 30000, // 30秒超时
  autoRetry: true, // 自动重试
};

// 重试配置
const retryConfig = {
  maxRetries: 5,
  initialDelay: 300, // 初始延迟 300ms
  maxDelay: 10000, // 最大延迟 10s
  factor: 2, // 指数退避因子
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

// 智能重试包装器
const withRetry = async (operation, config = retryConfig) => {
  let lastError;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // 检查是否是可重试的错误
      if (!isRetryableError(error) || attempt === config.maxRetries) {
        throw error;
      }

      lastError = error;

      // 等待退避时间
      await new Promise((resolve) => setTimeout(resolve, delay));

      // 计算下一次退避时间（指数退避）
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

// 判断错误是否可重试
const isRetryableError = (error) => {
  // 网络错误、超时、服务不可用等可重试
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

// 创建带有重试功能的 Firebase 操作
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
