import { useColorModeStore } from "~/stores/colorMode";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "~/firebase/firebase.js";

export default defineNuxtPlugin((nuxtApp) => {
  // Only run on client-side
  if (process.server) return;

  const colorModeStore = useColorModeStore();
  let authUnsubscribe = null;

  // Initialize color mode when auth state changes
  authUnsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      colorModeStore.initColorMode();
    } else {
      colorModeStore.cleanup();
      // Default to light mode when not logged in
      document.documentElement.classList.remove("dark");
    }
  });

  // Use Nuxt's hook for cleanup
  nuxtApp.hook("app:beforeMount", () => {
    // Initialize on mount
    colorModeStore.initColorMode();
  });

  nuxtApp.hook("app:unmount", () => {
    // Clean up on unmount
    colorModeStore.cleanup();
    if (authUnsubscribe) {
      authUnsubscribe();
    }
  });

  return {
    provide: {
      colorMode: colorModeStore,
    },
  };
});
