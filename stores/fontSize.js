import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { auth, db } from "~/firebase/firebase.js";
import { ref as dbRef, onValue } from "firebase/database";

export const useFontSizeStore = defineStore("fontSize", () => {
  const fontSize = ref("normal"); // 默认值为 normal
  let unsubscribe = null;

  // 应用字体大小到文档
  const applyFontSize = () => {
    // 仅在客户端运行
    if (typeof document === "undefined") return;

    // 移除所有可能的字体大小类
    document.documentElement.classList.remove(
      "text-small",
      "text-normal",
      "text-large"
    );

    // 添加当前字体大小类
    document.documentElement.classList.add(`text-${fontSize.value}`);
  };

  // 初始化字体大小
  const initFontSize = () => {
    if (typeof window === "undefined") return;

    // 检查用户是否已登录
    const user = auth.currentUser;
    if (user) {
      // 从数据库获取用户偏好
      const userRef = dbRef(db, `users/${user.uid}/advancedSettings`);

      // 清除之前的监听器
      if (unsubscribe) {
        unsubscribe();
      }

      // 设置新的监听器
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

    // 如果用户未登录，检查 localStorage 中保存的偏好
    const savedFontSize = localStorage.getItem("fontSize");
    if (savedFontSize) {
      fontSize.value = savedFontSize;
    }

    applyFontSize();
  };

  // 当字体大小变化时保存偏好
  watch(fontSize, (newValue) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("fontSize", newValue);
    }
    applyFontSize();
  });

  // 设置字体大小
  const setFontSize = (size) => {
    if (["small", "normal", "large"].includes(size)) {
      fontSize.value = size;
    }
  };

  // 清理函数
  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };

  // 在存储创建时初始化
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
