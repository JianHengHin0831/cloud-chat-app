<template>
  <div class="h-screen flex flex-col">
    <SeoMeta :title="title" :description="description" no-index />
    <!-- 头部导航栏（固定） -->
    <Header
      class="h-16 flex-shrink-0 border-b shadow-md px-6 flex items-center justify-between"
    />

    <div class="flex flex-1 overflow-hidden">
      <!-- 侧边栏（固定） -->
      <Sidebar class="w-1/12 h-full" />

      <!-- 主内容区 -->
      <div class="flex-1 flex flex-col p-6 overflow-hidden bg-gray-100">
        <!-- 搜索栏 & 按钮 -->
        <div class="flex items-center justify-between mb-4">
          <SearchBar v-model="searchQuery" class="flex-1 mr-4" />
          <button
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            @click="openCreateGroupModal"
          >
            + Create Group
          </button>
        </div>

        <!-- 群组列表（可滚动） -->
        <div class="flex-1 overflow-auto">
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4"
          >
            <GroupCard
              v-for="group in filteredGroups"
              :key="group.id"
              :group="group"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  <CreateGroupForm ref="createGroupModal" />
</template>

<script setup>
import { ref, computed } from "vue";
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import SearchBar from "@/components/SearchBar.vue";
import GroupCard from "@/components/GroupCard.vue";
import CreateGroupForm from "~/components/CreateGroupForm.vue";
import {
  ref as dbRef,
  get,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { db } from "~/firebase/firebase.js";

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
const groups = ref([]);

// 获取所有 public 群组信息
const fetchPublicGroups = async () => {
  try {
    // 1. 确保认证完成
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    // 2. 构造查询
    const chatroomsRef = dbRef(db, "chatrooms");
    const publicGroupsQuery = query(
      chatroomsRef,
      orderByChild("chatType"),
      equalTo("public")
    );

    // 3. 执行查询
    const chatroomsSnapshot = await get(publicGroupsQuery);

    if (!chatroomsSnapshot.exists()) {
      return [];
    }

    // 4. 获取成员数据（优化查询）
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

    // 5. 处理数据
    const groupsData = [];
    chatroomsSnapshot.forEach((childSnapshot) => {
      const chatroomData = childSnapshot.val();
      groupsData.push({
        id: childSnapshot.key,
        name: chatroomData.name || "Unnamed Group",
        members: membersMap.get(childSnapshot.key) || 0,
        desc: chatroomData.description || "No description",
        groupUrl: chatroomData.photoUrl || "",
        lastActive: chatroomData.lastActive || 0,
      });
    });

    // 6. 排序并返回
    groups.value = groupsData.sort((a, b) => b.lastActive - a.lastActive);
  } catch (error) {
    console.error("Database error:", {
      code: error.code,
      message: error.message,
      user: auth.currentUser?.uid,
    });
    throw error; // 或者返回空数组 return [];
  }
};

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "~/firebase/firebase.js";

// 在组件挂载时获取数据
onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      fetchPublicGroups();
    }
  });
});

const filteredGroups = computed(() => {
  return groups.value.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      group.desc.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      group.id === searchQuery.value
  );
});
</script>
