<template>
  <header class="flex justify-between items-center px-6 py-3 mx-4 bg-white">
    <!-- Left: CloudTalk Logo + Text -->
    <div class="flex items-center space-x-2 mx-16">
      <img src="~/assets/cloud_logo.png" alt="CloudTalk Logo" class="w-8 h-8" />
      <h1 class="text-xl font-bold text-gray-800">CloudTalk</h1>
    </div>

    <!-- Right: University Logo + Bell (Notifications) + User Avatar -->
    <div class="flex items-center space-x-4 mr-16">
      <img
        src="~/assets/university_logo.png"
        class="h-8"
        alt="University Logo"
      />

      <!-- Bell Icon with Toggleable Notification Panel -->
      <div class="relative" ref="notificationRef">
        <button
          @click.stop="toggleNotifications"
          class="relative p-2 rounded-md hover:bg-gray-100"
        >
          <Icon icon="lucide:bell" class="w-6 h-6 text-gray-600" />
          <!-- Unread Notification Indicator -->
          <span
            v-if="hasUnreadNotifications"
            class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
          >
          </span>
        </button>

        <!-- Notification Panel -->
        <div
          v-show="showNotifications"
          class="absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-lg rounded-lg p-3 z-50"
        >
          <p v-if="notifications.length === 0" class="text-gray-500 text-sm">
            No new notifications
          </p>
          <ul v-else>
            <li
              v-for="(notification, index) in notifications"
              :key="index"
              class="p-2 border-b last:border-none hover:bg-gray-100 text-sm"
            >
              {{ notification }}
            </li>
          </ul>
        </div>
      </div>

      <!-- User Avatar with Online Status -->
      <div class="relative" ref="userMenuRef">
        <button
          @click.stop="toggleUserMenu"
          class="relative focus:outline-none"
          @mouseenter="showUserName = true"
          @mouseleave="showUserName = false"
        >
          <img
            :src="avatarUrl || '/images/user_avatar.png'"
            class="w-8 h-8 rounded-full"
            alt="User Avatar"
          />
          <span
            class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
          ></span>
        </button>

        <!-- User Menu Dropdown -->
        <div
          v-show="showUserMenu"
          class="absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden z-50"
        >
          <!-- User Info Section -->
          <div class="p-4 border-b border-gray-200 bg-gray-50">
            <p class="font-medium text-gray-900">{{ userName }}</p>
            <p class="text-sm text-gray-500">{{ userEmail }}</p>
          </div>

          <!-- Menu Items -->
          <div class="p-2">
            <button
              @click="handleLogout"
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-md"
            >
              <Icon icon="lucide:log-out" class="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { auth, db } from "~/firebase/firebase.js";
import { getMessaging, getToken } from "firebase/messaging";
import { ref as dbRef, update, get } from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
} from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

// Refs for click outside detection
const notificationRef = ref(null);
const userMenuRef = ref(null);

// Handle click outside
const handleClickOutside = (event) => {
  if (
    showNotifications.value &&
    notificationRef.value &&
    !notificationRef.value.contains(event.target)
  ) {
    showNotifications.value = false;
  }

  if (
    showUserMenu.value &&
    userMenuRef.value &&
    !userMenuRef.value.contains(event.target)
  ) {
    showUserMenu.value = false;
  }
};

// Add and remove event listeners
onMounted(() => {
  window.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("click", handleClickOutside);
});

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchUserData(); // 用户已登录，获取头像
    } else {
      avatarUrl.value = "/images/user_avatar.png"; // 用户未登录，使用默认头像
    }
  });
});

// Notification state
const showNotifications = ref(false);
const notifications = ref(["New message from John", "Meeting at 3 PM"]);
const hasUnreadNotifications = ref(notifications.value.length > 0);

// User state
const avatarUrl = ref(null);
const userName = ref("");
const showUserName = ref(false);

// Toggle notification panel
const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
  if (showUserMenu.value) showUserMenu.value = false;
};

// Fetch user data from Firebase Auth
import { navigateTo } from "#app"; // 导入 navigateTo

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchUserData(); // 用户已登录，获取头像
    } else {
      avatarUrl.value = "/images/user_avatar.png"; // 用户未登录，使用默认头像
    }
  });
});

// User menu state
const showUserMenu = ref(false);
const userEmail = ref("");

// Toggle user menu
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
  if (showNotifications.value) showNotifications.value = false;
};

// Handle logout
const handleLogout = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      const messaging = getMessaging();
      const fcmToken = await getToken(messaging);
      if (fcmToken) {
        // 获取当前用户的FCM tokens
        const userRef = dbRef(db, `users/${user.uid}/fcmTokens`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const tokens = snapshot.val();
          // 移除指定的token
          if (tokens && tokens[fcmToken]) {
            const updates = {};
            updates[`users/${user.uid}/fcmTokens/${fcmToken}`] = null;
            await update(dbRef(db), updates);
          }
        }
      }
    }
    await auth.signOut();
    showUserMenu.value = false;
    navigateTo("/login");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

// Update fetchUserData to include email
const fetchUserData = async () => {
  const user = auth.currentUser;
  if (!user) {
    return;
  }

  userName.value = user.displayName || "Anonymous";
  userEmail.value = user.email || "";

  if (
    user.providerData.some((provider) => provider.providerId === "google.com")
  ) {
    avatarUrl.value = user.photoURL;
  } else {
    const storage = getStorage();
    const avatarRef = storageRef(storage, `avatars/${user.uid}`);
    try {
      const url = await getDownloadURL(avatarRef);
      avatarUrl.value = url;
    } catch (error) {
      console.error("Failed to fetch avatar from Storage:", error);
      avatarUrl.value = "/images/user_avatar.png";
    }
  }
};

// Fetch user data when component mounts
onMounted(() => {
  fetchUserData();
});
</script>
