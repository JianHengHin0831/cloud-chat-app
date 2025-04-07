<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
      <h2 class="text-xl font-semibold mb-4 dark:text-white">
        Pending Invitations
      </h2>

      <ul v-if="formttedPendingInvitations.length > 0">
        <li
          v-for="invitation in formttedPendingInvitations"
          :key="invitation.groupId"
          class="flex items-center py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <img
            :src="invitation.groupInfo.photoUrl"
            alt="avatar"
            class="w-10 h-10 rounded-full mr-3"
          />
          <div class="flex flex-col">
            <span class="font-semibold text-sm dark:text-white">
              {{ invitation.groupInfo.name }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ invitation.groupInfo.description }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              GroupType: {{ invitation.groupInfo.chatType }}
            </span>
            <span class="text-xs text-gray-400">
              Invited at: {{ invitation.formattedTime }}
            </span>
          </div>

          <button
            class="ml-auto text-green-500 dark:text-green-400 disabled:opacity-50"
            :disabled="loadingId === invitation.id"
            @click="approve(invitation.groupId)"
          >
            {{
              loadingId === invitation.id && actionType === "approve"
                ? "Approving..."
                : "Approve"
            }}
          </button>
          <button
            class="ml-2 text-red-500 dark:text-red-400 disabled:opacity-50"
            :disabled="loadingId === invitation.id"
            @click="reject(invitation.groupId)"
          >
            {{
              loadingId === invitation.groupId && actionType === "reject"
                ? "Rejecting..."
                : "Reject"
            }}
          </button>
        </li>
      </ul>

      <div v-else class="text-center text-gray-500 dark:text-gray-400">
        No pending invitations.
      </div>

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
import { ref, watch } from "vue";

const props = defineProps({
  pendingInvitations: Array,
});

const formttedPendingInvitations = ref([]);

watch(
  () => props.pendingInvitations,
  async (newVal) => {
    const result = await Promise.all(
      newVal.map(async (invitation) => ({
        ...invitation,
        formattedTime: await formatTime(invitation.invitedAt),
      }))
    );
    formttedPendingInvitations.value = result;
  },
  { deep: true, immediate: true }
);

const emit = defineEmits(["close", "approve", "reject"]);

const loadingId = ref(null);
const actionType = ref("");

const approve = (id) => {
  loadingId.value = id;
  actionType.value = "approve";
  emit("approve", id, () => {
    loadingId.value = null;
    actionType.value = "";
  });
};

const reject = (id) => {
  loadingId.value = id;
  actionType.value = "reject";
  emit("reject", id, () => {
    loadingId.value = null;
    actionType.value = "";
  });
};
</script>
