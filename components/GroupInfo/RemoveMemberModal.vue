<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white rounded-lg p-6 w-96">
      <h2 class="text-xl font-semibold mb-4">Remove Member</h2>
      <p class="text-sm text-gray-700 mb-6">
        Are you sure you want to remove
        <span class="font-semibold">{{ member.username }}</span> from the group?
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
          @click="confirmRemove"
          class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Remove
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  member: Object, // 成员信息
});

const emit = defineEmits(["close", "confirm"]);

const confirmRemove = () => {
  emit("confirm"); // 触发确认移除事件
  emit("close"); // 关闭弹窗
};
</script>
