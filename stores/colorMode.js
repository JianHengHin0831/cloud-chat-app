import { defineStore } from "pinia";
import { auth, db } from "~/firebase/firebase.js";
import { ref as dbRef, set } from "firebase/database";

export const useColorModeStore = defineStore("colorMode", {
  state: () => ({
    mode: "light", // 默认为浅色模式
    systemPreference: null,
  }),

  actions: {
    setMode(newMode) {
      this.mode = newMode;
      // 保存到 localStorage
      if (process.client) {
        localStorage.setItem("color-mode", newMode);
        // 更新 HTML 类
        this.applyMode(newMode);

        // 更新 Realtime Database
        const user = auth.currentUser;
        if (user) {
          set(
            dbRef(db, `users/${user.uid}/advancedSettings/isLight`),
            newMode === "light"
          );
        }
      }
    },

    init() {
      if (process.client) {
        // 从 localStorage 读取
        const savedMode = localStorage.getItem("color-mode");

        // 检测系统偏好
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        this.systemPreference = prefersDark ? "dark" : "light";

        // 应用模式
        if (savedMode) {
          this.mode = savedMode;
        } else {
          this.mode = this.systemPreference;
        }

        this.applyMode(this.mode);

        // 监听系统偏好变化
        window
          .matchMedia("(prefers-color-scheme: dark)")
          .addEventListener("change", (e) => {
            this.systemPreference = e.matches ? "dark" : "light";
            // 如果用户没有明确设置，则跟随系统
            if (!localStorage.getItem("color-mode")) {
              this.setMode(this.systemPreference);
            }
          });
      }
    },

    applyMode(mode) {
      // 更新 HTML 类
      if (mode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    },

    // 添加 cleanup 方法
    cleanup() {
      if (process.client) {
        // 移除事件监听器
        window
          .matchMedia("(prefers-color-scheme: dark)")
          .removeEventListener("change", () => {});
      }
    },

    toggleColorMode() {
      const newMode = this.mode === "light" ? "dark" : "light";
      this.setMode(newMode);
    },

    // 添加兼容方法
    initColorMode() {
      return this.init();
    },
  },

  getters: {
    isDark: (state) => state.mode === "dark",
    currentMode: (state) => state.mode,
  },
});
