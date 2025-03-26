import { auth } from "~/firebase/firebase.js";

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 天

const checkSessionExpiry = async () => {
  const loginTime = localStorage.getItem("loginTime");
  if (loginTime) {
    const currentTime = new Date();
    const loginTimeDate = new Date(loginTime);

    if (currentTime - loginTimeDate > SESSION_DURATION) {
      await auth.signOut(); // 强制用户登出
      localStorage.removeItem("loginTime");
      return true; // 返回 true 表示会话已过期
    }
  }
  return false; // 返回 false 表示会话未过期
};

router.beforeEach(async (to, from, next) => {
  const user = auth.currentUser;

  if (user) {
    // 检查 Token 是否过期
    const decodedToken = await user.getIdTokenResult();
    const expirationTime = new Date(decodedToken.expirationTime);

    if (new Date() > expirationTime) {
      await auth.signOut();
      localStorage.removeItem("loginTime");
      next("/login");
      return;
    }

    // 检查会话是否过期
    const loginTime = localStorage.getItem("loginTime");
    if (loginTime) {
      const currentTime = new Date();
      const loginTimeDate = new Date(loginTime);

      if (currentTime - loginTimeDate > SESSION_DURATION) {
        await auth.signOut();
        localStorage.removeItem("loginTime");
        next("/login");
        return;
      }
    }

    // 用户已登录且会话未过期
    next();
  } else {
    // 用户未登录
    if (to.meta.requiresAuth) {
      next("/login");
    } else {
      next();
    }
  }
});
