<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
      <h2 class="text-xl font-semibold mb-4 dark:text-white">Disband Group</h2>
      <p class="text-sm text-gray-700 dark:text-gray-300 mb-6">
        Are you sure you want to disband this group? This action cannot be
        undone.
      </p>

      <!-- Status Messages -->
      <div class="mb-4 transition-all duration-300 ease-in-out">
        <div v-if="showSuccessMessage" class="flex items-center text-green-500">
          <svg
            class="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Group disbanded successfully!</span>
        </div>
        <div v-if="showErrorMessage" class="flex items-center text-red-500">
          <svg
            class="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Failed to disband group. Please try again.</span>
        </div>
      </div>

      <div class="flex justify-end space-x-3">
        <button
          @click="$emit('close')"
          :disabled="isProcessing"
          class="px-4 py-2 rounded-lg transition-colors duration-200"
          :class="{
            'bg-gray-200 text-gray-500 cursor-not-allowed': isProcessing,
            'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white':
              !isProcessing,
          }"
        >
          Cancel
        </button>
        <button
          @click="disbandGroup"
          :disabled="isProcessing"
          class="px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center min-w-24"
          :class="{
            'bg-red-400 cursor-not-allowed': isProcessing,
            'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white':
              !isProcessing,
          }"
        >
          <svg
            v-if="isProcessing"
            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {{ isProcessing ? "Disbanding..." : "Disband" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ref as dbRef, get } from "firebase/database";
import { db, auth } from "~/firebase/firebase.js";
import { logEvent, trackMetric } from "~/utils/logging";
import { sendNotification } from "~/utils/sendNotification";
import { writeActivityLog } from "~/utils/activityLog";

const props = defineProps({
  groupId: String,
});
const emit = defineEmits(["close"]);

const isProcessing = ref(false);
const showSuccessMessage = ref(false);
const showErrorMessage = ref(false);

import { useGroupApi } from "~/composables/useGroupApi";
const { disbandGroup: disbandGroupApi } = useGroupApi();

const disbandGroup = async () => {
  if (isProcessing.value) return;

  const startTime = Date.now();
  isProcessing.value = true;
  showSuccessMessage.value = false;
  showErrorMessage.value = false;

  try {
    // Log attempt
    logEvent("disband_group_attempt", {
      groupId: props.groupId,
      userId: auth.currentUser?.uid,
      timestamp: new Date().toISOString(),
    });

    await disbandGroupApi(props.groupId);

    // Get group name for notification
    const groupRef = dbRef(db, `chatrooms/${props.groupId}`);
    const groupSnapshot = await get(groupRef);
    const groupName = groupSnapshot.exists()
      ? groupSnapshot.val().name
      : "the group";

    // Send notification to all group members
    await sendNotification({
      groupId: props.groupId,
      title: "Group Disbanded",
      body: `${groupName} has been disbanded by ${
        auth.currentUser?.displayName || "the admin"
      }`,
      chatroomId: props.groupId,
      isSaveNotification: true,
      excludeMuted: false,
    });

    await writeActivityLog(
      props.groupId,
      auth.currentUser?.uid,
      `${auth.currentUser?.displayName} has disbanded the group`
    );

    // Log success
    logEvent("disband_group_success", {
      groupId: props.groupId,
      userId: auth.currentUser?.uid,
      groupName: groupName,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });

    // Track metrics
    trackMetric("disband_group_duration", Date.now() - startTime);
    trackMetric("disband_group_success_count", 1);

    showSuccessMessage.value = true;

    // Close after 1.5s to let user see success message
    setTimeout(() => {
      emit("close");
    }, 1500);
  } catch (error) {
    console.error("Error disbanding group:", error);

    // Log failure
    logEvent("disband_group_failure", {
      groupId: props.groupId,
      userId: auth.currentUser?.uid,
      error: error.message,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });

    // Track failure metric
    trackMetric("disband_group_failure_count", 1);

    showErrorMessage.value = true;

    // Hide error after 3s
    setTimeout(() => {
      showErrorMessage.value = false;
    }, 3000);
  } finally {
    isProcessing.value = false;
  }
};
</script>

<style scoped>
/* Smooth transitions for modal */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Button transition */
button {
  transition: all 0.2s ease;
}
</style>
