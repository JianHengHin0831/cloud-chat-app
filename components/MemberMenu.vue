<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 my-3">
      <h2 class="text-xl font-semibold mb-4 dark:text-white">Member Menu</h2>
      <div v-if="member.isBanned" class="mb-4 flex items-center text-red-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
            clip-rule="evenodd"
          />
        </svg>
        <span>Muted Member</span>
      </div>
      <button
        @click="openMemberDetailsModal"
        class="w-full text-left p-2 bg-gray-300 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 my-1"
      >
        View Member Details
      </button>

      <button
        v-if="
          props.currentRole === 'admin' && auth.currentUser?.uid !== member.id
        "
        @click="openTransferGroupOwnershipModal"
        class="w-full text-left p-2 bg-gray-300 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 my-1"
      >
        Transfer Group Ownership
      </button>

      <button
        v-if="canAddModerator"
        @click="handleAddModerator"
        class="w-full text-left p-2 bg-gray-300 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 my-1"
      >
        Add Moderator
      </button>

      <button
        v-if="canRemoveModerator"
        @click="handleRemoveModerator"
        class="w-full text-left p-2 bg-gray-300 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 my-1"
      >
        Remove Moderator
      </button>
      <button
        v-if="canRemoveMember"
        @click="openRemoveMemberModal"
        class="w-full text-left p-2 bg-gray-300 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 my-1"
      >
        Remove Member
      </button>
      <button
        v-if="canMute"
        @click="handleMuteClick"
        class="w-full text-left p-2 bg-gray-300 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 my-1"
      >
        {{ member.isBanned ? "Unmute Member" : "Mute Member" }}
      </button>
      <button
        @click="$emit('close')"
        class="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
      >
        Close
      </button>
    </div>

    <MemberDetailsModal
      v-if="isMemberDetailsModalOpen"
      :member="props.member"
      :chatroomId="props.chatroomId"
      @close="closeMemberDetailsModal"
    />

    <RemoveMemberModal
      v-if="isRemoveMemberModalOpen"
      :member="props.member"
      @close="closeRemoveMemberModal"
      @confirm="handleRemoveMember"
    />

    <ConfirmationModal
      v-if="showMuteConfirmation"
      :title="member.isBanned ? 'Unmute Member' : 'Mute Member'"
      :message="
        member.isBanned
          ? `Are you sure you want to unmute ${member.username}?`
          : `Are you sure you want to mute ${member.username}?`
      "
      @close="showMuteConfirmation = false"
      @confirm="confirmMute"
    />
    <TransferGroupOwnershipModal
      v-if="isTransferGroupOwnershipModalOpen"
      :member="props.member"
      @close="closeTransferGroupOwnershipModal"
      @confirm="handleTransferGroupOwnership"
    />
  </div>
</template>

<script setup>
import MemberDetailsModal from "@/components/GroupInfo/MemberDetailsModal.vue";
import RemoveMemberModal from "@/components/GroupInfo/RemoveMemberModal.vue";
import ConfirmationModal from "./GroupInfo/ConfirmationModal.vue";
import TransferGroupOwnershipModal from "@/components/GroupInfo/TransferGroupOwnershipModal.vue";
import { ref as dbRef, get } from "firebase/database";
import { auth, db } from "~/firebase/firebase.js";

const props = defineProps({
  member: Object,
  currentRole: String,
  chatroomId: String,
});

const emit = defineEmits(["close", "remove", "mute"]);

const isMemberDetailsModalOpen = ref(false);
const isRemoveMemberModalOpen = ref(false);
const isTransferGroupOwnershipModalOpen = ref(false);
const showMuteConfirmation = ref(false);
const canRemoveMember = computed(() => {
  if (!auth.currentUser?.uid) {
    return false;
  }
  const currentUserId = auth.currentUser?.uid;
  const currentUserRole = props.currentRole || "";
  const memberRole = props.member?.role || "";

  return (
    (currentUserRole === "admin" ||
      (currentUserRole === "moderator" && memberRole === "user")) &&
    props.member?.id !== currentUserId
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

const openTransferGroupOwnershipModal = () => {
  isTransferGroupOwnershipModalOpen.value = true;
};

const closeTransferGroupOwnershipModal = () => {
  isTransferGroupOwnershipModalOpen.value = false;
};

const handleRemoveMember = () => {
  emit("remove", props.member.id);
  closeRemoveMemberModal();
  emit("close");
};

const canAddModerator = computed(() => {
  const currentUserRole = props.currentRole || "";
  const memberRole = props.member?.role || "";

  return currentUserRole === "admin" && memberRole === "user";
});

const canRemoveModerator = computed(() => {
  const currentUserRole = props.currentRole || "";
  const memberRole = props.member?.role || "";

  return currentUserRole === "admin" && memberRole === "moderator";
});

const notifyRoleChange = async (groupId, memberId, newRole) => {
  const memberRef = dbRef(db, `users/${memberId}`);
  const snapshot = await get(memberRef);
  const memberName = snapshot.exists()
    ? snapshot.val().displayName
    : "a member";

  await sendNotification({
    userIds: [memberId],
    title: "Role Changed",
    body: `You are now ${newRole} in the group`,
    chatroomId: groupId,
    isSaveNotification: true,
  });
};

import { useGroupApi } from "~/composables/useGroupApi";
const { promoteModerator, demoteModerator, transferGroupOwnership } =
  useGroupApi();
const handleRemoveModerator = async () => {
  try {
    await demoteModerator(props.chatroomId, props.member.id);
    await notifyRoleChange(props.chatroomId, props.member.id, "user");
    emit("close");
  } catch (error) {
    console.error("Error demoting member to user:", error);
  }
};

const handleAddModerator = async () => {
  try {
    await promoteModerator(props.chatroomId, props.member.id);
    await notifyRoleChange(props.chatroomId, props.member.id, "moderator");
    emit("close");
  } catch (error) {
    console.error("Error promoting member to moderator:", error);
  }
};

const canMute = computed(() => {
  if (props.currentRole === "admin") {
    return props.member.role !== "admin";
  }
  if (props.currentRole === "moderator") {
    return props.member.role === "user";
  }
  return false;
});

const handleMuteClick = () => {
  showMuteConfirmation.value = true;
};

const handleTransferGroupOwnership = async () => {
  try {
    await transferGroupOwnership(props.chatroomId, props.member.id);
    await writeActivityLog(
      props.chatroomId,
      auth.currentUser?.uid,
      `${await getUsername(
        auth.currentUser?.uid
      )} has transferred group ownership to ${props.member.username}`,
      Date.now()
    );
    await sendNotification({
      groupId: props.chatroomId,
      title: "Group Ownership Transferred",
      body: `The group has been transferred to ${props.member.username}`,
      chatroomId: props.chatroomId,
      isSaveNotification: true,
    });
    emit("close");
  } catch (error) {
    console.error("Error transferring group ownership:", error);
  }
};

const confirmMute = () => {
  emit("mute", {
    memberId: props.member.id,
    isMuted: !props.member.isBanned,
  });
  showMuteConfirmation.value = false;
  emit("close");
};
</script>
