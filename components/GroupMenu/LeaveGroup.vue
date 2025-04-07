<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
      <h2 class="text-xl font-semibold mb-4 dark:text-white">Leave Group</h2>

      <p class="text-gray-600 dark:text-gray-300 mb-6">
        Are you sure you want to leave this group? This action cannot be undone.
      </p>

      <div class="flex justify-end space-x-4">
        <button
          @click="emit('close')"
          class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          :disabled="isLoading"
        >
          Cancel
        </button>

        <button
          @click="handleLeaveGroup"
          class="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Leaving...</span>
          <span v-else>Leave Group</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ref as dbRef, remove, get } from "firebase/database";
import { db, auth } from "~/firebase/firebase.js";
import { logEvent, trackMetric } from "~/utils/logging";
import { sendNotification } from "~/utils/sendNotification";
import { writeActivityLog } from "~/utils/activityLog";

const router = useRouter();

const props = defineProps({
  groupId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["close"]);
const showSuccessMessage = ref(false);
const showErrorMessage = ref(false);
const isLoading = ref(false);

//TO-DO:BACKEND
import { useGroupApi } from "~/composables/useGroupApi";
const { leaveGroup: leaveGroupApi } = useGroupApi();
const handleLeaveGroup = async () => {
  const startTime = Date.now();
  try {
    isLoading.value = true;

    // 记录离开群组尝试
    logEvent("leave_group_attempt", {
      groupId: props.groupId,
      userId: auth.currentUser?.uid,
      timestamp: new Date().toISOString(),
    });

    const data = await leaveGroupApi(props.groupId, auth.currentUser?.uid);

    if (data.success) {
      const groupRef = dbRef(db, `chatrooms/${props.groupId}`);
      const groupSnapshot = await get(groupRef);
      const groupName = groupSnapshot.exists()
        ? groupSnapshot.val().name
        : "the group";

      // 调用离开群组的 API
      await sendNotification({
        groupId: props.groupId,
        title: "Leave Group",
        body: ` ${
          auth.currentUser?.displayName || "A person"
        } has left the group ${groupName}`,
        chatroomId: props.groupId,
        isSaveNotification: true,
        excludeMuted: true,
      });

      await writeActivityLog(
        props.groupId,
        auth.currentUser?.uid,
        `${auth.currentUser?.displayName || "A person"} has left the group`
      );

      // 记录离开群组成功
      const duration = Date.now() - startTime;
      logEvent("leave_group_success", {
        groupId: props.groupId,
        userId: auth.currentUser?.uid,
        groupName,
        duration,
        timestamp: new Date().toISOString(),
      });

      trackMetric("leave_group_duration", duration, {
        group_id: props.groupId,
      });

      trackMetric("leave_group_success_count", 1, {
        group_id: props.groupId,
      });

      emit("close");
    }
  } catch (error) {
    console.error("Error leaving group:", error);

    // 记录离开群组失败
    logEvent("leave_group_failure", {
      groupId: props.groupId,
      userId: auth.currentUser?.uid,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    trackMetric("leave_group_failure_count", 1, {
      group_id: props.groupId,
    });
  } finally {
    isLoading.value = false;
  }
};
</script>
