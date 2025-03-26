<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col"
    >
      <!-- Header -->
      <div class="flex justify-between items-center p-4 border-b">
        <h3 class="text-lg font-semibold">{{ fileName }}</h3>
        <button @click="close" class="text-gray-500 hover:text-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Preview Content -->
      <div class="flex-1 overflow-auto p-4">
        <!-- Microsoft Office Preview -->
        <iframe
          v-show="!loading"
          v-if="isOfficeFile && useMicrosoftViewer && fileType !== 'pdf'"
          :src="microsoftViewerUrl"
          class="w-full h-full min-h-[70vh]"
          frameborder="0"
          @load="onIframeLoad"
          @error="onIframeError"
        ></iframe>

        <iframe
          v-show="!loading"
          v-else-if="isOfficeFile && fileType !== 'pdf'"
          :src="googleViewerUrl"
          class="w-full h-full min-h-[70vh]"
          frameborder="0"
          @load="onIframeLoad"
          @error="onIframeError"
        ></iframe>

        <!-- PDF Preview -->
        <iframe
          v-else-if="fileType === 'pdf'"
          :src="`https://docs.google.com/gview?url=${encodeURIComponent(
            fileUrl
          )}&embedded=true`"
          class="w-full h-full min-h-[70vh]"
          frameborder="0"
        ></iframe>

        <!-- CSV/TXT Preview -->
        <div v-else-if="['csv', 'txt'].includes(fileExtension)" class="h-full">
          <div
            class="overflow-auto max-h-[70vh] bg-gray-50 p-4 font-mono text-sm"
          >
            <pre>{{ fileContent }}</pre>
          </div>
        </div>

        <!-- Image Preview -->
        <img
          v-else-if="fileType === 'image'"
          :src="fileUrl"
          class="max-w-full max-h-[70vh] mx-auto"
          alt="Preview"
        />

        <!-- Video Preview -->
        <video
          v-else-if="fileType === 'video'"
          :src="fileUrl"
          controls
          class="max-w-full max-h-[70vh] mx-auto"
        ></video>

        <!-- Code Preview -->
        <div v-else-if="fileType === 'code'" class="h-full">
          <div class="overflow-auto max-h-[70vh] bg-gray-800 text-gray-100 p-4">
            <pre><code>{{ fileContent }}</code></pre>
          </div>
        </div>

        <!-- Unsupported File Type -->
        <div
          v-else
          class="flex flex-col items-center justify-center h-full text-gray-500"
        >
          <font-awesome-icon :icon="['far', 'file']" class="w-16 h-16 mb-4" />
          <p class="text-lg">Preview not available for this file type</p>
          <p class="text-sm mt-2">{{ fileExtension.toUpperCase() }} file</p>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="p-4 border-t flex justify-between items-center">
        <!-- <div class="text-sm text-gray-500">File size: {{ fileSize }}</div> -->
        <div class="space-x-3">
          <button
            v-if="['csv', 'txt', 'code'].includes(fileExtension)"
            @click="copyContent"
            class="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
          >
            Copy Text
          </button>
          <button
            @click="download"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  fileUrl: String,
  fileName: String,
});

const emit = defineEmits(["close"]);

const close = () => {
  emit("close");
};

const show = ref(true);
const fileContent = ref("");

const loading = ref(true);
const showRetry = ref(false);
const useMicrosoftViewer = ref(false);
const retryCount = ref(0);

// Computed URLs
const googleViewerUrl = computed(() => {
  return `https://docs.google.com/gview?url=${encodeURIComponent(
    props.fileUrl
  )}&embedded=true`;
});

const microsoftViewerUrl = computed(() => {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    props.fileUrl
  )}`;
});

const onIframeLoad = () => {
  loading.value = false;
  showRetry.value = false;
  retryCount.value = 0;
};

const onIframeError = () => {
  if (!useMicrosoftViewer.value) {
    // First try failed - switch to Microsoft viewer
    useMicrosoftViewer.value = true;
    loading.value = true;
  } else {
    // Both viewers failed
    loading.value = false;
    showRetry.value = true;
  }
};

const retryLoad = () => {
  loading.value = true;
  showRetry.value = false;
  retryCount.value++;

  // Alternate between viewers on retry
  useMicrosoftViewer.value = !useMicrosoftViewer.value;
};

const codeTypes = [
  "js",
  "ts",
  "html",
  "css",
  "json",
  "xml",
  "py",
  "java",
  "cpp",
  "c",
  "cs",
  "php",
  "rb",
  "go",
];

const fileExtension = computed(() => {
  if (!props.fileName) return "";

  const parts = props.fileName.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
});

const fileType = computed(() => {
  if (!fileExtension.value) return "other";

  const imageTypes = ["jpg", "jpeg", "png", "gif", "webp"];
  const videoTypes = ["mp4", "webm", "mov", "avi"];

  if (fileExtension.value === "pdf") return "pdf";
  if (imageTypes.includes(fileExtension.value)) return "image";
  if (videoTypes.includes(fileExtension.value)) return "video";
  if (codeTypes.includes(fileExtension.value)) return "code";
  if (
    ["doc", "docx", "ppt", "pptx", "xls", "xlsx", "csv", "txt"].includes(
      fileExtension.value
    )
  )
    return fileExtension.value;
  return "other";
});

const download = () => {
  const link = document.createElement("a");
  link.href = props.fileUrl;
  link.download = props.fileName.split("-")[1];
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(fileContent.value);
    alert("Content copied to clipboard");
  } catch (err) {
    console.error("Failed to copy:", err);
    alert("Failed to copy content");
  }
};

const isOfficeFile = computed(() =>
  ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(fileExtension.value)
);
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
