<template>
  <div class="flex flex-col h-full">
    <!-- Header with Search and Add buttons -->
    <div
      class="flex items-center justify-between px-4 border-b dark:border-gray-700"
    >
      <h2 class="text-lg font-semibold">Groups</h2>
      <div class="flex space-x-4">
        <!-- Search Button -->
        <button @click="showSearchModal = true" class="p-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
        <!-- Add Button -->
        <button @click="showJoinModal = true" class="p-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Groups List -->
    <div class="flex-1 overflow-y-auto">
      <div
        v-for="group in sortedGroups"
        :key="group.id"
        @click="$emit('select', group.id)"
        class="flex items-center p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
      >
        <!-- Group Avatar -->
        <div class="relative">
          <img
            :src="group.photoUrl"
            :alt="group.name"
            class="w-12 h-12 rounded-full object-cover"
          />
          <!-- Status Icons -->
          <div class="absolute -top-1 -right-1 flex space-x-1">
            <!-- Pin Icon for Pinned Groups -->
            <div
              v-if="group.isPinned"
              class="bg-green-500 rounded-full p-1"
              title="Pinned Group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3 w-3 text-white"
                viewBox="0 0 32 32"
              >
                <path
                  d="m20.53125 2.5625-.6875.9375-4.90625 6.6875c-2.628906-.457031-5.410156.285156-7.4375 2.3125l-.71875.6875 5.3125 5.3125-8.09375 8.09375v1.40625h1.40625l8.09375-8.09375 5.3125 5.3125.6875-.71875c2.027344-2.027344 2.769531-4.808594 2.3125-7.4375l6.6875-4.90625.9375-.6875zm.25 3.0625 5.59375 5.59375-6.21875 4.5625-.5625.40625.1875.65625c.480469 1.832031-.042969 3.742188-1.1875 5.34375l-8.78125-8.78125c1.601563-1.144531 3.511719-1.667969 5.34375-1.1875l.65625.1875.40625-.5625z"
                />
              </svg>
            </div>
            <!-- Ban Icon for Inactive Groups -->
            <div
              v-if="group.isDisband"
              class="bg-red-500 rounded-full p-1"
              title="Inactive Group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3 w-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- Group Info -->
        <div class="ml-4 flex-1">
          <div class="flex items-center justify-between">
            <h3
              :class="['font-medium', group.isDisband ? 'text-gray-400' : '']"
            >
              {{ group.name }}
            </h3>
            <span
              v-if="groupLastReadCount[group.id] > 0"
              class="bg-green-500 text-white text-xs rounded-full px-2 py-1"
            >
              {{ groupLastReadCount[group.id] }}
            </span>
          </div>
          <p
            :class="[
              'text-sm mt-1',
              group.isDisband
                ? 'text-gray-400'
                : 'text-gray-500 dark:text-gray-400',
            ]"
          >
            {{ group.lastMessage }}
          </p>
        </div>
      </div>
    </div>

    <!-- Search Modal -->
    <div
      v-if="showSearchModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4">
        <div class="px-4 py-2 border-b dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Search Groups</h3>
            <button @click="showSearchModal = false" class="p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <div class="p-4">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search groups..."
            class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div class="max-h-96 overflow-y-auto">
          <div
            v-for="group in filteredGroups"
            :key="group.id"
            @click="handleGroupSelect(group.id)"
            class="p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
          >
            <div class="flex items-center">
              <img
                :src="group.photoUrl"
                :alt="group.name"
                class="w-10 h-10 rounded-full object-cover"
              />
              <div class="ml-4">
                <h4 class="font-medium">{{ group.name }}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ group.memberCount }} members
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Join Private Group Modal -->
    <div
      v-if="showJoinModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4">
        <div class="p-4 border-b dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Join Private Group</h3>
            <button @click="showJoinModal = false" class="p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <div class="p-4">
          <input
            type="text"
            v-model="joinCode"
            placeholder="Enter group code"
            class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
          <button
            @click="handleJoinGroup"
            class="w-full mt-4 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
          >
            Join Group
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import {
  ref as dbRef,
  get,
  query as rtdbQuery,
  orderByChild,
  startAt,
} from "firebase/database";
import { auth, db } from "~/firebase/firebase.js";
const props = defineProps({
  groups: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["select"]);

const showSearchModal = ref(false);
const showJoinModal = ref(false);
const searchQuery = ref("");
const joinCode = ref("");

// Sort groups by pinned, active, and inactive
const sortedGroups = computed(() => {
  return [...props.groups].sort((a, b) => {
    // Pinned groups first
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    // Then active groups
    if (a.isDisband !== b.isDisband) {
      return a.isDisband ? 1 : -1;
    }
    // Finally by last message time
    return (b.lastMessageTime || 0) - (a.lastMessageTime || 0);
  });
});

// Filter groups for search
const filteredGroups = computed(() => {
  if (!searchQuery.value) return [];
  const query = searchQuery.value.toLowerCase();
  return props.groups.filter((group) =>
    group.name.toLowerCase().includes(query)
  );
});

const handleGroupSelect = (groupId) => {
  emit("select", groupId);
  showSearchModal.value = false;
};

const handleJoinGroup = () => {
  // Implement join group logic here
  showJoinModal.value = false;
  joinCode.value = "";
};

const groupLastReadCount = ref({});
watch(
  () => props.groups,
  async () => {
    if (!auth.currentUser.uid) return;
    props.groups.forEach(async (group) => {
      const count = await getLastReadCount(group);
      groupLastReadCount.value = {
        ...groupLastReadCount.value,
        [group.id]: count,
      };
    });
  },
  { deep: true }
);

const getLastReadCount = async (group) => {
  if (!auth.currentUser.uid) return;
  try {
    const lastReadRef = dbRef(
      db,
      `chatroom_users/${group.id}/${auth.currentUser.uid}/lastRead`
    );
    const lastReadSnapshot = await get(lastReadRef);
    const lastRead = lastReadSnapshot.exists() ? lastReadSnapshot.val() : 0;

    const unreadQuery = rtdbQuery(
      dbRef(db, `chatrooms/${group.id}/messages`),
      orderByChild("createdAt"),
      startAt(lastRead + 1)
    );

    const unreadSnapshot = await get(unreadQuery);
    const lastReadCount = unreadSnapshot.exists()
      ? Object.keys(unreadSnapshot.val()).length
      : 0;
    return lastReadCount;
  } catch (error) {
    console.warn(`Error getting unread count for ${group.id}:`, error);
    return 0;
  }
};
</script>
