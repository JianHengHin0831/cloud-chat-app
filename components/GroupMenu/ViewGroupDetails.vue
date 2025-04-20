<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
      <h2 class="text-xl font-semibold mb-4 dark:text-white">Group Details</h2>
      <div class="space-y-4">
        <!-- Group ID -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Group ID</label
          >
          <div class="flex items-center">
            <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {{ groupData.id }}
            </p>
            <button
              @click="copyGroupId"
              class="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
            </button>
          </div>
          <p v-if="showCopySuccess" class="mt-1 text-sm text-green-500">
            Group ID copied to clipboard!
          </p>
          <p v-if="showCopyError" class="mt-1 text-sm text-red-500">
            Failed to copy Group ID.
          </p>
        </div>

        <!-- Name -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Name</label
          >
          <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
            {{ groupData.name }}
          </p>
        </div>

        <!-- Description -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Description</label
          >
          <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
            {{ groupData.description }}
          </p>
        </div>

        <!-- Chat Type -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Chat Type</label
          >
          <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
            {{ groupData.chatType }}
          </p>
        </div>
      </div>
      <button
        @click="$emit('close')"
        class="mt-6 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
      >
        Close
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  groupData: Object,
});

import { auth } from "~/firebase/firebase.js";
import { logEvent, trackMetric } from "~/utils/logging";

const showCopySuccess = ref(false);
const showCopyError = ref(false);

onMounted(() => {
  logEvent("view_group_details", {
    groupId: props.groupData.id,
    userId: auth.currentUser?.uid,
    groupName: props.groupData.name,
    timestamp: new Date().toISOString(),
  });
  trackMetric("view_group_details_count", 1);
});

const copyGroupId = async () => {
  const startTime = Date.now();
  try {
    await navigator.clipboard.writeText(props.groupData.id);

    logEvent("copy_group_id_success", {
      groupId: props.groupData.id,
      userId: auth.currentUser?.uid,
      groupName: props.groupData.name,
      timestamp: new Date().toISOString(),
    });

    trackMetric("copy_group_id_duration", Date.now() - startTime);
    trackMetric("copy_group_id_success_count", 1);

    showCopySuccess.value = true;
    showCopyError.value = false;

    setTimeout(() => {
      showCopySuccess.value = false;
    }, 3000);
  } catch (error) {
    console.error("Failed to copy Group ID:", error);

    logEvent("copy_group_id_failure", {
      groupId: props.groupData.id,
      userId: auth.currentUser?.uid,
      groupName: props.groupData.name,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    trackMetric("copy_group_id_failure_count", 1);

    showCopyError.value = true;
    showCopySuccess.value = false;

    setTimeout(() => {
      showCopyError.value = false;
    }, 3000);
  }
};
</script>
