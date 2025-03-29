<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <!-- Close Button -->
    <button
      @click="close"
      class="absolute top-4 right-20 text-white text-5xl z-50 hover:text-gray-300"
    >
      &times;
    </button>

    <!-- Download Button -->
    <button
      @click="download"
      class="absolute top-4 right-32 text-white text-5xl z-50 hover:text-gray-300 underline"
    >
      ⬇️Download
    </button>

    <!-- Media Content -->
    <div class="relative max-w-[90vw] max-h-[90vh]">
      <img
        v-if="mediaType === 'image'"
        :src="mediaUrl"
        class="max-w-full max-h-full object-contain"
        :class="isZoomed ? 'cursor-zoom-in' : 'cursor-zoom-out'"
        @click="toggleZoom"
      />
      <video
        v-else-if="mediaType === 'video'"
        :src="mediaUrl"
        controls
        class="max-w-full max-h-full"
      />
    </div>
  </div>
</template>

<script setup>
const isOpen = ref(false);
const mediaUrl = ref("");
const mediaType = ref("");
const isZoomed = ref(false); // 用于控制图片是否放大

const open = (url, type) => {
  mediaUrl.value = url;
  mediaType.value = type;
  isOpen.value = true;
  isZoomed.value = false; // 每次打开时重置缩放状态
};

const close = () => {
  isOpen.value = false;
};

const download = () => {
  const link = document.createElement("a");
  link.href = mediaUrl.value;
  link.download = mediaUrl.value.split("/").pop();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const toggleZoom = () => {
  if (mediaType.value === "image") {
    isZoomed.value = !isZoomed.value;
  }
};

defineExpose({ open });
</script>

<style scoped>
img {
  transition: transform 0.3s ease;
}

img.cursor-zoom-out {
  transform: scale(2); /* 放大 1.5 倍 */
  cursor: zoom-out;
}

img.cursor-zoom-in {
  transform: scale(1); /* 原始大小 */
  cursor: zoom-in;
}
</style>
