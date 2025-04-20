import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { auth, db } from "~/firebase/firebase.js";
import { ref as dbRef, onValue } from "firebase/database";

export const useFontSizeStore = defineStore("fontSize", () => {
  const fontSize = ref("normal");
  let unsubscribe = null;

  const applyFontSize = () => {
    if (typeof document === "undefined") return;

    document.documentElement.classList.remove(
      "text-small",
      "text-normal",
      "text-large"
    );

    document.documentElement.classList.add(`text-${fontSize.value}`);
  };

  const initFontSize = () => {
    if (typeof window === "undefined") return;

    const user = auth.currentUser;
    if (user) {
      const userRef = dbRef(db, `users/${user.uid}/advancedSettings`);

      if (unsubscribe) {
        unsubscribe();
      }

      unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const advSettings = snapshot.val();
          if (advSettings.fontSize) {
            fontSize.value = advSettings.fontSize;
            applyFontSize();
          }
        }
      });

      return;
    }

    const savedFontSize = localStorage.getItem("fontSize");
    if (savedFontSize) {
      fontSize.value = savedFontSize;
    }

    applyFontSize();
  };

  watch(fontSize, (newValue) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("fontSize", newValue);
    }
    applyFontSize();
  });

  const setFontSize = (size) => {
    if (["small", "normal", "large"].includes(size)) {
      fontSize.value = size;
    }
  };

  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };

  if (typeof window !== "undefined") {
    initFontSize();
  }

  return {
    fontSize,
    applyFontSize,
    initFontSize,
    setFontSize,
    cleanup,
  };
});
