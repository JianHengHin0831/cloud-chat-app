<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
      <h2 class="text-xl font-semibold mb-4 dark:text-white">
        Confirm Add Member
      </h2>
      <p class="text-sm text-gray-700 dark:text-gray-300 mb-6">
        Are you sure you want to add
        <span class="font-semibold dark:text-white">{{ user.username }}</span>
        to the group?
      </p>

      <div class="flex justify-end space-x-4">
        <button
          @click="$emit('close')"
          class="bg-gray-500 dark:bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          @click="handleConfirm"
          class="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { logEvent, trackMetric } from "~/utils/logging";
import { auth } from "~/firebase/firebase.js";
import { sendNotification } from "~/utils/sendNotification";
import { writeActivityLog } from "~/utils/activityLog";

const props = defineProps({
  user: Object,
  groupId: String,
});

const emit = defineEmits(["close", "confirm"]);

const handleConfirm = async () => {
  const startTime = Date.now();

  logEvent("confirm_add_member_attempt", {
    groupId: props.groupId,
    userId: props.user.id,
    userName: props.user.username,
    currentUserId: auth.currentUser?.uid,
    timestamp: new Date().toISOString(),
  });

  try {
    emit("confirm", props.user);

    await sendNotification({
      userIds: [props.user.id],
      title: "Group Invitation",
      body: `You have been invited to join a group by ${
        auth.currentUser?.displayName || "an admin"
      }`,
      chatroomId: props.groupId,
      isSaveNotification: true,
      excludeMuted: true,
    });

    await writeActivityLog(
      props.groupId,
      auth.currentUser?.uid,
      `${
        (await getUsername(auth.currentUser?.uid)) || "An admin"
      } has invited ${props.user.username} to join the group`
    );

    const duration = Date.now() - startTime;
    logEvent("confirm_add_member_success", {
      groupId: props.groupId,
      userId: props.user.id,
      userName: props.user.username,
      currentUserId: auth.currentUser?.uid,
      duration,
      timestamp: new Date().toISOString(),
    });

    trackMetric("confirm_add_member_duration", duration, {
      group_id: props.groupId,
    });

    trackMetric("confirm_add_member_success_count", 1, {
      group_id: props.groupId,
    });
  } catch (error) {
    console.error("Error confirming add member:", error);

    logEvent("confirm_add_member_failure", {
      groupId: props.groupId,
      userId: props.user.id,
      userName: props.user.username,
      currentUserId: auth.currentUser?.uid,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    trackMetric("confirm_add_member_failure_count", 1, {
      group_id: props.groupId,
    });
  } finally {
    emit("close");
  }
};
</script>
