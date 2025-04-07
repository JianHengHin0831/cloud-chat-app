<template>
  <div
    class="flex flex-col overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
  >
    <div class="flex items-center p-4 border-b dark:border-gray-700 md:hidden">
      <button @click="$emit('back')" class="flex items-center">
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span class="ml-2"></span>
      </button>
      <h3 class="text-lg mx-auto font-semibold">Group Info</h3>
    </div>

    <div class="p-4 mx-2 md:my-3 flex-grow">
      <!-- Desktop Group Info 标题 -->
      <h3
        class="text-lg border-b-2 dark:border-gray-700 py-2 font-bold hidden md:block"
      >
        Group Info
      </h3>

      <!-- 成员列表 -->
      <div class="mt-2 md:mt-4">
        <div class="flex">
          <h4 class="text-gray-500 dark:text-gray-400 font-medium">
            Members ({{ members.length }})
          </h4>
          <!-- v-if="members.length > 5" -->
          <button
            @click="openAllMembersModal"
            class="ml-2 text-blue-500 dark:text-blue-400 text-sm"
          >
            View All Members
          </button>
          <button
            @click="openAddMemberModal"
            v-if="checkGroupAdmin"
            class="ml-2 text-blue-500 dark:text-blue-400 text-sm"
          >
            Add Members
          </button>
        </div>
        <ul>
          <li
            v-for="member in displayedMembers"
            :key="member.id"
            class="flex items-center py-2 border-b dark:border-gray-700"
          >
            <!-- 头像 -->
            <div class="relative">
              <img
                :src="member.avatarUrl"
                alt="avatar"
                class="w-10 h-10 rounded-full mr-3"
              />
              <!-- 禁言标记 -->
              <div
                v-if="member.isBanned"
                class="absolute -top-1 -right-[-8px] bg-red-500 rounded-full p-1"
                title="Muted Member"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3 w-3 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div class="flex flex-col">
              <span class="font-semibold text-sm dark:text-white">{{
                member.username
              }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{
                member.role
              }}</span>
            </div>
            <button
              class="ml-auto text-gray-500 dark:text-gray-400"
              @click="openMemberMenu(member)"
            >
              &#x22EE;
            </button>
          </li>
        </ul>
      </div>

      <!-- 文件共享 -->
      <div class="mt-4" v-if="sharedFiles.length > 0">
        <div class="flex">
          <h4 class="text-gray-500 dark:text-gray-400 font-medium">
            Shared Files
          </h4>
          <button
            @click="openAllFilesModal"
            class="ml-2 text-blue-500 dark:text-blue-400 text-sm"
          >
            View All Files
          </button>
        </div>
        <div
          v-for="file in displayedFiles"
          :key="file.id"
          class="flex items-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700 mt-2 cursor-pointer"
        >
          <div
            class="w-10 h-10 bg-blue-100 dark:bg-blue-900 flex items-center justify-center rounded-lg"
          >
            <font-awesome-icon
              :icon="getFileIcon(file.url)"
              :class="['w-12 h-12', getFileIconColor(file.url)]"
            />
          </div>
          <div class="ml-3 flex flex-col">
            <span class="text-sm font-medium dark:text-white">{{
              getFileName(file.url)
            }}</span>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{
              file.formattedTime
            }}</span>
          </div>
          <button
            class="ml-auto text-gray-500 dark:text-gray-400"
            @click="downloadFile(file.url, selectedGroupId)"
          >
            ⬇
          </button>
        </div>
      </div>

      <!-- 设置 -->
      <div class="mt-4" v-if="!isDisband">
        <div class="flex items-center justify-between mt-2">
          <span class="text-sm dark:text-gray-200">Mute Notifications</span>
          <label class="switch">
            <input
              type="checkbox"
              :checked="props.isMuted"
              @change="$emit('update:isMuted', $event.target.checked)"
            />
            <span class="slider dark:bg-gray-600"></span>
          </label>
        </div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-sm dark:text-gray-200">Pin Conversation</span>
          <label class="switch">
            <input
              type="checkbox"
              :checked="props.isPinned"
              @change="$emit('update:isPinned', $event.target.checked)"
            />
            <span class="slider dark:bg-gray-600"></span>
          </label>
        </div>
      </div>

      <!-- Pinned Messages Section -->
      <div class="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 class="text-gray-500 dark:text-gray-400 font-medium mb-2">
          Pinned Messages ({{ pinnedMessages?.length || 0 }})
        </h4>

        <div class="space-y-4">
          <div
            v-for="msg in pinnedMessages"
            :key="msg.id"
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
          >
            <!-- Message Header -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <img
                  :src="getUserAvatar(msg.senderId)"
                  class="w-6 h-6 rounded-full"
                />
                <span class="font-medium text-sm">{{
                  getUserName(msg.senderId)
                }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M9.293 1.293a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 4.414V13a1 1 0 11-2 0V4.414L7.707 5.707a1 1 0 01-1.414-1.414l3-3z"
                  />
                </svg>
                <button
                  v-if="isModeratorOrAdmin"
                  @click="unpinMessage(selectedGroupId, msg.id)"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Message Content -->
            <div class="text-sm">{{ msg.messageContent }}</div>

            <!-- Pinned By -->
            <div class="mt-2 text-xs text-gray-500">
              Pinned by {{ getUserName(msg.isPinned) || "admin" }}
            </div>
          </div>
        </div>
      </div>

      <!-- 弹窗组件 -->
      <AllMembersModal
        v-if="isAllMembersModalOpen"
        :members="members"
        @close="closeAllMembersModal"
        @member-click="handleMemberClick"
      />
      <AllFilesModal
        v-if="isAllFilesModalOpen"
        :files="sharedFiles"
        :group-id="selectedGroupId"
        @close="closeAllFilesModal"
      />
      <AddMemberModal
        v-if="isAddMemberModalOpen"
        :groupId="selectedGroupId"
        :pendingUsers="pendingUsers"
        :membersId="members.map((member) => member.id)"
        :pendingInvitedUsers="pendingInvitedUsers"
        @close="closeAddMemberModal"
        @add-member="handleAddMember"
        @approve-pending-user="approvePendingUser"
        @reject-pending-user="rejectPendingUser"
      />
    </div>
    <MemberMenu
      v-if="selectedMember"
      :member="selectedMember"
      :currentRole="currentRole"
      :chatroomId="selectedGroupId"
      @close="closeMemberMenu"
      @remove="handleRemoveMember"
      @mute="handleMuteMember"
    />
  </div>
</template>

<script setup>
import {
  ref as dbRef,
  query,
  orderByChild,
  equalTo,
  set,
  get,
  update,
  off,
  onValue,
} from "firebase/database";
import { db, auth } from "~/firebase/firebase.js";
import MemberMenu from "@/components/MemberMenu.vue";
import AddMemberModal from "@/components/GroupInfo/AddMemberModal.vue";
import { formatTime } from "@/utils/formatTime";
import { downloadFile } from "~/utils/fileEncryptionHelper";
import { useGroupApi } from "~/composables/useGroupApi";
const { unpinMessage } = useGroupApi();

const selectedMember = ref(null);
//const currentMember = ref(null);
const userId = ref(null);

const props = defineProps({
  members: Array,
  sharedFiles: Array,
  selectedGroupId: String,
  isMuted: Boolean,
  isPinned: Boolean,
  isDisband: Boolean,
  currentRole: String,
  pinnedMessages: Array,
});

const getUserAvatar = (userId) => {
  return props.members.find((member) => member?.id === userId)?.avatarUrl || "";
};

const getUserName = (userId) => {
  return props.members.find((member) => member?.id === userId)?.username || "";
};

const isModeratorOrAdmin = (userId) => {
  return (
    props.members.find((member) => member?.id === userId)?.role ===
      "moderator" ||
    props.members.find((member) => member?.id === userId)?.role === "admin"
  );
};

const emit = defineEmits(["update:isMuted", "update:isPinned", "back"]);

const isAddMemberModalOpen = ref(false);
const pendingUsers = ref([]);

// 打开添加成员弹窗
const openAddMemberModal = () => {
  isAddMemberModalOpen.value = true;
};

// 关闭添加成员弹窗
const closeAddMemberModal = () => {
  isAddMemberModalOpen.value = false;
};

const handleAddMember = async (userId) => {
  try {
    // 发送通知
    const now = Date.now();

    // 1. Save to users/{userId}/invitations/{groupId}
    const userInvitationRef = dbRef(
      db,
      `users/${userId}/invitations/${props.selectedGroupId}`
    );
    await set(userInvitationRef, {
      groupId: props.selectedGroupId,
      invitedAt: now,
    });

    const groupPendingRef = dbRef(
      db,
      `chatrooms/${props.selectedGroupId}/pendingInvitations/${userId}`
    );
    await set(groupPendingRef, {
      userId,
      requestedAt: now,
    });

    await sendNotification({
      userIds: [userId],
      title: "New Member Request",
      isSaveNotification: true,
      body: "You have a new member request",
      chatroomId: props.selectedGroupId,
      isSaveNotification: true,
    });
  } catch (error) {
    console.error("Error adding member:", error);
  }
};

let unsubscribePendingUsers = null;

const fetchPendingUsers = async (groupId) => {
  try {
    await auth.authStateReady();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    const pendingUsersRef = dbRef(db, `chatrooms/${groupId}/pending`);

    // 取消之前的监听（如果有）
    if (unsubscribePendingUsers) {
      off(pendingUsersRef, "value", unsubscribePendingUsers);
    }

    // 实时监听数据变化
    unsubscribePendingUsers = onValue(pendingUsersRef, async (snapshot) => {
      if (!snapshot.exists()) {
        pendingUsers.value = [];
        return;
      }

      const fetchUserDetails = async (userId, requestedAt) => {
        const userRef = dbRef(db, `users/${userId}`);
        const userSnap = await get(userRef);

        if (!userSnap.exists()) return null;

        const userData = userSnap.val();
        const avatarUrl = userData.avatarUrl || null;
        const username = userData.username || "Unknown";
        const showEmail = userData.advancedSettings?.showEmail ?? true;
        const email = showEmail ? userData.email || "anonymous" : "anonymous";

        return {
          id: userId,
          avatarUrl,
          username,
          email,
          requestedAt,
        };
      };

      const fetchPromises = [];

      snapshot.forEach((childSnapshot) => {
        const userId = childSnapshot.key;
        const requestedAt = childSnapshot.val() || null;
        fetchPromises.push(fetchUserDetails(userId, requestedAt));
      });

      const result = (await Promise.all(fetchPromises)).filter(Boolean);
      pendingUsers.value = result;
    });
  } catch (error) {
    console.error("Error fetching pending users:", error);
    throw error;
  }
};

let unsubscribePendingInvitations = null;

const pendingInvitedUsers = ref([]);

const listenToPendingInvitations = async (groupId) => {
  try {
    await auth.authStateReady();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated");

    const invitationsRef = dbRef(db, `chatrooms/${groupId}/pendingInvitations`);

    // 清除旧的监听（避免重复监听）
    if (unsubscribePendingInvitations) {
      off(invitationsRef, "value", unsubscribePendingInvitations);
    }

    // 设置新的实时监听
    unsubscribePendingInvitations = onValue(
      invitationsRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          pendingInvitedUsers.value = [];
          return;
        }

        const fetchUserDetails = async (userId, requestedAt) => {
          const userRef = dbRef(db, `users/${userId}`);
          const userSnap = await get(userRef);

          if (!userSnap.exists()) return null;

          const userData = userSnap.val();
          const avatarUrl = userData.avatarUrl || null;
          const username = userData.username || "Unknown";
          const showEmail = userData.advancedSettings?.showEmail ?? true;
          const email = showEmail ? userData.email || "anonymous" : "anonymous";

          return {
            id: userId,
            avatarUrl,
            username,
            email,
            requestedAt,
          };
        };

        const fetchPromises = [];

        snapshot.forEach((childSnapshot) => {
          const userId = childSnapshot.key;
          const requestedAt = childSnapshot.val()?.requestedAt || null;
          fetchPromises.push(fetchUserDetails(userId, requestedAt));
        });

        const result = (await Promise.all(fetchPromises)).filter(Boolean);
        pendingInvitedUsers.value = result;
      }
    );
  } catch (error) {
    console.error("Error listening to pending invitations:", error);
    throw error;
  }
};

onUnmounted(() => {
  if (unsubscribePendingUsers) {
    const ref1 = dbRef(db, `chatrooms/${props.selectedGroupId}/pending`);
    off(ref1, "value", unsubscribePendingUsers);
  }
  if (unsubscribePendingInvitations) {
    const ref2 = dbRef(
      db,
      `chatrooms/${props.selectedGroupId}/pendingInvitations`
    );
    off(ref2, "value", unsubscribePendingInvitations);
  }
});

const checkGroupAdmin = computed(() => {
  try {
    return props.currentRole === "admin" || props.currentRole === "moderator";
  } catch (error) {
    return false;
  }
});

watch(
  () => props.selectedGroupId,
  async () => {
    if (props.selectedGroupId && checkGroupAdmin.value) {
      await fetchPendingUsers(props.selectedGroupId);
      await listenToPendingInvitations(props.selectedGroupId);
    }
  }
);

const notifyMemberApproval = async (groupId, userId, approved) => {
  await sendNotification({
    userIds: [userId],
    title: approved ? "Join Request Approved" : "Join Request Rejected",
    body: approved
      ? "You've been added to the group"
      : "Your join request was declined",
    chatroomId: groupId,
    isSaveNotification: true,
  });
};

// 同意待处理用户
const approvePendingUser = async (userId) => {
  try {
    await approveMemberApi(props.selectedGroupId, userId);
    await notifyMemberApproval(props.selectedGroupId, userId, true);
    await writeActivityLog(
      props.selectedGroupId,
      auth.currentUser?.uid || "system",
      `${getUsername(userId) || "A user"} has joined the group`
    );
  } catch (error) {
    console.error("Error approving user:", error);
  }
};

// 拒绝待处理用户
const rejectPendingUser = async (userId) => {
  try {
    await rejectMemberApi(props.selectedGroupId, userId);
    await notifyMemberApproval(props.selectedGroupId, userId, false);
  } catch (error) {
    console.error("Error rejecting user:", error);
  }
};

const notifyMemberRemoval = async (groupId, memberId) => {
  await sendNotification({
    userIds: [memberId],
    title: "Removed from Group",
    body: "You've been removed from the group",
    chatroomId: groupId,
    isSaveNotification: true,
  });
};

//TO-DO:BACKEND
const handleRemoveMember = async (memberId) => {
  try {
    // await remove(dbRef(db, `chatroom_users/${chatroomUserPath}`));
    await removeMemberApi(props.selectedGroupId, memberId);
    await notifyMemberRemoval(props.selectedGroupId, memberId);

    await writeActivityLog(
      props.selectedGroupId,
      auth.currentUser?.uid || "system",
      `${await getUserName(auth.currentUser?.uid)} removed ${
        (await getUsername(memberId)) || "a member"
      } from the group`
    );

    // 可以在这里触发 UI 更新或显示成功提示
  } catch (error) {
    console.error("Error removing member:", error);
  }
};

const openMemberMenu = (member) => {
  selectedMember.value = member;
};

const closeMemberMenu = () => {
  selectedMember.value = null;
};

const displayedMembers = computed(() => props.members.slice(0, 5));
// const displayedFiles = computed(() => props.sharedFiles.slice(0, 5));

const displayedFiles = ref([]);

const formatFilesTime = async () => {
  const formattedFiles = props.sharedFiles.reverse().slice(0, 5);
  const formatted = await Promise.all(
    formattedFiles.map(async (file) => ({
      ...file,
      formattedTime: await formatTime(file.createdAt),
    }))
  );
  displayedFiles.value = formatted;
};

// 监听文件变化
watch(() => props.sharedFiles, formatFilesTime, { immediate: true });

const isAllMembersModalOpen = ref(false);
const isAllFilesModalOpen = ref(false);

const openAllMembersModal = () => {
  isAllMembersModalOpen.value = true;
};

const closeAllMembersModal = () => {
  isAllMembersModalOpen.value = false;
};

const openAllFilesModal = () => {
  isAllFilesModalOpen.value = true;
};

const closeAllFilesModal = () => {
  isAllFilesModalOpen.value = false;
};

const handleMemberClick = (member) => {
  selectedMember.value = member; // 设置选中的成员
  openMemberMenu(member); // 打开成员菜单
};

// const handleRemoveMember = async (memberId) => {
//   try {
//     // 假设 chatroomId 是当前群组的 ID
//     const chatroomId = "your-chatroom-id"; // 替换为实际的 chatroomId

//     // 构建文档路径
//     const chatroomUserDocRef = doc(
//       db,
//       "chatroom_user",
//       `${chatroomId}_${memberId}`
//     );

//     // 删除文档
//     await deleteDoc(chatroomUserDocRef);

//     // 可以在这里触发 UI 更新或显示成功提示
//   } catch (error) {
//     console.error("Error removing member:", error);
//     // 可以在这里显示错误提示
//   }
// };

const {
  approveMember: approveMemberApi,
  rejectMember: rejectMemberApi,
  removeMember: removeMemberApi,
  muteMember: muteMemberApi,
} = useGroupApi();

const handleMuteMember = async ({ memberId, isMuted }) => {
  try {
    await muteMemberApi(props.selectedGroupId, memberId, isMuted);

    // 发送通知
    await sendNotification({
      userIds: [memberId],
      title: isMuted ? "You Have Been Muted" : "You Have Been Unmuted",
      body: isMuted
        ? "You have been muted in the group"
        : "You have been unmuted in the group",
      chatroomId: props.selectedGroupId,
      isSaveNotification: true,
    });

    // 记录活动日志
    await writeActivityLog(
      props.selectedGroupId,
      auth.currentUser?.uid || "system",
      `${auth.currentUser?.displayName || "Admin"} has ${
        isMuted ? "muted" : "unmuted"
      } ${await getUsername(memberId)}`
    );
  } catch (error) {
    console.error("Error muting/unmuting member:", error);
  }
};
</script>

<style scoped>
/* Switch container */
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
}

/* Hide default checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* Slider (toggle button) */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 34px;
}

/* Small circle inside the toggle */
.slider:before {
  content: "";
  position: absolute;
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

/* When checkbox is checked */
input:checked + .slider {
  background-color: #4caf50;
}

/* Move the circle to the right when checked */
input:checked + .slider:before {
  transform: translateX(18px);
}
</style>
