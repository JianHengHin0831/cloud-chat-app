<template>
  <div
    class="min-h-screen transition-colors duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
  >
    <slot />
  </div>
</template>

<script setup>
import Header from "~/components/Header.vue";
</script>
