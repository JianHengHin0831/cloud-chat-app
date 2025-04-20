<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col"
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
        <div v-if="loading" class="flex justify-center items-center h-64">
          <div
            class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
          ></div>
        </div>

        <template v-else>
          <!-- Image Preview -->
          <img
            v-if="fileType === 'image'"
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

          <!-- PDF Preview - Direct, without using external viewers -->
          <iframe
            v-else-if="fileType === 'pdf'"
            :src="fileUrl"
            class="w-full h-full min-h-[70vh]"
            frameborder="0"
            @error="directPreviewFailed = true"
          ></iframe>

          <!-- Text files preview (using text/plain) -->
          <iframe
            v-else-if="
              ['text', 'code'].includes(fileType) && !directPreviewFailed
            "
            :src="fileUrl"
            class="w-full h-full min-h-[70vh]"
            frameborder="0"
            @error="directPreviewFailed = true"
          ></iframe>

          <!-- Fallback for text/code files if direct preview fails -->
          <div
            v-else-if="
              ['text', 'code'].includes(fileType) && directPreviewFailed
            "
            class="flex flex-col items-center"
          >
            <p class="mb-4 text-gray-700">
              Preview failed. Please download the file to view its contents.
            </p>
            <button
              @click="download"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
            >
              Download File
            </button>
          </div>

          <!-- Office files (fallback to download + preview option) -->
          <div
            v-else-if="isOfficeFile"
            class="flex flex-col items-center w-full"
          >
            <ClientOnly>
              <VueOfficeDocx
                v-if="fileExtension.includes('doc')"
                :src="fileArrayBuffer" />
              <VueOfficeExcel
                v-else-if="fileExtension.includes('xls')"
                class="w-full"
                :src="fileArrayBuffer" />
              <vue-office-pptx
                v-else-if="fileExtension.includes('ppt')"
                :src="fileArrayBuffer"
            /></ClientOnly>
          </div>

          <!-- Unsupported File Type -->
          <div
            v-else
            class="flex flex-col items-center justify-center h-full text-gray-500"
          >
            <font-awesome-icon
              :icon="getFileIcon"
              class="w-16 h-16 mb-4"
              :class="getFileIconColor"
            />
            <p class="text-lg">Preview not available for this file type</p>
            <p class="text-sm mt-2">{{ fileExtension.toUpperCase() }} file</p>

            <!-- Try direct preview anyway -->
            <button
              @click="useDirectPreview = !useDirectPreview"
              class="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {{ useDirectPreview ? "Hide Preview" : "Try Preview Anyway" }}
            </button>

            <iframe
              v-if="useDirectPreview"
              :src="fileUrl"
              class="w-full h-full min-h-[70vh] mt-6"
              frameborder="0"
            ></iframe>
          </div>
        </template>
      </div>

      <!-- Footer Actions -->
      <div class="p-4 border-t flex justify-between items-center">
        <div class="space-x-3">
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
        <button
          @click="close"
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import VueOfficeDocx from "@vue-office/docx";
import VueOfficeExcel from "@vue-office/excel";
import VueOfficePptx from "@vue-office/pptx";

const props = defineProps({
  fileUrl: String,
  fileName: String,
  fileBlob: Blob,
});

const fileArrayBuffer = ref(null);

onMounted(async () => {
  if (props.fileBlob) {
    fileArrayBuffer.value = await props.fileBlob.arrayBuffer();
  }
});

const emit = defineEmits(["close"]);

const close = () => {
  emit("close");
};

const show = ref(true);
const loading = ref(true);
const useExternalViewer = ref(false);
const useDirectPreview = ref(false);
const useGoogleViewer = ref(true);

onMounted(() => {
  // Simple loading simulation
  setTimeout(() => {
    loading.value = false;
  }, 500);
});

// File properties
const fileExtension = computed(() => {
  if (!props.fileName) return "";
  const parts = props.fileName.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
});

const fileType = computed(() => {
  if (!fileExtension.value) return "other";

  const imageTypes = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
  const videoTypes = ["mp4", "webm", "mov", "avi", "flv", "mkv"];
  const officeTypes = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"];
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
    "swift",
  ];

  if (fileExtension.value === "pdf") return "pdf";
  if (imageTypes.includes(fileExtension.value)) return "image";
  if (videoTypes.includes(fileExtension.value)) return "video";
  if (officeTypes.includes(fileExtension.value)) return "office";
  if (codeTypes.includes(fileExtension.value)) return "code";
  if (["txt", "md", "rtf", "csv"].includes(fileExtension.value)) return "text";

  return "other";
});

const isOfficeFile = computed(() => {
  const officeExtensions = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"];
  return officeExtensions.includes(fileExtension.value);
});

// File icon helpers
const getFileIcon = computed(() => {
  switch (fileType.value) {
    case "pdf":
      return ["far", "file-pdf"];
    case "image":
      return ["far", "file-image"];
    case "video":
      return ["far", "file-video"];
    case "code":
      return ["far", "file-code"];
    case "text":
      return ["far", "file-alt"];
    case "office":
      if (fileExtension.value.includes("doc")) return ["far", "file-word"];
      if (fileExtension.value.includes("xls")) return ["far", "file-excel"];
      if (fileExtension.value.includes("ppt"))
        return ["far", "file-powerpoint"];
      return ["far", "file"];
    default:
      return ["far", "file"];
  }
});

const getFileIconColor = computed(() => {
  switch (fileType.value) {
    case "pdf":
      return "text-red-500";
    case "image":
      return "text-purple-500";
    case "video":
      return "text-pink-500";
    case "code":
      return "text-gray-800";
    case "office":
      if (fileExtension.value.includes("doc")) return "text-blue-700";
      if (fileExtension.value.includes("xls")) return "text-green-700";
      if (fileExtension.value.includes("ppt")) return "text-orange-600";
      return "text-gray-500";
    default:
      return "text-gray-500";
  }
});

// File download
const download = () => {
  const link = document.createElement("a");
  link.href = props.fileUrl;
  link.download = props.fileName || "download";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Handle direct preview errors
const directPreviewFailed = ref(false);

const handlePreviewError = () => {
  directPreviewFailed.value = true;
  console.warn("Direct preview failed, providing external viewer options");
};

const tryExternalViewer = () => {
  useGoogleViewer.value = true; // Start with Google Viewer
  //useExternalViewer.value = true;
};

// Handle external viewer errors
const handleExternalViewerError = () => {
  console.error("External viewer failed");
  useExternalViewer.value = false;
  directPreviewFailed.value = true;
};

// Modify the preview processing logic
const handlePreview = async () => {
  if (isOfficeFile.value) {
    useExternalViewer.value = true;
    useDirectPreview.value = false;
  } else {
    useDirectPreview.value = true;
    useExternalViewer.value = false;
  }
};
</script>

<style>
/* Add any additional styles here */
</style>
