<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white rounded-lg p-6 w-96 h-[50vh] overflow-y-auto">
      <h2 class="text-xl font-semibold mb-4">All Shared Files</h2>
      <ul>
        <li
          v-for="file in props.files"
          :key="file.id"
          class="flex items-center p-2 rounded-lg bg-gray-100 mt-2"
        >
          <div
            class="w-10 h-10 bg-blue-100 flex items-center justify-center rounded-lg"
          >
            <font-awesome-icon
              :icon="getFileIcon(file.url)"
              :class="['w-12 h-12', getFileIconColor(file.url)]"
            />
          </div>
          <div class="ml-3 flex flex-col">
            <span class="text-sm font-medium">{{ getFileName(file.url) }}</span>
            <span class="text-xs text-gray-500">{{
              formatTime(file.createdAt)
            }}</span>
          </div>
          <button class="ml-auto text-gray-500" @click="downloadFile(file.url)">
            ⬇
          </button>
        </li>
      </ul>
      <button
        @click="$emit('close')"
        class="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
      >
        Close
      </button>
    </div>
  </div>
</template>

<script setup>
import { formatTime } from "@/utils/formatTime";
import { getFileIcon, getFileName, getFileIconColor } from "@/utils/fileUtils";

const props = defineProps({
  files: Array,
});

const downloadFile = (url) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = url.split("/").pop();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>
