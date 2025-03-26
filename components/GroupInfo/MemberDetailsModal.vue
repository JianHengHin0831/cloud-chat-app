<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white rounded-lg p-6 w-96">
      <h2 class="text-xl font-semibold mb-4">Member Details</h2>

      <!-- 成员信息 -->
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">ID</label>
          <p class="mt-1 text-sm text-gray-900">{{ member.id }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Username</label
          >
          <p class="mt-1 text-sm text-gray-900">{{ member.username }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <p class="mt-1 text-sm text-gray-900">{{ member.email }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Joined At</label
          >
          <p class="mt-1 text-sm text-gray-900">
            {{ member.joinedAt.split("T")[0] }}
          </p>
        </div>
      </div>

      <!-- 关闭按钮 -->
      <button
        @click="$emit('close')"
        class="mt-6 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
      >
        Close
      </button>
    </div>
  </div>
</template>

<script setup>
import { formatTime } from "@/utils/formatTime";

const props = defineProps({
  member: Object, // 成员信息
});

const emit = defineEmits(["close"]);
</script>
