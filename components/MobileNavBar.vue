<template>
  <nav
    class="md:hidden z-50 fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t-4 rounded-lg border-gray-200"
  >
    <div class="flex justify-around items-center h-16">
      <button
        @click="navigateTo('/')"
        class="flex flex-col items-center gap-1 relative"
        :class="
          isActivePage('/')
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-600 dark:text-gray-300'
        "
      >
        <div class="relative w-full">
          <div
            class="absolute inset-0 -mx-4 -my-2 rounded-full"
            :class="
              isActivePage('/') ? 'bg-green-300 dark:bg-green-200/50' : ''
            "
          ></div>
          <div class="relative flex flex-col items-center gap-1">
            <Icon icon="lucide:message-circle" class="w-6 h-6" />
            <div
              v-if="hasUnreadMessages"
              class="absolute -top-1 -right-1 w-3 h-3 rounded-full"
              :class="colorModeStore.isLight ? 'bg-green-500' : 'bg-green-400'"
            ></div>
            <span class="text-xs">Chat</span>
          </div>
        </div>
      </button>

      <button
        @click="navigateTo('/search')"
        class="flex flex-col items-center gap-1"
        :class="
          isActivePage('/search')
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-600 dark:text-gray-300'
        "
      >
        <div class="relative w-full">
          <div
            class="absolute inset-0 -mx-4 -my-2 rounded-full"
            :class="
              isActivePage('/search') ? 'bg-green-300 dark:bg-green-200/50' : ''
            "
          ></div>
          <div class="relative flex flex-col items-center gap-1">
            <Icon icon="lucide:search" class="w-6 h-6" />
            <span class="text-xs">Search</span>
          </div>
        </div>
      </button>

      <button
        @click="navigateTo('/profile')"
        class="flex flex-col items-center gap-1"
        :class="
          isActivePage('/profile')
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-600 dark:text-gray-300'
        "
      >
        <div class="relative w-full">
          <div
            class="absolute inset-0 -mx-5 -my-2 rounded-full"
            :class="
              isActivePage('/profile')
                ? 'bg-green-300 dark:bg-green-200/50'
                : ''
            "
          ></div>
          <div class="relative flex flex-col items-center gap-1">
            <Icon icon="lucide:user" class="w-6 h-6" />
            <span class="text-xs">Profile</span>
          </div>
        </div>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useColorModeStore } from "~/stores/colorMode.js";
import { auth, db } from "~/firebase/firebase.js";
import { useRoute } from "vue-router";
import { ref as dbRef, onValue } from "firebase/database";

const router = useRouter();
const colorModeStore = useColorModeStore();
const notifications = ref([]);
const hasUnreadMessages = computed(() =>
  notifications.value.some((n) => !n.readAt)
);

let unsubscribeNotifications = null;

const route = useRoute();
const isActivePage = (path) => route.path === path;

onMounted(() => {
  const user = auth.currentUser;
  if (!user) return;

  // Subscribe to notifications
  const notificationsRef = dbRef(db, `users/${user.uid}/notifications`);
  unsubscribeNotifications = onValue(notificationsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      notifications.value = Object.values(data || {});
    } else {
      notifications.value = [];
    }
  });
});

onUnmounted(() => {
  if (unsubscribeNotifications) {
    unsubscribeNotifications();
  }
});

const navigateTo = (path) => {
  router.push(path);
};
</script>
