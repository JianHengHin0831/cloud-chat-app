<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white rounded-lg p-6 w-96">
      <h2 class="text-xl font-semibold mb-4">Update Group Details</h2>
      <form @submit.prevent="updateGroup">
        <div class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Name</label>
            <input
              v-model="form.name"
              type="text"
              class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Description</label
            >
            <input
              v-model="form.description"
              type="text"
              class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm"
            />
            <!-- 提示消息 -->
            <p v-if="showSuccessMessage" class="mt-1 text-sm text-green-500">
              Group updated successfully!
            </p>
            <p v-if="showErrorMessage" class="mt-1 text-sm text-red-500">
              Failed to update group. Please try again.
            </p>
          </div>

          <!-- Chat Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Chat Type</label
            >
            <select
              v-model="form.chatType"
              class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          class="mt-6 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
        >
          Save Changes
        </button>
      </form>
      <button
        @click="$emit('close')"
        class="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "~/firebase/firebase.js";

const props = defineProps({
  groupData: Object,
});

const form = ref({
  name: props.groupData.name,
  description: props.groupData.description,
  chatType: props.groupData.chatType,
});

// 提示消息状态
const showSuccessMessage = ref(false);
const showErrorMessage = ref(false);

const updateGroup = async () => {
  try {
    // 更新群组信息
    await updateDoc(doc(db, "chatroom", props.groupData.id), {
      name: form.value.name,
      description: form.value.description,
      chatType: form.value.chatType,
    });

    // 显示成功提示
    showSuccessMessage.value = true;
    showErrorMessage.value = false;

    // 3 秒后隐藏提示并关闭弹窗
    setTimeout(() => {
      showSuccessMessage.value = false;
      emit("close");
    }, 3000);
  } catch (error) {
    console.error("Error updating group:", error);

    // 显示错误提示
    showErrorMessage.value = true;
    showSuccessMessage.value = false;

    // 3 秒后隐藏提示
    setTimeout(() => {
      showErrorMessage.value = false;
    }, 3000);
  }
};
</script>
