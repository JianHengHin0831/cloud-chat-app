<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
      <h2 class="text-xl font-semibold mb-4 dark:text-white">Remove Member</h2>
      <p class="text-sm text-gray-700 dark:text-gray-300 mb-6">
        Are you sure you want to remove
        <span class="font-semibold dark:text-white">{{ member.username }}</span>
        from the group?
      </p>

      <!-- 操作按钮 -->
      <div class="flex justify-end space-x-4">
        <button
          @click="$emit('close')"
          class="bg-gray-500 dark:bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          @click="confirmRemove"
          class="bg-red-500 dark:bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-600 dark:hover:bg-red-700"
        >
          Remove
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
  member: Object, // 成员信息
  groupId: String, // 群组ID
});

const emit = defineEmits(["close", "confirm"]);

const confirmRemove = async () => {
  const startTime = Date.now();

  // 记录移除成员尝试
  logEvent("remove_member_attempt", {
    groupId: props.groupId,
    memberId: props.member.id,
    memberName: props.member.username,
    userId: auth.currentUser?.uid,
    timestamp: new Date().toISOString(),
  });

  try {
    emit("confirm"); // 触发确认移除事件

    // 发送通知给被移除的成员
    await sendNotification({
      userIds: [props.member.id],
      title: "Removed from Group",
      body: `You have been removed from the group by ${
        auth.currentUser?.displayName || "an admin"
      }`,
      chatroomId: props.groupId,
      isSaveNotification: true,
      excludeMuted: true,
    });

    // 记录活动日志
    await writeActivityLog(
      props.groupId,
      auth.currentUser?.uid,
      `${
        (await getUsername(auth.currentUser?.uid)) || "An admin"
      } has removed ${await getUsername(props.member.id)} from the group`
    );

    // 记录移除成员成功
    const duration = Date.now() - startTime;
    logEvent("remove_member_success", {
      groupId: props.groupId,
      memberId: props.member.id,
      memberName: props.member.username,
      userId: auth.currentUser?.uid,
      duration,
      timestamp: new Date().toISOString(),
    });

    trackMetric("remove_member_duration", duration, {
      group_id: props.groupId,
    });

    trackMetric("remove_member_success_count", 1, {
      group_id: props.groupId,
    });
  } catch (error) {
    console.error("Error removing member:", error);

    // 记录移除成员失败
    logEvent("remove_member_failure", {
      groupId: props.groupId,
      memberId: props.member.id,
      memberName: props.member.username,
      userId: auth.currentUser?.uid,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    trackMetric("remove_member_failure_count", 1, {
      group_id: props.groupId,
    });
  } finally {
    emit("close"); // 关闭弹窗
  }
};
</script>
