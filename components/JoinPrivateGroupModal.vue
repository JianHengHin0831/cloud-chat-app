<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
  >
    <div class="bg-white p-6 rounded-lg w-96 shadow-lg">
      <h2 class="text-xl font-semibold mb-4">Join Private Group</h2>

      <!-- 输入群组 ID -->
      <input
        type="text"
        v-model="groupID"
        placeholder="Enter Group ID"
        class="w-full p-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <!-- 显示群组信息 -->
      <div v-if="groupInfo" class="bg-blue-50 p-4 rounded-lg shadow-md mb-4">
        <div class="flex items-center space-x-4">
          <!-- 群组图片 -->
          <img
            :src="groupInfo.photoUrl || 'https://via.placeholder.com/150'"
            alt="Group Image"
            class="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 class="text-lg font-semibold">{{ groupInfo.name }}</h3>
            <p class="text-sm text-gray-600">{{ groupInfo.description }}</p>
          </div>
        </div>
        <div class="mt-4 space-y-2">
          <p class="text-sm text-gray-500">
            <span class="font-medium">Members:</span>
            {{ groupInfo.memberCount }}
          </p>
          <p class="text-sm text-gray-500">
            <span class="font-medium">Created At:</span>
            {{ formatDate(groupInfo.createdAt) }}
          </p>
          <p class="text-sm text-gray-500">
            <span class="font-medium">Admin:</span> {{ groupInfo.adminName }}
          </p>
          <!-- 显示是否已加入 -->
          <p v-if="groupInfo.isJoined" class="text-sm text-green-600">
            ✅ Already Joined
          </p>
        </div>
      </div>

      <!-- 显示错误信息 -->
      <div v-if="error" class="bg-red-50 p-4 rounded-lg shadow-md mb-4">
        <p class="text-sm text-red-600">{{ error }}</p>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end space-x-2">
        <button
          @click="closeModal"
          class="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          v-if="!groupInfo?.isJoined"
          @click="handleJoin"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="!groupInfo"
        >
          Request to Join
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref as dbRef,
  get,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { auth, db } from "~/firebase/firebase.js";

const groupID = ref(""); // 用户输入的群组 ID
const groupInfo = ref(null); // 群组信息
const error = ref(""); // 错误信息

// 监听 groupID 的变化
watch(groupID, async (newValue) => {
  if (newValue && typeof newValue === "string") {
    try {
      // 查询群组信息
      const groupRef = dbRef(db, `chatroom/${newValue}`);
      const groupSnapshot = await get(groupRef);
      if (groupSnapshot.exists()) {
        const data = groupSnapshot.val();

        // 获取管理员信息
        const chatroomUsersRef = dbRef(db, "chatroom_user");
        const adminQuery = query(
          chatroomUsersRef,
          orderByChild("chatroomId"),
          equalTo(newValue)
        );
        const adminSnapshot = await get(adminQuery);

        let adminName = "Unknown"; // 默认值
        if (adminSnapshot.exists()) {
          const adminData = Object.values(adminSnapshot.val()).find(
            (user) => user.role === "admin"
          );
          if (adminData) {
            const adminUserRef = dbRef(db, `users/${adminData.userId}`);
            const adminUserSnapshot = await get(adminUserRef);
            if (adminUserSnapshot.exists()) {
              adminName = adminUserSnapshot.val().username;
            }
          }
        }

        // 获取群组成员数量
        const membersQuery = query(
          chatroomUsersRef,
          orderByChild("chatroomId"),
          equalTo(newValue)
        );
        const membersSnapshot = await get(membersQuery);
        const memberCount = membersSnapshot.exists()
          ? Object.keys(membersSnapshot.val()).length
          : 0;

        // 检查当前用户是否已经加入群组
        const user = auth.currentUser;
        let isJoined = false;
        if (user) {
          const userQuery = query(
            chatroomUsersRef,
            orderByChild("userId"),
            equalTo(user.uid)
          );
          const userSnapshot = await get(userQuery);
          isJoined =
            userSnapshot.exists() &&
            Object.values(userSnapshot.val()).some(
              (member) => member.chatroomId === newValue
            );
        }

        // 更新群组信息
        groupInfo.value = {
          name: data.name,
          description: data.description,
          photoUrl: data.photoUrl, // 群组图片
          memberCount,
          createdAt: data.createdAt,
          adminName,
          isJoined, // 是否已加入
        };
        error.value = "";
      } else {
        groupInfo.value = null;
        error.value = "Group not found.";
      }
    } catch (err) {
      console.error("Error fetching group info:", err);
      error.value = "Failed to fetch group info.";
    }
  } else {
    groupInfo.value = null;
    error.value = "";
  }
});

// 格式化日期
const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

// 处理加入群组的请求
const handleJoin = () => {
  if (groupInfo.value) {
    alert("Request sent to join the group.");
    closeModal();
  }
};

// 关闭弹窗
const emit = defineEmits(["close"]);
const closeModal = () => {
  emit("close");
};
</script>
