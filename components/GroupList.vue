<template>
  <div class="flex flex-col p-4 bg-white shadow-md rounded-lg my-3 mx-2 h-[calc(100vh-5.5rem)]">
    <!-- Search Bar -->
    <div class="flex flex-row items-center px-1 py-1 mb-4 bg-gray-200 rounded-lg">
      <svg
        class="w-5 h-5 text-black ml-3"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-4.35-4.35M16.5 10.5a6 6 0 1 0-12 0 6 6 0 0 0 12 0z"
        />
      </svg>
      <input
        type="text"
        placeholder="Search chats..."
        v-model="searchQuery"
        class="w-full bg-transparent outline-none border-none focus:border-none focus:ring-0 focus:outline-none shadow-none text-gray-800"
      />
    </div>

    <!-- Pinned Groups -->
    <div class="flex-1 overflow-y-auto pb-4 ">
      <div v-if="filteredPinnedGroups.length">
        <h3 class="text-gray-600 font-semibold pb-2 border-b">Pin Groups</h3>
        <ul>
          <li
            v-for="group in filteredPinnedGroups"
            :key="group.id"
            class="group-item"
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
        <h3 class="mt-4 text-gray-600 font-semibold pb-2 border-b">Groups</h3>
        <ul v-if="filteredActiveGroups.length">
          <li
            v-for="group in filteredActiveGroups"
            :key="group.id"
            class="group-item"
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
          class="bg-transparent text-blue-700 font-bold px-1 py-1 hover:text-green-500 rounded-lg flex items-center"
        >
          + Join Private Group
        </button>
      </div>

      <!-- Inactive Groups -->
      <div v-if="filteredInactiveGroups.length">
        <h3 class="mt-4 text-gray-600 font-semibold pb-2 border-b">
          Inactive Group
        </h3>
        <ul>
          <li
            v-for="group in filteredInactiveGroups"
            :key="group.id"
            class="group-item opacity-50"
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
    <!-- Join Private Group Modal -->
    <JoinPrivateGroupModal v-if="showJoinModal" @close="closeJoinModal" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import GroupListItem from "@/components/GroupListItem.vue";
import JoinPrivateGroupModal from "@/components/JoinPrivateGroupModal.vue";
const showJoinModal = ref(false); // 是否显示弹窗

// 打开弹窗
const openJoinModal = () => {
  showJoinModal.value = true;
};

// 关闭弹窗
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

const emit = defineEmits(["select"]); // 定义选中事件

// 处理群组点击事件
const handleGroupClick = (groupId) => {
  emit("select", groupId); // 传递选中的群组 ID 给父组件
};

const searchQuery = ref(""); // 搜索关键字

// 过滤群组列表
const filteredGroups = computed(() => {
  return props.groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 过滤置顶群组
const filteredPinnedGroups = computed(() =>
  filteredGroups.value.filter((group) => group.isPinned && !group.isDisband)
);

// 过滤活跃群组
const filteredActiveGroups = computed(() =>
  filteredGroups.value.filter((group) => !group.isPinned && !group.isDisband)
);

// 过滤不活跃群组
const filteredInactiveGroups = computed(() =>
  filteredGroups.value.filter((group) => group.isDisband)
);
</script>

<style scoped>
.group-item {
  @apply px-1 py-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-all items-center;
}
</style>
