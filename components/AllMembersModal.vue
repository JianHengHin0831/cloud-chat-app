<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white rounded-lg p-6 w-96">
      <h2 class="text-xl font-semibold mb-4">All Members</h2>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by username or ID"
        class="w-full p-2 border rounded-lg mb-4"
      />
      <ul>
        <li
          v-for="member in filteredMembers"
          :key="member.id"
          class="flex items-center py-2"
        >
          <img
            :src="member.avatarUrl"
            alt="avatar"
            class="w-10 h-10 rounded-full mr-3"
          />
          <div class="flex flex-col">
            <span class="font-semibold text-sm">{{ member.username }}</span>
            <span class="text-xs text-gray-500">{{ member.role }}</span>
          </div>
          <button
            class="ml-auto text-gray-500"
            @click="handleMemberClick(member)"
          >
            &#x22EE;
          </button>
        </li>
      </ul>
      <button
        @click="$emit('close')"
        class="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
      >
        Close
      </button>
    </div>
  </div>
</template>

<script setup>
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
