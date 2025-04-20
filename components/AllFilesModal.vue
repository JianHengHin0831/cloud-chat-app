<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div
      class="relative bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-h-[50vh] overflow-y-auto"
    >
      <h2 class="text-xl font-semibold mb-4 dark:text-white">
        All Shared Files
      </h2>
      <button
        @click="$emit('close')"
        class="absolute top-6 right-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <Icon icon="lucide:x" class="w-5 h-5" />
      </button>
      <ul>
        <li
          v-for="file in formattedFiles"
          :key="file.id"
          class="flex items-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700 mt-2"
        >
          <div
            class="w-10 h-10 bg-blue-100 dark:bg-blue-900 flex items-center justify-center rounded-lg"
          >
            <font-awesome-icon
              :icon="getFileIcon(file.url)"
              :class="['w-12 h-12', getFileIconColor(file.url)]"
            />
          </div>
          <div class="ml-3 flex flex-col">
            <span class="text-sm font-medium dark:text-white">{{
              getFileName(file.url)
            }}</span>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{
              file.formattedTime
            }}</span>
          </div>
          <button
            class="ml-auto text-gray-500 dark:text-gray-400"
            @click="downloadFile(file.url, groupId)"
          >
            ⬇
          </button>
        </li>
      </ul>
      <button
        @click="$emit('close')"
        class="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
      >
        Close
      </button>
    </div>
  </div>
</template>

<script setup>
import { formatTime } from "@/utils/formatTime";
import { getFileIcon, getFileName, getFileIconColor } from "@/utils/fileUtils";
import { downloadFile } from "~/utils/fileEncryptionHelper";
import { ref, onMounted, watch } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
  files: Array,
  groupId: String,
});

const formattedFiles = ref([]);

// Format file time
const formatFilesTime = async () => {
  const formatted = await Promise.all(
    props.files.map(async (file) => ({
      ...file,
      formattedTime: await formatTime(file.createdAt),
    }))
  );
  formattedFiles.value = formatted;
};

// Listen to file changes
watch(() => props.files, formatFilesTime, { immediate: true });
</script>
