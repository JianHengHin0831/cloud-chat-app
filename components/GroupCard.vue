<template>
  <div class="p-4 border shadow-sm bg-white rounded-xl w-full">
    <img
      :src="group.groupUrl || '/images/group.png'"
      alt="Group Image"
      class="w-full h-32 object-cover rounded-t-lg mb-2"
    />
    <div class="flex items-center justify-between">
      <!-- 群组名称 -->
      <h3 class="text-lg font-semibold text-gray-900">{{ group.name }}</h3>

      <!-- 成员数量 -->
      <div
        class="flex items-center bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full"
      >
        <span class="mr-1">👥</span>
        {{ group.members }} member{{ group.members > 1 ? "s" : "" }}
      </div>
    </div>

    <!-- 群组描述 -->
    <p class="text-gray-600 text-sm mt-3">{{ group.desc }}</p>

    <!-- 加入按钮 -->
    <button
      class="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
    >
      <Icon icon="mdi:plus" class="text-black" />
      Join Group
    </button>
  </div>
</template>

<script setup>
defineProps(["group"]);
import { Icon } from "@iconify/vue";
</script>
