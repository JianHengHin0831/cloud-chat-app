<template>
  <div class="h-screen flex flex-col">
    <SeoMeta :title="title" :description="description" no-index />
    <!-- Loading Screen -->
    <LoadingScreen
      v-if="isLoading"
      :progress="loadingProgress"
      :loading-text="loadingText"
    />
    <Header
      class="h-16 flex-shrink-0 border-b dark:border-gray-700 shadow-md px-6 flex items-center justify-between"
    />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar class="hidden md:flex w-1/12 h-full" />

      <div
        class="flex-1 flex flex-col p-2 sm:p-4 md:p-6 overflow-hidden bg-white dark:bg-gray-900"
      >
        <div
          class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4"
        >
          <SearchBar v-model="searchQuery" class="flex-1" />
          <button
            class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center justify-center whitespace-nowrap"
            @click="openCreateGroupModal"
          >
            + Create Group
          </button>
        </div>

        <div
          class="flex-1 overflow-auto pb-16 md:pb-0"
          v-if="filteredGroups.length > 0"
        >
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6"
          >
            <GroupCard
              v-for="group in filteredGroups"
              :key="group.id"
              :group="group"
            />
          </div>
        </div>
        <div v-else class="flex justify-center items-center h-full">
          <p class="text-gray-500 dark:text-gray-400">No public groups found</p>
        </div>
      </div>

      <MobileNavBar />
    </div>
  </div>
  <CreateGroupForm ref="createGroupModal" />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import SearchBar from "@/components/SearchBar.vue";
import GroupCard from "@/components/GroupCard.vue";
import CreateGroupForm from "~/components/CreateGroupForm.vue";
import LoadingScreen from "@/components/LoadingScreen.vue";
import { getCache, setCache } from "@/utils/client-cache";
import {
  ref as dbRef,
  get,
  onValue,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { db } from "~/firebase/firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "~/firebase/firebase.js";

//SEO Meta
import SeoMeta from "@/components/SEOMeta.vue";
const title = "Cloudtalk - Search Public Chat Room";
const description =
  "Search public chat room to meet new friends with same interest!";

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
});

const searchQuery = ref("");
const createGroupModal = ref(null);

const openCreateGroupModal = () => {
  createGroupModal.value.openModal();
};

const isLoading = ref(true);
const loadingProgress = ref(0);
const loadingText = ref("Loading public groups...");
const groups = ref([]);
const unsubscribeGroups = ref(null);

// get all public group information (real-time listener mode)
const setupPublicGroupsListener = async () => {
  try {
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    loadingProgress.value = 30;
    loadingText.value = "Connecting to database...";

    const chatroomsRef = dbRef(db, "chatrooms");
    const publicGroupsQuery = query(
      chatroomsRef,
      orderByChild("chatType"),
      equalTo("public")
    );

    loadingProgress.value = 50;
    loadingText.value = "Fetching groups data...";

    unsubscribeGroups.value = onValue(
      publicGroupsQuery,
      async (chatroomsSnapshot) => {
        if (!chatroomsSnapshot.exists()) {
          groups.value = [];
          isLoading.value = false;
          return;
        }

        loadingProgress.value = 70;
        loadingText.value = "Processing groups data...";

        const membersPromises = [];
        chatroomsSnapshot.forEach((childSnapshot) => {
          const chatroomId = childSnapshot.key;
          membersPromises.push(
            get(dbRef(db, `chatroom_users/${chatroomId}`)).then((snap) => ({
              id: chatroomId,
              count: snap.exists() ? Object.keys(snap.val()).length : 0,
            }))
          );
        });

        const membersData = await Promise.all(membersPromises);
        const membersMap = new Map(membersData.map((m) => [m.id, m.count]));

        const groupsData = [];
        chatroomsSnapshot.forEach((childSnapshot) => {
          const chatroomData = childSnapshot.val();
          if (chatroomData.isDisband) {
            return;
          }
          const groupId = childSnapshot.key;
          const photoUrl = chatroomData.photoUrl || "";

          groupsData.push({
            id: groupId,
            name: chatroomData.name || "Unnamed Group",
            members: membersMap.get(groupId) || 0,
            desc: chatroomData.description || "No description",
            groupUrl: photoUrl,
            lastActive: chatroomData.lastActive || 0,
          });
        });

        groups.value = groupsData.sort((a, b) => b.lastActive - a.lastActive);
        loadingProgress.value = 100;
        isLoading.value = false;
      },
      (error) => {
        console.error("Database error:", {
          code: error.code,
          message: error.message,
          user: auth.currentUser?.uid,
        });
        isLoading.value = false;
      }
    );
  } catch (error) {
    console.error("Setup error:", error);
    isLoading.value = false;
  }
};

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await setupPublicGroupsListener();
    }
  });
});

onUnmounted(() => {
  if (unsubscribeGroups.value) {
    unsubscribeGroups.value();
  }
});

const filteredGroups = computed(() => {
  return groups.value.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      group.desc.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      group.id === searchQuery.value
  );
});

import MobileNavBar from "@/components/MobileNavBar.vue";
</script>
