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
import { collection, query, where, getDocs } from "firebase/firestore";
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
    // 获取所有 chatType 为 public 的群组
    const chatroomsQuery = query(
      collection(db, "chatroom"),
      where("chatType", "==", "public")
    );
    const chatroomsSnapshot = await getDocs(chatroomsQuery);

    // 遍历群组，获取每个群组的成员数量
    const groupsData = [];
    for (const doc of chatroomsSnapshot.docs) {
      const chatroomData = doc.data();

      // 获取该群组的成员数量
      const chatroomUsersQuery = query(
        collection(db, "chatroom_user"),
        where("chatroomId", "==", doc.id)
      );
      const chatroomUsersSnapshot = await getDocs(chatroomUsersQuery);
      const membersCount = chatroomUsersSnapshot.size;

      // 构造群组信息
      groupsData.push({
        id: doc.id, // 群组 ID
        name: chatroomData.name, // 群组名称
        members: membersCount, // 成员数量
        desc: chatroomData.description || "No description", // 群组描述
        groupUrl: chatroomData.photoUrl || "", // 群组头像 URL
      });
    }

    // 更新 groups 数据
    groups.value = groupsData;
  } catch (error) {
    console.error("Error fetching public groups:", error);
  }
};

// 在组件挂载时获取数据
onMounted(() => {
  fetchPublicGroups();
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
