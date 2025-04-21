<template>
  <div
    class="flex flex-col items-center justify-center my-3 mx-3 h-[calc(100vh-5.5rem)] p-8 text-center"
  >
    <div class="mb-6">
      <Icon
        icon="lucide:message-square-plus"
        class="w-16 h-16 text-gray-400 dark:text-gray-600"
      />
    </div>
    <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
      No Group Selected
    </h2>
    <p class="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
      Get started by creating a new group, selecting an existing one, or joining
      a group through an invitation.
    </p>
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { navigateTo } from "#app";
</script>
