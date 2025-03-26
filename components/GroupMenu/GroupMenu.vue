<template>
  <div class="relative">
    <!-- 菜单按钮 -->
    <button class="text-gray-500" @click="toggleMenu">
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
          stroke-width="2"
          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
        />
      </svg>
    </button>

    <!-- 菜单选项 -->
    <div
      v-if="isMenuOpen"
      class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50"
    >
      <ul>
        <!-- View Group Details -->
        <li>
          <button
            @click="openViewGroupDetails"
            class="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            View Group Details
          </button>
        </li>

        <!-- Update Group Details (仅限 admin) -->
        <li v-if="isAdmin">
          <button
            @click="openUpdateGroupDetails"
            class="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Update Group Details
          </button>
        </li>

        <!-- Disband Group (仅限 admin) -->
        <li v-if="isAdmin">
          <button
            @click="openDisbandGroup"
            class="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Disband Group
          </button>
        </li>
      </ul>
    </div>
  </div>

  <!-- 弹窗组件 -->
  <ViewGroupDetails
    v-if="isViewGroupDetailsOpen"
    :groupData="groupData"
    @close="closeViewGroupDetails"
  />
  <UpdateGroupDetails
    v-if="isUpdateGroupDetailsOpen"
    :groupData="groupData"
    @close="closeUpdateGroupDetails"
  />
  <DisbandGroup
    v-if="isDisbandGroupOpen"
    :groupId="selectedGroupId"
    @close="closeDisbandGroup"
  />
</template>

<script setup>
import { ref, computed } from "vue";
import ViewGroupDetails from "~/components/GroupMenu/ViewGroupDetails.vue";
import UpdateGroupDetails from "~/components/GroupMenu/UpdateGroupDetails.vue";
import DisbandGroup from "~/components/GroupMenu/DisbandGroup.vue";

const props = defineProps({
  selectedGroupId: String,
  groupData: Object,
  membersData: Array,
});

const isMenuOpen = ref(false);
const isViewGroupDetailsOpen = ref(false);
const isUpdateGroupDetailsOpen = ref(false);
const isDisbandGroupOpen = ref(false);
import { auth } from "~/firebase/firebase.js";

// 检查当前用户是否是 admin
const isAdmin = computed(() => {
  const currentUser = auth.currentUser; // 假设你已经引入了 auth
  if (!currentUser) return false;
  const member = props.membersData.find(
    (member) => member.id === currentUser.uid
  );
  return member?.role === "admin";
});

// 打开/关闭菜单
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

// 打开 View Group Details 弹窗
const openViewGroupDetails = () => {
  isViewGroupDetailsOpen.value = true;
  isMenuOpen.value = false;
};

// 关闭 View Group Details 弹窗
const closeViewGroupDetails = () => {
  isViewGroupDetailsOpen.value = false;
};

// 打开 Update Group Details 弹窗
const openUpdateGroupDetails = () => {
  isUpdateGroupDetailsOpen.value = true;
  isMenuOpen.value = false;
};

// 关闭 Update Group Details 弹窗
const closeUpdateGroupDetails = () => {
  isUpdateGroupDetailsOpen.value = false;
};

// 打开 Disband Group 弹窗
const openDisbandGroup = () => {
  isDisbandGroupOpen.value = true;
  isMenuOpen.value = false;
};

// 关闭 Disband Group 弹窗
const closeDisbandGroup = () => {
  isDisbandGroupOpen.value = false;
};
</script>
