// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from "path";

export default defineNuxtConfig({
  alias: {
    "@opentelemetry/api": resolve(
      __dirname,
      "node_modules/@opentelemetry/api/build/src/index.js"
    ),
  },
  compatibilityDate: "2024-11-01",
  runtimeConfig: {
    firebase: {
      serviceAccount: {
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url:
          process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
      },
    },
  },
  devtools: { enabled: true },
  vite: {
    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "unsafe-none",
      },
    },
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // 忽略特定警告
          if (
            warning.code === "THIS_IS_UNDEFINED" &&
            warning.id?.includes("@opentelemetry/api")
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
  },
  nitro: {
    routeRules: {
      "/api/**": {
        cors: true,
      },
      "/login": {
        headers: {
          "Cross-Origin-Embedder-Policy": "unsafe-none",
        },
      },
    },
    preset: "firebase",
    firebase: {
      gen: 2,
      nodeVersion: "22",
    },
    output: {
      dir: ".output",
      serverDir: ".output/server",
      publicDir: ".output/public",
    },
    experimental: {
      asyncContext: true,
    },
  },
  modules: ["@nuxtjs/tailwindcss", "nuxt-vuefire"],
  vuefire: {
    config: {
      apiKey: "AIzaSyAk7UITYRxCKdyms5JWD_4Wn-b6mEzJbr0",
      authDomain: "my-nuxt-app-b8742.firebaseapp.com",
      projectId: "my-nuxt-app-b8742",
      storageBucket: "my-nuxt-app-b8742.firebasestorage.app",
      messagingSenderId: "433505340364",
      appId: "1:433505340364:web:721396c426b03677ce2b69",
      measurementId: "G-75LWWWXX3H",
    },
  },
  tailwindcss: {
    configPath: "~/tailwind.config.ts", // 自定義 Tailwind 配置文件路徑
    exposeConfig: true, // 將 Tailwind 配置暴露給客戶端
  },
  build: {
    transpile: ["emoji-mart-vue-fast"],
  },
  routeRules: {
    "/login": {
      headers: {
        "Cross-Origin-Embedder-Policy": "unsafe-none",
      },
    },
  },
});
