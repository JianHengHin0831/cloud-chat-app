<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4"
  >
    <div class="max-w-md w-full text-center">
      <div class="mb-8">
        <svg
          class="w-32 h-32 mx-auto text-blue-500 dark:text-blue-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h1 class="text-4xl font-bold text-gray-800 dark:text-white mb-4">
        {{ isOffline ? "No Internet Connection" : "Page Not Found" }}
      </h1>

      <p class="text-gray-600 dark:text-gray-300 mb-8">
        {{
          isOffline
            ? "Please check your internet connection and try again."
            : "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."
        }}
      </p>

      <div class="flex justify-center space-x-4">
        <button
          @click="goBack"
          class="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Go Back
        </button>

        <button
          @click="goHome"
          class="px-6 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
        >
          Go Home
        </button>
      </div>

      <div v-if="isOffline" class="mt-8">
        <button
          @click="retryConnection"
          class="px-6 py-3 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const isOffline = ref(false);

onMounted(() => {
  // Check if we're offline
  isOffline.value = !navigator.onLine;

  // Listen for online/offline events
  window.addEventListener("online", () => {
    isOffline.value = false;
  });

  window.addEventListener("offline", () => {
    isOffline.value = true;
  });
});

const goBack = () => {
  router.go(-1);
};

const goHome = () => {
  router.push("/");
};

const retryConnection = () => {
  // Reload the page to retry connection
  window.location.reload();
};
</script>
