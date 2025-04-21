<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 relative">
      <!-- Loading overlay -->
      <div
        v-if="isProcessing"
        class="absolute inset-0 bg-white/70 dark:bg-gray-800/70 flex items-center justify-center z-10 rounded-lg"
      >
        <svg
          class="animate-spin h-6 w-6 text-blue-600"
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
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
      </div>

      <h2 class="text-xl font-semibold mb-4 dark:text-white">
        Update Group Details
      </h2>
      <form @submit.prevent="updateGroup">
        <div class="space-y-4">
          <!-- Name -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Name</label
            >
            <input
              v-model="form.name"
              type="text"
              :disabled="isProcessing"
              class="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <!-- Description -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Description</label
            >
            <input
              v-model="form.description"
              type="text"
              :disabled="isProcessing"
              class="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <p v-if="showSuccessMessage" class="mt-1 text-sm text-green-500">
              Group updated successfully!
            </p>
            <p v-if="showErrorMessage" class="mt-1 text-sm text-red-500">
              Failed to update group. Please try again.
            </p>
          </div>

          <!-- Group Image Upload -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Group Image</label
            >
            <input
              type="file"
              accept="image/*"
              @change="handleImageUpload"
              class="mt-1 block w-full text-sm text-gray-900 dark:text-gray-100"
            />
          </div>

          <!-- Chat Type -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Chat Type</label
            >
            <select
              v-model="form.chatType"
              :disabled="isProcessing"
              class="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          :disabled="isProcessing"
          class="mt-6 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isProcessing ? "Saving..." : "Save Changes" }}
        </button>
      </form>
      <button
        @click="$emit('close')"
        :disabled="isProcessing"
        class="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup>
import { db, auth, storage } from "~/firebase/firebase.js";
import { logEvent, trackMetric } from "~/utils/logging";
import { sendNotification } from "~/utils/sendNotification";
import { writeActivityLog } from "~/utils/activityLog";

const props = defineProps({
  groupData: Object,
});

const emit = defineEmits(["close"]);

const form = ref({
  name: props.groupData.name,
  description: props.groupData.description,
  chatType: props.groupData.chatType,
});

const showSuccessMessage = ref(false);
const showErrorMessage = ref(false);
const isProcessing = ref(false);
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const selectedImageFile = ref(null);
const previewImage = ref(null);

const uploadFile = async (file) => {
  if (!file) return null;

  const fileRef = storageRef(
    storage,
    `scheduledMessages/${props.groupId}/${Date.now()}_${file.name}`
  );
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
};

const notifyGroupUpdate = async (groupId) => {
  await sendNotification({
    groupId: groupId,
    title: "Group Updated",
    body: "Group information has been updated",
    chatroomId: groupId,
    isSaveNotification: true,
    excludeMuted: true,
  });
};

import { useGroupApi } from "~/composables/useGroupApi";
import { ref as dbRef, set } from "firebase/database";
const { updateGroup: updateGroupApi } = useGroupApi();
const previousForm = ref({
  name: props.groupData.name,
  description: props.groupData.description,
  chatType: props.groupData.chatType,
});

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    previewImage.value = file;
  }
};

const updateGroup = async () => {
  const startTime = Date.now();
  try {
    isProcessing.value = true;
    //previousForm.value = form.value;
    if (previewImage.value) {
      const photoUrl = await uploadFile(previewImage.value);
      const groupImageRef = dbRef(
        db,
        `chatrooms/${props.groupData.id}/photoUrl`
      );
      await set(groupImageRef, photoUrl);
    }

    await updateGroupApi(props.groupData.id, form.value);
    await notifyGroupUpdate(props.groupData.id);
    await updateGroupLog(previousForm.value);

    // Log successful update
    logEvent("update_group_success", {
      groupId: props.groupData.id,
      userId: auth.currentUser?.uid,
      groupName: props.groupData.name,
      changes: {
        name: form.value.name !== previousForm.value.name,
        description: form.value.description !== previousForm.value.description,
        chatType: form.value.chatType !== previousForm.value.chatType,
      },
      timestamp: new Date().toISOString(),
    });

    // Track metrics
    trackMetric("update_group_duration", Date.now() - startTime);
    trackMetric("update_group_success_count", 1);

    showSuccessMessage.value = true;
    showErrorMessage.value = false;

    setTimeout(() => {
      showSuccessMessage.value = false;
      emit("close");
    }, 1000);
  } catch (error) {
    console.error("Error updating group:", error);

    // Log failed update
    logEvent("update_group_failure", {
      groupId: props.groupData.id,
      userId: auth.currentUser?.uid,
      groupName: props.groupData.name,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    // Track failure metric
    trackMetric("update_group_failure_count", 1);

    showErrorMessage.value = true;
    showSuccessMessage.value = false;

    setTimeout(() => {
      showErrorMessage.value = false;
    }, 3000);
  } finally {
    isProcessing.value = false;
    previewImage.value = null;
  }
};

const updateGroupLog = async (oldData) => {
  try {
    const currentUser = auth.currentUser?.displayName || "Admin";
    const changes = [];

    if (form.value.name !== oldData.name) {
      changes.push(`changed group name to "${form.value.name}"`);
    }

    if (form.value.description !== oldData.description) {
      changes.push("updated the group description");
    }

    if (form.value.chatType !== oldData.chatType) {
      changes.push(`changed group type to ${form.value.chatType}`);
    }

    if (previewImage.value) {
      changes.push("updated the group image");
    }

    if (changes.length > 0) {
      await writeActivityLog(
        props.groupData.id,
        auth.currentUser?.uid,
        `${currentUser} ${changes.join(", ")}`
      );
      previousForm.value = form.value;
    }
  } catch (error) {
    console.error("Error updating group:", error);
  }
};
</script>
