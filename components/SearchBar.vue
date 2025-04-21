<template>
  <div class="relative w-full border-4 border-white rounded-xl">
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      type="text"
      placeholder="Search public groups..."
      class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <Icon
      icon="lucide:search"
      class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
    />
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
defineProps(["modelValue"]);
defineEmits(["update:modelValue"]);
</script>
