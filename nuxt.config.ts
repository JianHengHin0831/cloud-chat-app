// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from "path";

// @ts-ignore
export default defineNuxtConfig({
  alias: {
    "@opentelemetry/api": resolve(
      __dirname,
      "node_modules/@opentelemetry/api/build/src/index.js"
    ),
  },
  compatibilityDate: "2024-11-01",
  runtimeConfig: {
    apiBase: process.env.NUXT_API_BASE,
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
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID,
      },
    },
    public: {
      baseEncryptionKey: process.env.NUXT_PUBLIC_BASE_ENCRYPTION_KEY,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
    },
  },
  devtools: { enabled: true },
  vite: {
    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "unsafe-none",
      },
    },
    // optimizeDeps: {
    //   include: [
    //     "google-gax",
    //     "@grpc/proto-loader",
    //     "google-auth-library",
    //     "protobufjs",
    //     "winston-transport",
    //     "firebase-admin/app",
    //   ],
    //   esbuildOptions: {
    //     define: {
    //       global: "globalThis",
    //     },
    //   },
    // },
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
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
    // define: {
    //   "process.env.GRPC_SSL_CIPHER_SUITES": JSON.stringify("HIGH+ECDSA"),
    //   "process.env.GRPC_DNS_RESOLVER": JSON.stringify("native"),
    //   "process.env.GRPC_ENABLE_FORK_SUPPORT": JSON.stringify("1"),
    //   __dirname: JSON.stringify(__dirname),
    // },
  },
  nitro: {
    preset: "firebase",
    firebase: {
      gen: 2,
      nodeVersion: "22",
    },
    // externals: {
    //   inline: [
    //     "google-gax",
    //     "@grpc/proto-loader",
    //     "google-auth-library",
    //     "protobufjs",
    //     "firebase-admin",
    //     "firebase-admin/logging",
    //     "winston-transport",
    //     "@google-cloud/logging-winston",
    //   ],
    // },
    // esbuild: {
    //   options: {
    //     define: {
    //       "process.env.GRPC_SSL_CIPHER_SUITES": JSON.stringify("HIGH+ECDSA"),
    //       "process.env.GRPC_DNS_RESOLVER": JSON.stringify("native"),
    //       "process.env.GRPC_ENABLE_FORK_SUPPORT": JSON.stringify("1"),
    //       __dirname: JSON.stringify(__dirname),
    //       legalComments: "none",
    //     },
    //   },
    // },
  },
  modules: ["@nuxtjs/tailwindcss", "nuxt-vuefire", "@pinia/nuxt"],
  // @ts-ignore
  vuefire: {
    config: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    },
  },
  tailwindcss: {
    configPath: "~/tailwind.config.ts",
    exposeConfig: true,
  },
  build: {
    transpile: ["emoji-mart-vue-fast", "@heroicons/vue"],
    //   "@google-cloud/logging",
    //   "google-gax",
    //   "protobufjs",
    //   "@grpc/proto-loader",
    //   "google-auth-library",
    //   "firebase-admin",
    //   "firebase-admin/app",
    //   "firebase-admin/logging",
    //   "winston-transport",
    //   "@google-cloud/logging-winston",
  },
  routeRules: {
    "/login": {
      headers: {
        "Cross-Origin-Embedder-Policy": "unsafe-none",
      },
    },
  },
  css: ["~/assets/css/main.css"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  plugins: ["~/plugins/colorMode.js"],
  app: {
    head: {
      title: "CloudTalk",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "CloudTalk - Real-time chat application",
        },
      ],
    },
  },
});
