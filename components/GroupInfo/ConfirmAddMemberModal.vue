<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white rounded-lg p-6 w-96">
      <h2 class="text-xl font-semibold mb-4">Confirm Add Member</h2>
      <p class="text-sm text-gray-700 mb-6">
        Are you sure you want to add
        <span class="font-semibold">{{ user.username }}</span> to the group?
      </p>

      <!-- 操作按钮 -->
      <div class="flex justify-end space-x-4">
        <button
          @click="$emit('close')"
          class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          @click="$emit('confirm', user)"
          class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  user: Object, // 用户信息
});
</script>
