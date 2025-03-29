<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white rounded-lg p-6 w-96 my-3">
      <h2 class="text-xl font-semibold mb-4">Member Menu</h2>
      <button
        @click="openMemberDetailsModal"
        class="w-full text-left p-2 bg-gray-300 rounded-md hover:bg-blue-600 my-1"
      >
        View Member Details
      </button>

      <!-- Add Moderator 按钮 -->
      <button
        v-if="canAddModerator"
        @click="handleAddModerator"
        class="w-full text-left p-2 bg-gray-300 rounded-md hover:bg-blue-600 my-1"
      >
        Add Moderator
      </button>

      <!-- Remove Moderator 按钮 -->
      <button
        v-if="canRemoveModerator"
        @click="handleRemoveModerator"
        class="w-full text-left p-2 bg-gray-300 rounded-md hover:bg-blue-600 my-1"
      >
        Remove Moderator
      </button>
      <button
        v-if="canRemoveMember"
        @click="openRemoveMemberModal"
        class="w-full text-left p-2 bg-gray-300 rounded-md hover:bg-blue-600 my-1"
      >
        Remove Member
      </button>
      <button
        @click="$emit('close')"
        class="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
      >
        Close
      </button>
    </div>

    <!-- 成员详情弹窗 -->
    <MemberDetailsModal
      v-if="isMemberDetailsModalOpen"
      :member="props.member"
      @close="closeMemberDetailsModal"
    />

    <!-- 移除成员弹窗 -->
    <RemoveMemberModal
      v-if="isRemoveMemberModalOpen"
      :member="props.member"
      @close="closeRemoveMemberModal"
      @confirm="handleRemoveMember"
    />
  </div>
</template>

<script setup>
import MemberDetailsModal from "@/components/GroupInfo/MemberDetailsModal.vue";
import RemoveMemberModal from "@/components/GroupInfo/RemoveMemberModal.vue";

const props = defineProps({
  member: Object, // 当前成员对象
  currentRole: String, // 当前用户的角色
  currentUserId: String,
});

const emit = defineEmits(["close", "remove"]);

const isMemberDetailsModalOpen = ref(false);
const isRemoveMemberModalOpen = ref(false);

const canRemoveMember = computed(() => {
  const currentUserRole = props.currentRole || ""; // 默认值为空字符串
  const memberRole = props.member?.role || ""; // 默认值为空字符串

  return (
    (currentUserRole === "admin" ||
      (currentUserRole === "moderator" && memberRole === "user")) &&
    props.member?.id !== props.currentUserId
  );
});

const openMemberDetailsModal = () => {
  isMemberDetailsModalOpen.value = true;
};

const closeMemberDetailsModal = () => {
  isMemberDetailsModalOpen.value = false;
};

const openRemoveMemberModal = () => {
  isRemoveMemberModalOpen.value = true;
};

const closeRemoveMemberModal = () => {
  isRemoveMemberModalOpen.value = false;
};

const handleRemoveMember = () => {
  emit("remove", props.member.id); // 触发移除成员事件
  closeRemoveMemberModal(); // 关闭弹窗
};

// 检查是否可以添加 Moderator
const canAddModerator = computed(() => {
  const currentUserRole = props.currentRole || ""; // 默认值为空字符串
  const memberRole = props.member?.role || ""; // 默认值为空字符串

  return (
    currentUserRole === "admin" && // 只有 admin 可以添加 moderator
    memberRole === "user" // 目标成员必须是 user
  );
});

// 检查是否可以移除 Moderator
const canRemoveModerator = computed(() => {
  const currentUserRole = props.currentRole || ""; // 默认值为空字符串
  const memberRole = props.member?.role || ""; // 默认值为空字符串

  return (
    currentUserRole === "admin" && // 只有 admin 可以移除 moderator
    memberRole === "moderator" // 目标成员必须是 moderator
  );
});

// 处理移除 Moderator
const handleRemoveModerator = async () => {
  try {
    // 更新目标成员的 role 为 user
    await updateDoc(
      doc(db, "chatroom_user", `${props.selectedGroupId}_${props.member.id}`),
      {
        role: "user",
      }
    );
    emit("update-role"); // 触发更新角色事件
    emit("close"); // 关闭弹窗
  } catch (error) {
    console.error("Error demoting member to user:", error);
  }
};

// 处理添加 Moderator
const handleAddModerator = async () => {
  try {
    // 更新目标成员的 role 为 moderator
    await updateDoc(
      doc(db, "chatroom_user", `${props.selectedGroupId}_${props.member.id}`),
      {
        role: "moderator",
      }
    );
    emit("update-role"); // 触发更新角色事件
    emit("close"); // 关闭弹窗
  } catch (error) {
    console.error("Error promoting member to moderator:", error);
  }
};
</script>
