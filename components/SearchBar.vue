<template>
  <div class="relative">
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      type="text"
      placeholder="Search public groups..."
      class="w-full p-2 border rounded-md"
    />
    <span class="absolute right-3 top-2 text-gray-400">🔍</span>
  </div>
</template>

<script setup>
defineProps(["modelValue"]);
defineEmits(["update:modelValue"]);
</script>
