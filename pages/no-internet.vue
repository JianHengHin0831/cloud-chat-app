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
        No Internet Connection
      </h1>

      <p class="text-gray-600 dark:text-gray-300 mb-8">
        Please check your internet connection and try again.
      </p>

      <div class="mt-8">
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

const retryConnection = () => {
  if (navigator.onLine) {
    router.back();
  } else {
    alert("Still no internet connection.");
  }
};
</script>
