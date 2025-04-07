<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
      <h2 class="text-xl font-semibold mb-4 dark:text-white">Add Member</h2>

      <!-- 搜索栏 -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by ID, email, or username"
        class="w-full p-2 border dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
      />

      <!-- 匹配的用户列表 -->
      <ul v-if="filteredUsers.length > 0">
        <li
          v-for="user in filteredUsers"
          :key="user.id"
          class="flex items-center py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          @click="openConfirmModal(user)"
        >
          <img
            :src="user.avatarUrl"
            alt="avatar"
            class="w-10 h-10 rounded-full mr-3"
          />
          <div class="flex flex-col">
            <span class="font-semibold text-sm dark:text-white">
              {{ user.username }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ user.email }}
            </span>
          </div>
          <span
            v-if="loadingStates[user.id]"
            class="ml-auto text-blue-500 dark:text-blue-400"
          >
            {{
              loadingStates[user.id] === "adding"
                ? "Adding..."
                : loadingStates[user.id] === "success"
                ? "Added!"
                : loadingStates[user.id] === "error"
                ? "Failed"
                : ""
            }}
          </span>
        </li>
      </ul>
      <div v-else class="text-center text-gray-500 dark:text-gray-400">
        No users found
      </div>

      <!-- 待处理用户列表 -->
      <div v-if="pendingUsers.length > 0" class="mt-4">
        <h3 class="text-lg font-semibold mb-2 dark:text-white">
          Pending Users
        </h3>
        <ul>
          <li
            v-for="pendingUser in pendingUsers"
            :key="pendingUser.id"
            class="flex items-center py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          >
            <img
              :src="pendingUser.avatarUrl"
              alt="avatar"
              class="w-10 h-10 rounded-full mr-3"
            />
            <div class="flex flex-col">
              <span class="font-semibold text-sm dark:text-white">
                {{ pendingUser.username }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ pendingUser.email }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{
                  formatTimeWithShowExact(pendingUser.requestedAt, showExact)
                }}
              </span>
            </div>
            <button
              class="ml-auto text-green-500 dark:text-green-400 disabled:opacity-50"
              :disabled="loadingStates[pendingUser.id]"
              @click="approvePendingUser(pendingUser.id)"
            >
              {{
                loadingStates[pendingUser.id] === "approving"
                  ? "Approving..."
                  : loadingStates[pendingUser.id] === "success"
                  ? "Approved!"
                  : loadingStates[pendingUser.id] === "error"
                  ? "Failed"
                  : "Approve"
              }}
            </button>
            <button
              class="ml-2 text-red-500 dark:text-red-400 disabled:opacity-50"
              :disabled="loadingStates[pendingUser.id]"
              @click="rejectPendingUser(pendingUser.id)"
            >
              {{
                loadingStates[pendingUser.id] === "rejecting"
                  ? "Rejecting..."
                  : loadingStates[pendingUser.id] === "success"
                  ? "Rejected!"
                  : loadingStates[pendingUser.id] === "error"
                  ? "Failed"
                  : "Reject"
              }}
            </button>
          </li>
        </ul>
      </div>

      <!-- 已邀请用户列表 -->
      <div v-show="pendingInvitedUsers.length > 0" class="mt-4">
        <h3 class="text-lg font-semibold mb-2 dark:text-white">
          Invited Users
        </h3>
        <ul>
          <li
            v-for="invited in pendingInvitedUsers"
            :key="invited.id"
            class="flex items-center py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <img
              :src="invited.avatarUrl"
              alt="avatar"
              class="w-10 h-10 rounded-full mr-3"
            />
            <div class="flex flex-col">
              <span class="font-semibold text-sm dark:text-white">
                {{ invited.username }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ invited.email }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatTimeWithShowExact(invited.requestedAt, showExact) }}
              </span>
            </div>
          </li>
        </ul>
      </div>

      <!-- 关闭按钮 -->
      <button
        @click="$emit('close')"
        class="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
      >
        Close
      </button>
    </div>
  </div>

  <!-- 确认弹窗 -->
  <ConfirmAddMemberModal
    v-if="selectedUser"
    :user="selectedUser"
    @confirm="handleConfirmAddMember"
    @close="closeConfirmModal"
  />
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { ref as dbRef, get } from "firebase/database";
import { db, auth } from "~/firebase/firebase.js";
import ConfirmAddMemberModal from "@/components/GroupInfo/ConfirmAddMemberModal.vue";
import { formatTimeWithShowExact, getUserSettings } from "@/utils/formatTime";
import { logEvent, trackMetric } from "~/utils/logging";
import { sendNotification } from "~/utils/sendNotification";
import { writeActivityLog } from "~/utils/activityLog";

const props = defineProps({
  groupId: String,
  pendingUsers: Array,
  membersId: Array,
  pendingInvitedUsers: Array,
});

const emit = defineEmits([
  "add-member",
  "approve-pending-user",
  "reject-pending-user",
  "close",
]);
const showExact = ref(true);
onMounted(async () => {
  showExact.value = await getUserSettings();
});
const searchQuery = ref("");
const selectedUser = ref(null);
const users = ref([]);
const loadingStates = ref({});

const fetchAllUsers = async () => {
  const startTime = Date.now();
  try {
    const pendingIds = props.pendingUsers.map((u) => u.id);
    const invitedIds = props.pendingInvitedUsers.map((u) => u.id);

    const usersRef = dbRef(db, "users");
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    const result = [];

    for (const [id, user] of Object.entries(data)) {
      if (
        props.membersId.includes(id) ||
        pendingIds.includes(id) ||
        invitedIds.includes(id)
      )
        continue;

      const showEmail = user?.advancedSettings?.showEmail ?? true;
      result.push({
        id,
        username: user.username || "",
        avatarUrl: user.avatarUrl || "",
        email: showEmail ? user.email || "anonymous" : "anonymous",
      });
    }

    users.value = result;

    // 记录用户列表获取成功
    const duration = Date.now() - startTime;
    logEvent("fetch_users_success", {
      groupId: props.groupId,
      count: result.length,
      duration,
      timestamp: new Date().toISOString(),
    });

    trackMetric("fetch_users_duration", duration, {
      group_id: props.groupId,
    });

    trackMetric("available_users_count", result.length, {
      group_id: props.groupId,
    });
  } catch (e) {
    console.error("Failed to fetch users:", e);
    users.value = [];

    // 记录用户列表获取失败
    logEvent("fetch_users_failure", {
      groupId: props.groupId,
      error: e.message,
      timestamp: new Date().toISOString(),
    });

    trackMetric("fetch_users_failure_count", 1, {
      group_id: props.groupId,
    });
  }
};

onMounted(fetchAllUsers);

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  return users.value
    .filter((user) => {
      return (
        user.id.includes(searchQuery.value) ||
        user.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    })
    .slice(0, 5);
});

const openConfirmModal = (user) => {
  selectedUser.value = user;
};

const closeConfirmModal = () => {
  selectedUser.value = null;
};

const handleConfirmAddMember = async () => {
  if (!selectedUser.value) return;

  const startTime = Date.now();
  loadingStates.value[selectedUser.value.id] = "adding";
  const userId = selectedUser.value.id;
  try {
    closeConfirmModal();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    emit("add-member", userId);
    loadingStates.value[userId] = "success";
    users.value = users.value.filter((user) => user.id !== userId);
    setTimeout(() => (loadingStates.value[userId] = null), 1500);

    // 发送通知给被添加的用户
    await sendNotification({
      userIds: [userId],
      title: "Group Invitation",
      body: `You have been added to a group by ${
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
      `${auth.currentUser?.displayName || "An admin"} has added ${
        selectedUser.value.username
      } to the group`
    );

    // 记录添加成员成功
    const duration = Date.now() - startTime;
    logEvent("add_member_success", {
      groupId: props.groupId,
      userId,
      duration,
      timestamp: new Date().toISOString(),
    });

    trackMetric("add_member_duration", duration, {
      group_id: props.groupId,
    });

    trackMetric("add_member_success_count", 1, {
      group_id: props.groupId,
    });
  } catch (e) {
    loadingStates.value[userId] = "error";
    setTimeout(() => (loadingStates.value[userId] = null), 1500);

    // 记录添加成员失败
    logEvent("add_member_failure", {
      groupId: props.groupId,
      userId,
      error: e.message,
      timestamp: new Date().toISOString(),
    });

    trackMetric("add_member_failure_count", 1, {
      group_id: props.groupId,
    });
  }
};

const approvePendingUser = async (id) => {
  const startTime = Date.now();
  loadingStates.value[id] = "approving";
  try {
    await new Promise((r) => setTimeout(r, 1000));
    emit("approve-pending-user", id);
    loadingStates.value[id] = "success";
    setTimeout(() => (loadingStates.value[id] = null), 1500);

    // 发送通知给被批准的用户
    await sendNotification({
      userIds: [id],
      title: "Group Request Approved",
      body: `Your request to join the group has been approved by ${
        auth.currentUser?.displayName || "an admin"
      }`,
      chatroomId: props.groupId,
      isSaveNotification: true,
      excludeMuted: true,
    });

    // 记录活动日志
    const pendingUser = props.pendingUsers.find((user) => user.id === id);
    await writeActivityLog(
      props.groupId,
      auth.currentUser?.uid,
      `${auth.currentUser?.displayName || "An admin"} has approved ${
        pendingUser?.username || "a user"
      }'s request to join the group`
    );

    // 记录批准待处理用户成功
    const duration = Date.now() - startTime;
    logEvent("approve_pending_user_success", {
      groupId: props.groupId,
      userId: id,
      duration,
      timestamp: new Date().toISOString(),
    });

    trackMetric("approve_pending_user_duration", duration, {
      group_id: props.groupId,
    });

    trackMetric("approve_pending_user_success_count", 1, {
      group_id: props.groupId,
    });
  } catch (e) {
    loadingStates.value[id] = "error";
    setTimeout(() => (loadingStates.value[id] = null), 1500);

    // 记录批准待处理用户失败
    logEvent("approve_pending_user_failure", {
      groupId: props.groupId,
      userId: id,
      error: e.message,
      timestamp: new Date().toISOString(),
    });

    trackMetric("approve_pending_user_failure_count", 1, {
      group_id: props.groupId,
    });
  }
};

const rejectPendingUser = async (id) => {
  const startTime = Date.now();
  loadingStates.value[id] = "rejecting";
  try {
    await new Promise((r) => setTimeout(r, 1000));
    emit("reject-pending-user", id);
    loadingStates.value[id] = "success";
    setTimeout(() => (loadingStates.value[id] = null), 1500);

    // 发送通知给被拒绝的用户
    await sendNotification({
      userIds: [id],
      title: "Group Request Rejected",
      body: `Your request to join the group has been rejected by ${
        auth.currentUser?.displayName || "an admin"
      }`,
      chatroomId: props.groupId,
      isSaveNotification: true,
      excludeMuted: true,
    });

    // 记录活动日志
    const pendingUser = props.pendingUsers.find((user) => user.id === id);
    await writeActivityLog(
      props.groupId,
      auth.currentUser?.uid,
      `${
        (await getUsername(auth.currentUser?.uid)) || "An admin"
      } has rejected ${
        pendingUser?.username || "a user"
      }'s request to join the group`
    );

    // 记录拒绝待处理用户成功
    const duration = Date.now() - startTime;
    logEvent("reject_pending_user_success", {
      groupId: props.groupId,
      userId: id,
      duration,
      timestamp: new Date().toISOString(),
    });

    trackMetric("reject_pending_user_duration", duration, {
      group_id: props.groupId,
    });

    trackMetric("reject_pending_user_success_count", 1, {
      group_id: props.groupId,
    });
  } catch (e) {
    loadingStates.value[id] = "error";
    setTimeout(() => (loadingStates.value[id] = null), 1500);

    // 记录拒绝待处理用户失败
    logEvent("reject_pending_user_failure", {
      groupId: props.groupId,
      userId: id,
      error: e.message,
      timestamp: new Date().toISOString(),
    });

    trackMetric("reject_pending_user_failure_count", 1, {
      group_id: props.groupId,
    });
  }
};
</script>
