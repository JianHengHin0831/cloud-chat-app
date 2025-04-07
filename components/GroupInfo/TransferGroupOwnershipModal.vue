<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 my-3">
      <h2 class="text-xl font-semibold mb-4 dark:text-white">
        Transfer Group Ownership
      </h2>
      <p class="text-gray-600 dark:text-gray-300 mb-6">
        Are you sure you want to transfer the group ownership to
        {{ member.username }}?
      </p>

      <div class="flex justify-end space-x-3">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          Cancel
        </button>
        <button
          @click="$emit('confirm')"
          class="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  member: {
    type: Object,
    required: true,
  },
});

defineEmits(["close", "confirm"]);
</script>
