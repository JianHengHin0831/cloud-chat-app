<template>
  <NuxtLayout>
    <ClientOnly>
      <div
        class="min-h-screen transition-colors duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      >
        <div
          v-if="!isOnline"
          class="fixed top-0 left-0 right-0 z-50 p-4 text-center bg-red-500 text-white"
        >
          ⚠️ No network connection
        </div>
        <NuxtRouteAnnouncer />
        <NuxtPage />
      </div>
    </ClientOnly>
  </NuxtLayout>
</template>

<script setup>
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "~/firebase/firebase.js";
import { navigateTo } from "#app";
import { useColorModeStore } from "~/stores/colorMode";
import { useFontSizeStore } from "~/stores/fontSize";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { logEvent, trackMetric } from "~/utils/logging";

import {
  ref as dbRef,
  get,
  set,
  serverTimestamp,
  onValue,
  onDisconnect,
  update,
} from "firebase/database";

const colorModeStore = useColorModeStore();
const fontSizeStore = useFontSizeStore();

const router = useRouter();
const isFirebaseConnected = ref(true);

const updateUserStatus = async (state) => {
  if (!auth.currentUser?.uid) return;
  const userRef = dbRef(db, `users/${auth.currentUser.uid}`);
  const userSnapshot = await get(userRef);
  if (!userSnapshot.exists()) {
    navigateTo("/login");
    return;
  }

  const userStatusRef = dbRef(db, `users/${auth.currentUser.uid}/status`);
  const updates = {
    state,
    lastActive: serverTimestamp(),
  };

  set(userStatusRef, updates);
  onDisconnect(userStatusRef).set({
    state: "offline",
    lastActive: serverTimestamp(),
  });
};

const fetchUserGroups = async (uid) => {
  try {
    const userGroupsRef = dbRef(db, `user_chatrooms/${uid}`);
    const snapshot = await get(userGroupsRef);

    if (snapshot.exists()) {
      const chatroomIds = Object.keys(snapshot.val());
      return chatroomIds;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching user chatrooms:", error);
    throw error;
  }
};

onMounted(async () => {
  if (auth.currentUser && !localStorage.getItem("keysInitialized")) {
    const groups = await fetchUserGroups(auth.currentUser.uid);
  }
  colorModeStore.init();
  fontSizeStore.initFontSize();
});

const isOnline = ref(navigator?.onLine ?? true);

//Update network status
const updateNetworkStatus = () => {
  const wasOnline = isOnline.value;
  isOnline.value = navigator.onLine;

  if (wasOnline !== isOnline.value) {
    logEvent("network_status_change", {
      status: isOnline.value ? "online" : "offline",
      timestamp: new Date().toISOString(),
    });

    trackMetric("network_connectivity", isOnline.value ? 1 : 0, {
      status: isOnline.value ? "online" : "offline",
    });
  }
};

// Initialize network status monitoring
const initNetworkListener = () => {
  if (process.client) {
    isOnline.value = navigator.onLine;

    logEvent("network_status_initial", {
      status: isOnline.value ? "online" : "offline",
      timestamp: new Date().toISOString(),
    });

    trackMetric("network_connectivity", isOnline.value ? 1 : 0, {
      status: isOnline.value ? "online" : "offline",
    });

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    const checkOnlineStatus = dbRef(db, ".info/connected");
    onValue(checkOnlineStatus, (snap) => {
      const wasConnected = isOnline.value;
      isOnline.value = snap.val() === true;

      if (wasConnected !== isOnline.value) {
        logEvent("firebase_connection_change", {
          status: isOnline.value ? "connected" : "disconnected",
          timestamp: new Date().toISOString(),
        });

        trackMetric("firebase_connectivity", isOnline.value ? 1 : 0, {
          status: isOnline.value ? "connected" : "disconnected",
        });
      }
    });
  }
};

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      logEvent("user_login", {
        userId: user.uid,
        email: user.email,
        timestamp: new Date().toISOString(),
      });

      trackMetric("user_login_count", 1, {
        user_id: user.uid,
      });

      const userRef = dbRef(db, `users/${user.uid}`);
      const userSnapshot = await get(userRef);
      if (!userSnapshot.exists()) {
        navigateTo("/login");
        return;
      }
      colorModeStore.init();

      const decodedToken = await user.getIdTokenResult();
      const expirationTime = new Date(decodedToken.expirationTime);

      const groups = await fetchUserGroups(user.uid);

      trackMetric("user_group_count", groups.length, {
        user_id: user.uid,
      });

      updateUserStatus("online");

      logEvent("user_status_update", {
        userId: user.uid,
        status: "online",
        timestamp: new Date().toISOString(),
      });

      if (new Date() > expirationTime) {
        logEvent("token_expired", {
          userId: user.uid,
          timestamp: new Date().toISOString(),
        });

        await auth.signOut();
        localStorage.removeItem("loginTime");
        navigateTo("/login");
      }
    } else {
      logEvent("user_logout", {
        timestamp: new Date().toISOString(),
      });

      colorModeStore.cleanup();
      navigateTo("/login");
    }
  });
  initNetworkListener();
});

onBeforeUnmount(() => {
  if (process.client) {
    window.removeEventListener("online", updateNetworkStatus);
    window.removeEventListener("offline", updateNetworkStatus);
  }

  if (auth.currentUser?.uid) {
    updateUserStatus("offline");

    logEvent("user_status_update", {
      userId: auth.currentUser.uid,
      status: "offline",
      timestamp: new Date().toISOString(),
    });
  }
  if (colorModeStore.cleanup) {
    colorModeStore.cleanup();
  }
  fontSizeStore.cleanup();
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:root {
  font-size: 16px; /* 基础字体大小 */
}

/* 小字体 */
.text-small {
  font-size: 14px;
}

/* 正常字体 */
.text-normal {
  font-size: 16px;
}

/* 大字体 */
.text-large {
  font-size: 18px;
}

/* 使用相对单位确保所有元素都会相应调整 */
body {
  font-size: 1rem;
}

h1 {
  font-size: 1.75rem;
}

h2 {
  font-size: 1.5rem;
}

h3 {
  font-size: 1.25rem;
}

.text-xs {
  font-size: 0.75rem;
}

.text-sm {
  font-size: 0.875rem;
}

.text-base {
  font-size: 1rem;
}

.text-lg {
  font-size: 1.125rem;
}

.text-xl {
  font-size: 1.25rem;
}

.text-2xl {
  font-size: 1.5rem;
}
</style>
