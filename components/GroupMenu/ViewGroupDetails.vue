<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white rounded-lg p-6 w-96">
      <h2 class="text-xl font-semibold mb-4">Group Details</h2>
      <div class="space-y-4">
        <!-- Group ID -->
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Group ID</label
          >
          <div class="flex items-center">
            <p class="mt-1 text-sm text-gray-900">{{ groupData.id }}</p>
            <button
              @click="copyGroupId"
              class="ml-2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
            </button>
          </div>
          <!-- 提示消息 -->
          <p v-if="showCopySuccess" class="mt-1 text-sm text-green-500">
            Group ID copied to clipboard!
          </p>
          <p v-if="showCopyError" class="mt-1 text-sm text-red-500">
            Failed to copy Group ID.
          </p>
        </div>

        <!-- Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Name</label>
          <p class="mt-1 text-sm text-gray-900">{{ groupData.name }}</p>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Description</label
          >
          <p class="mt-1 text-sm text-gray-900">{{ groupData.description }}</p>
        </div>

        <!-- Chat Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Chat Type</label
          >
          <p class="mt-1 text-sm text-gray-900">{{ groupData.chatType }}</p>
        </div>
      </div>
      <button
        @click="$emit('close')"
        class="mt-6 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
      >
        Close
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

// 定义 props
const props = defineProps({
  groupData: Object,
});

// 提示消息状态
const showCopySuccess = ref(false);
const showCopyError = ref(false);

// 复制 Group ID 的函数
const copyGroupId = async () => {
  try {
    // 使用 Clipboard API 复制文本
    await navigator.clipboard.writeText(props.groupData.id);

    // 显示成功提示
    showCopySuccess.value = true;
    showCopyError.value = false;

    // 3 秒后隐藏提示
    setTimeout(() => {
      showCopySuccess.value = false;
    }, 3000);
  } catch (error) {
    console.error("Failed to copy Group ID:", error);

    // 显示错误提示
    showCopyError.value = true;
    showCopySuccess.value = false;

    // 3 秒后隐藏提示
    setTimeout(() => {
      showCopyError.value = false;
    }, 3000);
  }
};
</script>
