import { auth } from "~/firebase/firebase.js";

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

const checkSessionExpiry = async () => {
  const loginTime = localStorage.getItem("loginTime");
  if (loginTime) {
    const currentTime = new Date();
    const loginTimeDate = new Date(loginTime);

    if (currentTime - loginTimeDate > SESSION_DURATION) {
      await auth.signOut();
      localStorage.removeItem("loginTime");
      return true;
    }
  }
  return false;
};

router.beforeEach(async (to, from, next) => {
  const user = auth.currentUser;

  if (user) {
    const decodedToken = await user.getIdTokenResult();
    const expirationTime = new Date(decodedToken.expirationTime);

    if (new Date() > expirationTime) {
      await auth.signOut();
      localStorage.removeItem("loginTime");
      next("/login");
      return;
    }

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

    next();
  } else {
    if (to.meta.requiresAuth) {
      next("/login");
    } else {
      next();
    }
  }
});
