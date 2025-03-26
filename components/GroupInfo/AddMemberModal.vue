<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white rounded-lg p-6 w-96">
      <h2 class="text-xl font-semibold mb-4">Add Member</h2>

      <!-- 搜索栏 -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by ID, email, or username"
        class="w-full p-2 border rounded-lg mb-4"
      />

      <!-- 匹配的用户列表 -->
      <ul>
        <li
          v-for="user in filteredUsers"
          :key="user.id"
          class="flex items-center py-2 hover:bg-gray-100 cursor-pointer"
          @click="openConfirmModal(user)"
        >
          <img
            :src="user.avatarUrl"
            alt="avatar"
            class="w-10 h-10 rounded-full mr-3"
          />
          <div class="flex flex-col">
            <span class="font-semibold text-sm">{{ user.username }}</span>
            <span class="text-xs text-gray-500">{{ user.email }}</span>
          </div>
        </li>
      </ul>

      <!-- 待处理用户列表 -->
      <div v-if="pendingUsers.length > 0" class="mt-4">
        <h3 class="text-lg font-semibold mb-2">Pending Users</h3>
        <ul>
          <li
            v-for="pendingUser in pendingUsers"
            :key="pendingUser.id"
            class="flex items-center py-2 hover:bg-gray-100 cursor-pointer"
          >
            <img
              :src="pendingUser.avatarUrl"
              alt="avatar"
              class="w-10 h-10 rounded-full mr-3"
            />
            <div class="flex flex-col">
              <span class="font-semibold text-sm">{{
                pendingUser.username
              }}</span>
              <span class="text-xs text-gray-500">{{ pendingUser.email }}</span>
            </div>
            <button
              class="ml-auto text-green-500"
              @click="approvePendingUser(pendingUser.id)"
            >
              Approve
            </button>
            <button
              class="ml-2 text-red-500"
              @click="rejectPendingUser(pendingUser.id)"
            >
              Reject
            </button>
          </li>
        </ul>
      </div>

      <!-- 关闭按钮 -->
      <button
        @click="$emit('close')"
        class="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
      >
        Close
      </button>
    </div>
  </div>

  <!-- 确认弹窗 -->
  <ConfirmAddMemberModal
    v-if="selectedUser"
    :user="selectedUser"
    @confirm="handleConfirmAddMember"
    @close="closeConfirmModal"
  />
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "~/firebase/firebase.js";
import ConfirmAddMemberModal from "@/components/GroupInfo/ConfirmAddMemberModal.vue";

const props = defineProps({
  groupId: String, // 当前群组 ID
  pendingUsers: Array, // 待处理用户列表
});

const emit = defineEmits([
  "close",
  "add-member",
  "approve-pending-user",
  "reject-pending-user",
]);

const searchQuery = ref("");
const selectedUser = ref(null);
const users = ref([]); // 存储所有用户

// 获取所有用户
const fetchAllUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    users.value = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};

// 过滤用户
const filteredUsers = computed(() => {
  if (!searchQuery.value) return [];
  return users.value.filter((user) => {
    return (
      user.id === searchQuery.value ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  });
});

// 打开确认弹窗
const openConfirmModal = (user) => {
  selectedUser.value = user;
};

// 关闭确认弹窗
const closeConfirmModal = () => {
  selectedUser.value = null;
};

// 确认添加成员
const handleConfirmAddMember = async (user) => {
  emit("add-member", user.id); // 触发 add-member 事件
  closeConfirmModal();
};

// 同意待处理用户
const approvePendingUser = (userId) => {
  emit("approve-pending-user", userId);
};

// 拒绝待处理用户
const rejectPendingUser = (userId) => {
  emit("reject-pending-user", userId);
};

// 初始化时获取所有用户
fetchAllUsers();
</script>
