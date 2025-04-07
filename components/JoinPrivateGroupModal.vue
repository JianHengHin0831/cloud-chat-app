<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg w-96 shadow-lg">
      <h2 class="text-xl font-semibold mb-4 dark:text-white">
        Join Private Group
      </h2>

      <!-- 输入群组 ID -->
      <input
        type="text"
        v-model="groupID"
        placeholder="Enter Group ID"
        class="w-full p-2 border dark:border-gray-600 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
      />

      <!-- 显示群组信息 -->
      <div
        v-if="groupInfo"
        class="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg shadow-md mb-4"
      >
        <div class="flex items-center space-x-4">
          <img
            :src="groupInfo.photoUrl || 'https://via.placeholder.com/150'"
            alt="Group Image"
            class="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 class="text-lg font-semibold dark:text-white">
              {{ groupInfo.name }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              {{ groupInfo.description }}
            </p>
          </div>
        </div>
        <div class="mt-4 space-y-2">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            <span class="font-medium dark:text-gray-300">Members:</span>
            {{ groupInfo.memberCount }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            <span class="font-medium dark:text-gray-300">Created At:</span>
            {{ formatDate(groupInfo.createdAt) }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            <span class="font-medium dark:text-gray-300">Admin:</span>
            {{ groupInfo.adminName }}
          </p>
          <p v-if="groupInfo.isJoined" class="text-sm text-green-600">
            ✅ Already Joined
          </p>
          <p v-else-if="groupInfo.isPending" class="text-sm text-yellow-600">
            ⌛ Request Pending
          </p>
        </div>
      </div>

      <!-- 成功信息 -->
      <div
        v-if="successMessage"
        class="bg-green-50 dark:bg-green-900 p-4 rounded-lg shadow-md mb-4"
      >
        <p class="text-sm text-green-700 dark:text-green-300">
          {{ successMessage }}
        </p>
      </div>

      <!-- 错误信息 -->
      <div
        v-if="error"
        class="bg-red-50 dark:bg-red-900 p-4 rounded-lg shadow-md mb-4"
      >
        <p class="text-sm text-red-600 dark:text-red-300">{{ error }}</p>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end space-x-2">
        <button
          @click="closeModal"
          class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          v-if="groupInfo && !groupInfo.isJoined && !groupInfo.isPending"
          @click="handleJoin"
          class="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Requesting...</span>
          <span v-else>Request to Join</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref as dbRef, get, set } from "firebase/database";
import { auth, db } from "~/firebase/firebase.js";

const groupID = ref("");
const groupInfo = ref(null);
const error = ref("");
const successMessage = ref("");
const isLoading = ref(false);

watch(groupID, async (newValue) => {
  groupInfo.value = null;
  error.value = "";
  successMessage.value = "";

  if (!newValue || typeof newValue !== "string") return;

  try {
    const groupRef = dbRef(db, `chatrooms/${newValue}`);
    const groupSnapshot = await get(groupRef);

    if (!groupSnapshot.exists()) {
      error.value = "Group not found.";
      return;
    }

    const data = groupSnapshot.val();
    const chatroomUsersRef = dbRef(db, `chatroom_users/${newValue}`);
    const chatroomUsersSnapshot = await get(chatroomUsersRef);

    let adminName = "Unknown";
    if (chatroomUsersSnapshot.exists()) {
      const adminEntry = Object.entries(chatroomUsersSnapshot.val()).find(
        ([_, user]) => user.role === "admin"
      );
      const adminId = adminEntry ? adminEntry[0] : null;
      if (adminId) {
        adminName = await getUsername(adminId);
      }
    }

    const memberCount = chatroomUsersSnapshot.exists()
      ? Object.keys(chatroomUsersSnapshot.val()).length
      : 0;

    const user = auth.currentUser;
    let isJoined = false;
    let isPending = false;

    if (user) {
      const userId = user.uid;

      // 判断是否加入
      isJoined =
        chatroomUsersSnapshot.exists() &&
        Object.keys(chatroomUsersSnapshot.val()).includes(userId);

      // 判断是否在申请中
      const pendingRef = dbRef(db, `chatrooms/${newValue}/pending/${userId}`);
      const pendingSnap = await get(pendingRef);
      isPending = pendingSnap.exists();
    }

    groupInfo.value = {
      name: data.name,
      description: data.description,
      photoUrl: data.photoUrl,
      memberCount,
      createdAt: data.createdAt,
      adminName,
      isJoined,
      isPending,
    };
  } catch (err) {
    console.error("Error fetching group info:", err);
    error.value = "Failed to fetch group info.";
  }
});

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

const handleJoin = async () => {
  if (!groupID.value || !auth.currentUser) return;

  const userId = auth.currentUser.uid;
  const groupId = groupID.value;

  isLoading.value = true;
  error.value = "";
  successMessage.value = "";

  try {
    const pendingRef = dbRef(db, `chatrooms/${groupId}/pending/${userId}`);
    await set(pendingRef, Date.now());

    successMessage.value = "✅ Join request sent successfully!";
    groupInfo.value.isPending = true;
  } catch (err) {
    console.error("Error sending join request:", err);
    error.value = "Failed to send join request.";
  } finally {
    isLoading.value = false;
  }
};

// 假设你有这个函数
const getUsername = async (userId) => {
  const userRef = dbRef(db, `users/${userId}/username`);
  const userSnap = await get(userRef);
  return userSnap.exists() ? userSnap.val() : "Unknown";
};

const emit = defineEmits(["close"]);
const closeModal = () => {
  emit("close");
};
</script>
