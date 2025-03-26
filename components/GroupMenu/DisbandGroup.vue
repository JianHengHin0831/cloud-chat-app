<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white rounded-lg p-6 w-96">
      <h2 class="text-xl font-semibold mb-4">Disband Group</h2>
      <p class="text-sm text-gray-700 mb-6">
        Are you sure you want to disband this group?
      </p>

      <!-- 提示消息 -->
      <p v-if="showSuccessMessage" class="mb-4 text-sm text-green-500">
        Group disbanded successfully!
      </p>
      <p v-if="showErrorMessage" class="mb-4 text-sm text-red-500">
        Failed to disband group. Please try again.
      </p>

      <div class="flex justify-end space-x-4">
        <button
          @click="$emit('close')"
          class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          @click="disbandGroup"
          class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Disband
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "~/firebase/firebase.js";

// 定义 props 和 emit
const props = defineProps({
  groupId: String,
});
const emit = defineEmits(["close"]); // 定义 emit 事件

// 提示消息状态
const showSuccessMessage = ref(false);
const showErrorMessage = ref(false);

const disbandGroup = async () => {
  try {
    // 更新群组状态为解散
    await updateDoc(doc(db, "chatroom", props.groupId), {
      isDisband: true,
    });

    // 显示成功提示
    showSuccessMessage.value = true;
    showErrorMessage.value = false;

    // 1 秒后关闭弹窗
    setTimeout(() => {
      emit("close"); // 触发 close 事件
    }, 1000);
  } catch (error) {
    console.error("Error disbanding group:", error);

    // 显示错误提示
    showErrorMessage.value = true;
    showSuccessMessage.value = false;

    // 3 秒后隐藏错误提示
    setTimeout(() => {
      showErrorMessage.value = false;
    }, 3000);
  }
};
</script>
