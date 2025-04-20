<template>
  <div
    class="h-[calc(100vh-5.5rem)] my-3 mx-0 rounded-lg p-4 bg-white dark:bg-gray-800 transition-colors duration-200"
  >
    <!-- Search bar -->
    <div
      class="flex flex-row items-center px-1 py-1 mb-4 bg-gray-200 rounded-lg border-b dark:border-gray-700"
    >
      <div class="relative w-full">
        <input
          type="text"
          placeholder="Search conversations..."
          class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          v-model="searchQuery"
        />
        <Icon
          icon="lucide:search"
          class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
      </div>
    </div>

    <!-- Group list -->
    <div class="h-[calc(100%-4rem)]">
      <!-- Pinned Groups -->
      <div class="flex-1 overflow-y-auto pb-4">
        <div v-if="filteredPinnedGroups.length">
          <h3
            class="text-gray-600 dark:text-gray-400 font-semibold pb-2 border-b dark:border-gray-700"
          >
            Pin Groups
          </h3>
          <ul>
            <li
              v-for="group in filteredPinnedGroups"
              :key="group.id"
              class="px-1 py-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all items-center"
            >
              <GroupListItem
                :group="group"
                :isSelected="group.id === selectedGroupId"
                @click="handleGroupClick"
              />
            </li>
          </ul>
        </div>

        <!-- Active Groups -->
        <div>
          <h3
            class="mt-4 text-gray-600 dark:text-gray-400 font-semibold pb-2 border-b dark:border-gray-700"
          >
            Groups
          </h3>
          <ul v-if="filteredActiveGroups.length">
            <li
              v-for="group in filteredActiveGroups"
              :key="group.id"
              class="px-1 py-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all items-center"
            >
              <GroupListItem
                :group="group"
                :isSelected="group.id === selectedGroupId"
                @click="handleGroupClick"
              />
            </li>
          </ul>
          <button
            @click="openJoinModal"
            class="bg-transparent text-blue-700 dark:text-blue-500 font-bold px-1 py-1 hover:text-green-500 dark:hover:text-green-400 rounded-lg flex items-center"
          >
            + Join Private Group
          </button>
        </div>

        <!-- Inactive Groups -->
        <div v-if="filteredInactiveGroups.length">
          <h3
            class="mt-4 text-gray-600 dark:text-gray-400 font-semibold pb-2 border-b dark:border-gray-700"
          >
            Inactive Group
          </h3>
          <ul>
            <li
              v-for="group in filteredInactiveGroups"
              :key="group.id"
              class="px-1 py-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all items-center opacity-50"
            >
              <GroupListItem
                :group="group"
                :isSelected="group.id === selectedGroupId"
                @click="handleGroupClick"
              />
            </li>
          </ul>
        </div>
      </div>
    </div>
    <!-- Join Private Group Modal -->
    <JoinPrivateGroupModal v-if="showJoinModal" @close="closeJoinModal" />
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import GroupListItem from "@/components/GroupListItem.vue";
import JoinPrivateGroupModal from "@/components/JoinPrivateGroupModal.vue";
const showJoinModal = ref(false);

// Open pop-up window
const openJoinModal = () => {
  showJoinModal.value = true;
};

// Close pop-up window
const closeJoinModal = () => {
  showJoinModal.value = false;
};

const props = defineProps({
  groups: {
    type: Array,
    required: true,
  },
  selectedGroupId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["select"]);

// Handle group click events
const handleGroupClick = (groupId) => {
  emit("select", groupId);
};

const searchQuery = ref("");

const filteredGroups = computed(() => {
  return props.groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const filteredPinnedGroups = computed(() =>
  filteredGroups.value.filter((group) => group.isPinned && !group.isDisband)
);

const filteredActiveGroups = computed(() =>
  filteredGroups.value.filter((group) => !group.isPinned && !group.isDisband)
);

const filteredInactiveGroups = computed(() =>
  filteredGroups.value.filter((group) => group.isDisband)
);
</script>
