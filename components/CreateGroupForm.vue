<template>
  <!-- 弹窗背景 -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeModal"
  >
    <!-- 弹窗内容 -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative"
    >
      <!-- 关闭按钮 -->
      <button
        class="absolute top-6 right-6 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        @click="closeModal"
      >
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
            stroke-width="3"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- 表单内容 -->
      <h2 class="text-xl font-bold mb-4 dark:text-white">Create Group</h2>
      <form @submit.prevent="createGroup">
        <!-- Group Name -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1 dark:text-gray-300"
            >Group Name</label
          >
          <input
            v-model="name"
            type="text"
            placeholder="Enter group name"
            class="w-full p-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <!-- Group Description -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1 dark:text-gray-300"
            >Group Description (Optional)</label
          >
          <textarea
            v-model="description"
            placeholder="Enter group description"
            class="w-full p-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            rows="3"
          ></textarea>
        </div>

        <!-- Chat Type -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1 dark:text-gray-300"
            >Chat Type</label
          >
          <select
            v-model="chatType"
            class="w-full p-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <!-- Group Photo -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1 dark:text-gray-300"
            >Group Photo (Optional)</label
          >
          <input
            type="file"
            @change="handleFileUpload"
            accept="image/*"
            class="dark:text-gray-300"
          />
        </div>

        <!-- 消息区域 -->
        <div v-if="message" class="mb-4">
          <p
            class="text-sm p-2 rounded"
            :class="{
              'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300':
                message.type === 'success',
              'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300':
                message.type === 'error',
            }"
          >
            {{ message.text }}
          </p>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-600 dark:hover:bg-blue-700"
          :disabled="isLoading"
        >
          {{ isLoading ? "Creating..." : "Create Group" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { auth } from "~/firebase/firebase.js";

const isOpen = ref(false); // 控制弹窗显示
const name = ref("");
const description = ref(""); // 群组描述
const chatType = ref("public");
const photoFile = ref(null);
const isLoading = ref(false);
const message = ref(null); // 用于显示消息

// 打开弹窗
const openModal = () => {
  isOpen.value = true;
  resetForm(); // 打开弹窗时重置表单和消息
};

// 关闭弹窗
const closeModal = () => {
  isOpen.value = false;
  resetForm(); // 关闭弹窗时重置表单和消息
};

// 重置表单和消息
const resetForm = () => {
  name.value = "";
  description.value = "";
  chatType.value = "public";
  photoFile.value = null;
  message.value = null;
};

// 处理文件上传
const handleFileUpload = (event) => {
  photoFile.value = event.target.files[0];
};

// 创建群组
const createGroup = async () => {
  isLoading.value = true;
  message.value = null; // 清空之前的消息

  try {
    // 获取当前用户的 ID Token
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }
    const idToken = await user.getIdToken();

    const formData = new FormData();
    formData.append("name", name.value);
    formData.append("description", description.value); // 添加描述
    formData.append("chatType", chatType.value);
    if (photoFile.value) {
      formData.append("photoFile", photoFile.value);
    }

    // 调用 Cloud Functions API 端点
    const response = await $fetch("/api/createGroup", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    //await initializeGroupKey(response.groupId);
    const currentUser = auth.currentUser?.displayName || "Admin";
    const newGroupId = response.groupId;

    await writeActivityLog(
      newGroupId, // You'll need to get this after creation
      auth.currentUser?.uid,
      `${currentUser} created the group "${name.value}"`,
      response.joinedAt
    );

    // 显示成功消息
    message.value = {
      type: "success",
      text: `Group created with ID: ${response.groupId}`,
    };

    // 3 秒后关闭弹窗
    setTimeout(() => {
      closeModal();
    }, 3000);
  } catch (error) {
    console.error("Error creating group:", error);

    // 显示错误消息
    message.value = {
      type: "error",
      text: "Failed to create group. Please try again.",
    };
  } finally {
    isLoading.value = false;
  }
};

defineExpose({ openModal });
</script>
