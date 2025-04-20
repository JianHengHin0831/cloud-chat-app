import { defineStore } from "pinia";
import { auth, db } from "~/firebase/firebase.js";
import { ref as dbRef, set } from "firebase/database";

export const useColorModeStore = defineStore("colorMode", {
  state: () => ({
    mode: "light",
    systemPreference: null,
  }),

  actions: {
    setMode(newMode) {
      this.mode = newMode;

      if (process.client) {
        localStorage.setItem("color-mode", newMode);

        this.applyMode(newMode);

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
        const savedMode = localStorage.getItem("color-mode");

        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        this.systemPreference = prefersDark ? "dark" : "light";

        if (savedMode) {
          this.mode = savedMode;
        } else {
          this.mode = this.systemPreference;
        }

        this.applyMode(this.mode);

        window
          .matchMedia("(prefers-color-scheme: dark)")
          .addEventListener("change", (e) => {
            this.systemPreference = e.matches ? "dark" : "light";

            if (!localStorage.getItem("color-mode")) {
              this.setMode(this.systemPreference);
            }
          });
      }
    },

    applyMode(mode) {
      if (mode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    },

    cleanup() {
      if (process.client) {
        window
          .matchMedia("(prefers-color-scheme: dark)")
          .removeEventListener("change", () => {});
      }
    },

    toggleColorMode() {
      const newMode = this.mode === "light" ? "dark" : "light";
      this.setMode(newMode);
    },

    initColorMode() {
      return this.init();
    },
  },

  getters: {
    isDark: (state) => state.mode === "dark",
    currentMode: (state) => state.mode,
  },
});
