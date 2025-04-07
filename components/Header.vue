<template>
  <header
    class="flex justify-between items-center py-3 bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200"
  >
    <!-- Left: CloudTalk Logo + Text -->
    <div
      class="flex items-center space-x-2 mx-4 sm:mx-16 cursor-pointer"
      @click="navigateTo('/')"
    >
      <img
        v-if="!colorModeStore.isDark"
        src="/images/cloud_logo.png"
        alt="CloudTalk Logo"
        class="w-6 h-6 sm:w-8 sm:h-8"
      />
      <img
        v-else
        src="/images/cloud_logo_dark.png"
        alt="CloudTalk Logo"
        class="w-6 h-6 sm:w-8 sm:h-8"
      />
      <h1 class="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
        CloudTalk
      </h1>
    </div>

    <!-- Right: University Logo + Bell (Notifications) + User Avatar -->
    <div class="flex items-center space-x-2 sm:space-x-4 mr-4 sm:mr-16">
      <!-- Dark/Light Mode Toggle -->
      <button
        @click="toggleColorMode"
        class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Icon
          :icon="colorModeStore.isLight ? 'lucide:moon' : 'lucide:sun'"
          class="w-5 h-5 text-gray-600 dark:text-gray-300"
        />
      </button>

      <!-- University Logo (hidden on mobile) -->
      <img
        src="~/assets/university_logo.png"
        class="hidden sm:block h-8"
        alt="University Logo"
      />

      <!-- Bell Icon with Toggleable Notification Panel -->
      <div class="relative" ref="notificationRef">
        <button
          @click.stop="toggleNotifications"
          class="relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Icon
            icon="lucide:bell"
            class="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-300"
          />
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
          class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg z-50 max-h-96 overflow-y-auto"
        >
          <div
            class="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900"
          >
            <h3 class="font-medium dark:text-white">Notifications</h3>
            <button
              @click="markAllAsRead"
              class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              :disabled="notifications.length === 0 || !hasUnreadNotifications"
            >
              Mark all as read
            </button>
          </div>

          <p
            v-if="notifications.length === 0"
            class="text-gray-500 text-sm p-4 text-center"
          >
            No notifications yet
          </p>

          <ul v-else>
            <li
              v-for="notification in sortedNotifications"
              :key="notification.id"
              class="p-3 border-b hover:bg-gray-50 transition-colors"
              :class="{
                'bg-gray-50': !notification.readAt,
                'cursor-pointer': !notification.readAt,
              }"
              @click="markAsRead(notification.id)"
            >
              <div class="flex justify-between items-start">
                <div>
                  <div class="flex justify-between items-baseline">
                    <p class="font-medium text-sm">{{ notification.title }}</p>
                    <span class="text-xs text-gray-400 ml-2 whitespace-nowrap">
                      {{ formatNotificationTime(notification.timestamp) }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-600 mt-1">
                    {{ notification.body }}
                  </p>
                </div>
                <span
                  v-if="!notification.readAt"
                  class="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"
                ></span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- User Avatar with Online Status -->
      <div class="relative" ref="userMenuRef">
        <button
          @click.stop="toggleUserMenu"
          class="relative focus:outline-none flex items-center justify-center"
          @mouseenter="showUserName = true"
          @mouseleave="showUserName = false"
        >
          <div class="relative w-6 h-6 sm:w-8 sm:h-8">
            <img
              :src="avatarUrl || '/images/user_avatar.png'"
              class="w-full h-full rounded-full object-cover"
              alt="User Avatar"
            />
            <span
              class="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full"
            ></span>
          </div>
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
              @click="navigateToUserProfile"
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-md"
            >
              <Icon icon="lucide:user" class="w-4 h-4" />
              User Profile Setting
            </button>
            <button
              @click="openInvitation"
              class="relative w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-md"
            >
              <span
                v-if="pendingInvitations.length > 0"
                class="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full"
              ></span>
              <Icon icon="lucide:user-plus" class="w-4 h-4" />
              Pending Invitation
            </button>
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
    <PendingInvitationModal
      v-if="showPendingInvitation"
      :pendingInvitations="pendingInvitations"
      @close="closePendingInvitation"
      @approve="approvePendingInvitation"
      @reject="rejectPendingInvitation"
    />
  </header>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { auth, db } from "~/firebase/firebase.js";
import { getMessaging, getToken } from "firebase/messaging";
import {
  ref as dbRef,
  update,
  get,
  onValue,
  off,
  remove,
  set,
  getDatabase,
} from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
} from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { computed, ref, onMounted, onUnmounted } from "vue";
import { navigateTo } from "#app";
import { useColorModeStore } from "~/stores/colorMode";
import PendingInvitationModal from "~/components/PendingInvitationModal.vue";

// Refs for click outside detection
const notificationRef = ref(null);
const userMenuRef = ref(null);

// Notification state
const showNotifications = ref(false);
const notifications = ref([]);
const hasUnreadNotifications = computed(() =>
  notifications.value.some((n) => !n.readAt)
);

// User state
const avatarUrl = ref(null);
const userName = ref("");
const userEmail = ref("");
const showUserName = ref(false);
const showUserMenu = ref(false);
const showPendingInvitation = ref(false);

const pendingInvitations = ref([]);

// const fetchPendingInvitations = async () => {
//   const user = auth.currentUser;
//   if (!user) return;

//   const pendingInvitationsRef = dbRef(db, `users/${user.uid}/invitations`);
//   const snapshot = await get(pendingInvitationsRef);
//   if (snapshot.exists()) {
//     const invitations = snapshot.val();

//     const fetchGroupInfo = async (groupId) => {
//       const groupRef = dbRef(db, `chatrooms/${groupId}`);
//       const groupSnapshot = await get(groupRef);
//       const groupInfo = groupSnapshot.val();
//       return {
//         name: groupInfo.name,
//         description: groupInfo.description,
//         chatType: groupInfo.chatType,
//         photoUrl: groupInfo.photoUrl,
//       };
//     };

//     pendingInvitations.value = await Promise.all(
//       Object.keys(invitations).map(async (key) => ({
//         ...invitations[key],
//         id: key,
//         groupInfo: await fetchGroupInfo(invitations[key].groupId),
//       }))
//     );
//   }
// };

let unsubscribePendingInvitations = null;

const setupPendingInvitationsListener = () => {
  const user = auth.currentUser;
  if (!user) return;

  // First, unsubscribe any existing listener to avoid duplicates
  if (unsubscribePendingInvitations) {
    unsubscribePendingInvitations();
  }

  const pendingInvitationsRef = dbRef(db, `users/${user.uid}/invitations`);

  // Set up the onValue listener
  unsubscribePendingInvitations = onValue(
    pendingInvitationsRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        const invitations = snapshot.val();

        const fetchGroupInfo = async (groupId) => {
          const groupRef = dbRef(db, `chatrooms/${groupId}`);
          const groupSnapshot = await get(groupRef);
          const groupInfo = groupSnapshot.val();
          return {
            name: groupInfo.name,
            description: groupInfo.description,
            chatType: groupInfo.chatType,
            photoUrl: groupInfo.photoUrl,
          };
        };

        pendingInvitations.value = await Promise.all(
          Object.keys(invitations).map(async (key) => ({
            ...invitations[key],
            id: key,
            groupInfo: await fetchGroupInfo(invitations[key].groupId),
          }))
        );
      } else {
        pendingInvitations.value = [];
      }
    }
  );
};

const joinGroup = async (groupId) => {
  const user = auth.currentUser;
  if (!user) return;

  //isJoining.value = true;

  try {
    const joinedAt = Date.now();
    // 1. 添加用户到群组成员列表
    const memberRef = dbRef(
      db,
      `chatroom_users/${groupId}/${auth.currentUser.uid}`
    );
    await set(memberRef, {
      role: "user",
      joinedAt: joinedAt,
      isPinned: false,
      isMuted: false,
    });
    // 2. 将群组添加到用户的群组列表
    const userGroupRef = dbRef(
      db,
      `user_chatrooms/${auth.currentUser.uid}/${groupId}`
    );
    await set(userGroupRef, true);

    await writeActivityLog(
      groupId,
      auth.currentUser?.uid,
      `${await getUsername(auth.currentUser?.uid)} has joined the group"`,
      joinedAt + 1
    );
    //await updateGroupKey(props.group.id);

    // 可以在这里添加成功通知
  } catch (error) {
    console.error("Error joining group:", error);
    // 可以在这里添加错误通知
  }
};

const approvePendingInvitation = async (groupId, done) => {
  try {
    const user = auth.currentUser;
    if (!user) return;
    const userId = user.uid;
    const userRef = dbRef(db, `users/${userId}/invitations/${groupId}`);
    const groupPendingRef = dbRef(
      db,
      `chatrooms/${groupId}/pendingInvitations/${userId}`
    );

    await joinGroup(groupId);

    await remove(userRef);
    await remove(groupPendingRef);

    // Optionally add user to group members

    // Refresh list
  } catch (error) {
    console.error("Approve error:", error);
  } finally {
    done(); // Reset loading state
  }
};

const rejectPendingInvitation = async (groupId, done) => {
  try {
    const user = auth.currentUser;
    if (!user) return;
    const userId = user.uid;
    const userRef = dbRef(db, `users/${userId}/invitations/${groupId}`);
    const groupPendingRef = dbRef(
      db,
      `chatrooms/${groupId}/pendingInvitations/${userId}`
    );

    await remove(userRef);
    await remove(groupPendingRef);
  } catch (error) {
    console.error("Reject error:", error);
  } finally {
    done(); // Reset loading state
  }
};

const openInvitation = () => {
  showPendingInvitation.value = true;
};

const closePendingInvitation = () => {
  showPendingInvitation.value = false;
};

// Sorted notifications by timestamp (newest first)
const sortedNotifications = computed(() =>
  [...notifications.value].sort((a, b) => b.timestamp - a.timestamp)
);

// Format notification time
const formatNotificationTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  const date = new Date(timestamp);

  if (diff < 60 * 1000) return "Just now";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
  if (new Date(now).toDateString() === date.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (new Date(now - 86400000).toDateString() === date.toDateString()) {
    return "Yesterday";
  }
  if (diff < 7 * 86400000) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

// Load notifications from database
const loadNotifications = () => {
  const user = auth.currentUser;
  if (!user) return;

  const notificationsRef = dbRef(
    getDatabase(),
    `users/${user.uid}/notifications`
  );

  onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val();
    notifications.value = data
      ? Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
          timestamp:
            typeof data[key].timestamp === "object"
              ? Date.now()
              : data[key].timestamp,
          readAt:
            data[key].readAt === undefined
              ? null
              : typeof data[key].readAt === "object"
              ? Date.now()
              : data[key].readAt,
        }))
      : [];
  });
};

// Mark single notification as read
const markAsRead = async (notificationId) => {
  const user = auth.currentUser;
  if (!user) return;

  const updates = {};
  updates[`users/${user.uid}/notifications/${notificationId}/readAt`] =
    Date.now();

  try {
    await update(dbRef(getDatabase()), updates);
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

// Mark all notifications as read
const markAllAsRead = async () => {
  const user = auth.currentUser;
  if (!user || notifications.value.length === 0) return;

  const updates = {};
  notifications.value.forEach((notification) => {
    if (!notification.readAt) {
      updates[`users/${user.uid}/notifications/${notification.id}/readAt`] =
        Date.now();
    }
  });

  if (Object.keys(updates).length > 0) {
    try {
      await update(dbRef(getDatabase()), updates);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }
};

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

// Toggle notification panel
const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
  if (showUserMenu.value) showUserMenu.value = false;
};

// Toggle user menu
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
  if (showNotifications.value) showNotifications.value = false;
};

// Fetch user data
const fetchUserData = async () => {
  const user = auth.currentUser;
  if (!user) {
    avatarUrl.value = "/images/user_avatar.png";
    return;
  }

  userName.value = user.displayName || "Anonymous";
  userEmail.value = user.email || "";
  if (
    user.providerData.some(
      (provider) => provider.providerId === "google.com"
    ) ||
    user.photoURL.includes("googleusercontent.com")
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

// Handle logout
const handleLogout = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      const messaging = getMessaging();
      const fcmToken = await getToken(messaging);
      if (fcmToken) {
        const userRef = dbRef(db, `users/${user.uid}/fcmTokens`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const tokens = snapshot.val();
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

// Add this function to the script section
const navigateToUserProfile = () => {
  showUserMenu.value = false; // Close the menu
  navigateTo("/profile"); // Navigate to profile page
};

// Initialize
onMounted(() => {
  window.addEventListener("click", handleClickOutside);
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchUserData();
      loadNotifications();
      setupPendingInvitationsListener();
    } else {
      avatarUrl.value = "/images/user_avatar.png";
    }
  });
});

onUnmounted(() => {
  window.removeEventListener("click", handleClickOutside);
  const user = auth.currentUser;
  if (user) {
    if (unsubscribePendingInvitations) {
      unsubscribePendingInvitations();
    }
    const notificationsRef = dbRef(
      getDatabase(),
      `users/${user.uid}/notifications`
    );
    off(notificationsRef);
  }
});

const colorModeStore = useColorModeStore();

// Toggle dark/light mode
const toggleColorMode = () => {
  colorModeStore.toggleColorMode();
};
</script>
