<template>
  <!-- Popup window background-->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeModal"
  >
    <!-- Pop-up content -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative"
    >
      <!-- Close button -->
      <button
        class="absolute top-6 right-6 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        @click="closeModal"
      >
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
            stroke-width="3"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- Form content -->
      <h2 class="text-xl font-bold mb-4 dark:text-white">Create Group</h2>
      <form @submit.prevent="createGroup">
        <!-- Group Name -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1 dark:text-gray-300"
            >Group Name</label
          >
          <input
            v-model="name"
            type="text"
            placeholder="Enter group name"
            class="w-full p-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <!-- Group Description -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1 dark:text-gray-300"
            >Group Description (Optional)</label
          >
          <textarea
            v-model="description"
            placeholder="Enter group description"
            class="w-full p-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            rows="3"
          ></textarea>
        </div>

        <!-- Chat Type -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1 dark:text-gray-300"
            >Chat Type</label
          >
          <select
            v-model="chatType"
            class="w-full p-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <!-- Group Photo -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1 dark:text-gray-300"
            >Group Photo (Optional)</label
          >
          <input
            type="file"
            @change="handleFileUpload"
            accept="image/*"
            class="dark:text-gray-300"
          />
        </div>

        <!-- Message area -->
        <div v-if="message" class="mb-4">
          <p
            class="text-sm p-2 rounded"
            :class="{
              'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300':
                message.type === 'success',
              'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300':
                message.type === 'error',
            }"
          >
            {{ message.text }}
          </p>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-600 dark:hover:bg-blue-700"
          :disabled="isLoading || isDone"
        >
          {{ isLoading ? "Creating..." : isDone ? "Created" : "Create Group" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { auth } from "~/firebase/firebase.js";

const isOpen = ref(false);
const name = ref("");
const description = ref("");
const chatType = ref("public");
const photoFile = ref(null);
const isLoading = ref(false);
const isDone = ref(false);
const message = ref(null);

const openModal = () => {
  isOpen.value = true;
  resetForm();
};

const closeModal = () => {
  isOpen.value = false;
  resetForm();
};

//Reset forms and messages
const resetForm = () => {
  name.value = "";
  description.value = "";
  chatType.value = "public";
  photoFile.value = null;
  message.value = null;
};

// Process file upload
const handleFileUpload = (event) => {
  photoFile.value = event.target.files[0];
};

// Create a group
const createGroup = async () => {
  isLoading.value = true;
  message.value = null;

  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }
    const idToken = await user.getIdToken();

    const formData = new FormData();
    formData.append("name", name.value);
    formData.append("description", description.value);
    formData.append("chatType", chatType.value);
    if (photoFile.value) {
      formData.append("photoFile", photoFile.value);
    }

    const response = await $fetch("/api/createGroup", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    const currentUser = auth.currentUser?.displayName || "Admin";
    const newGroupId = response.groupId;

    await writeActivityLog(
      newGroupId, // You'll need to get this after creation
      auth.currentUser?.uid,
      `${currentUser} created the group "${name.value}"`,
      response.joinedAt
    );

    message.value = {
      type: "success",
      text: `Group created with ID: ${response.groupId}`,
    };
    isDone.value = true;

    setTimeout(() => {
      closeModal();
      isDone.value = false;
    }, 3000);
  } catch (error) {
    console.error("Error creating group:", error);

    message.value = {
      type: "error",
      text: "Failed to create group. Please try again.",
    };
  } finally {
    isLoading.value = false;
  }
};

defineExpose({ openModal });
</script>
