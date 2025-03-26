// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  runtimeConfig: {
    firebase: {
      serviceAccount: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
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
  },
  nitro: {
    routeRules: {
      "/api/**": {
        cors: true
      },
    },
    preset: "firebase",
    firebase: {
      gen: 2,
      nodeVersion: "22"
    },
    output: {
      dir: ".output",
      serverDir: ".output/server",
      publicDir: ".output/public"
    },
    experimental: {
      asyncContext: true
    }
  },
  modules: ["@nuxtjs/tailwindcss"],
  tailwindcss: {
    configPath: "~/tailwind.config.ts", // 自定義 Tailwind 配置文件路徑
    exposeConfig: true, // 將 Tailwind 配置暴露給客戶端
  },
  build: {
    transpile: ["emoji-mart-vue-fast"],
  },
});
