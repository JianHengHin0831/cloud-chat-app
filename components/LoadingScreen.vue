<template>
  <div class="fixed inset-0 bg-[#111B21] flex items-center justify-center z-50">
    <div class="flex flex-col items-center">
      <!-- Logo -->
      <div class="w-32 h-32 mb-8">
        <img
          src="/images/cloud_logo_dark_big.png"
          alt="Logo"
          class="w-full h-full object-contain"
        />
      </div>
      <!-- Loading Bar -->
      <div class="w-64 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-green-500 transition-all duration-300"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
      <!-- Loading Text -->
      <p class="mt-4 text-gray-400 text-sm">{{ loadingText }}</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  progress: {
    type: Number,
    default: 0,
  },
  loadingText: {
    type: String,
    default: "Loading your chats...",
  },
});
</script>
