<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="relative bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
      <h2 class="text-xl font-semibold mb-4 dark:text-white">All Members</h2>
      <button
        @click="$emit('close')"
        class="absolute top-6 right-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <Icon icon="lucide:x" class="w-5 h-5" />
      </button>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by username or ID"
        class="w-full p-2 border dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
      />
      <ul>
        <li
          v-for="member in filteredMembers"
          :key="member.id"
          class="flex items-center py-2 border-b dark:border-gray-700"
        >
          <img
            :src="member.avatarUrl"
            alt="avatar"
            class="w-10 h-10 rounded-full mr-3"
          />
          <div class="flex flex-col">
            <span class="font-semibold text-sm dark:text-white">{{
              member.username
            }}</span>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{
              member.role
            }}</span>
          </div>
          <button
            class="ml-auto text-gray-500 dark:text-gray-400"
            @click="handleMemberClick(member)"
          >
            &#x22EE;
          </button>
        </li>
      </ul>
      <button
        @click="$emit('close')"
        class="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
      >
        Close
      </button>
    </div>
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
const props = defineProps({
  members: Array,
});

const searchQuery = ref("");
const emit = defineEmits(["close", "member-click"]);

const handleMemberClick = (member) => {
  emit("member-click", member);
};

const filteredMembers = computed(() => {
  return props.members.filter((member) => {
    return (
      member.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      member.id === searchQuery.value
    );
  });
});
</script>
