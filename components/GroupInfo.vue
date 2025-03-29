<template>
  <div class="flex flex-col overflow-y-auto">
    <div class="p-4 mx-2 my-3 flex-grow">
      <!-- Group Info 标题 -->
      <h3 class="text-lg border-b-2 py-2 font-bold">Group Info</h3>

      <!-- 成员列表 -->
      <div class="mt-4">
        <div class="flex">
          <h4 class="text-gray-500 font-medium">
            Members ({{ members.length }})
          </h4>
          <!-- v-if="members.length > 5" -->
          <button
            @click="openAllMembersModal"
            class="ml-2 text-blue-500 text-sm"
          >
            View All Members
          </button>
          <button
            @click="openAddMemberModal"
            v-if="checkGroupAdmin"
            class="ml-2 text-blue-500 text-sm"
          >
            Add Members
          </button>
        </div>
        <ul>
          <li
            v-for="member in displayedMembers"
            :key="member.id"
            class="flex items-center py-2"
          >
            <!-- 头像 -->
            <img
              :src="member.avatarUrl"
              alt="avatar"
              class="w-10 h-10 rounded-full mr-3"
            />
            <div class="flex flex-col">
              <span class="font-semibold text-sm">{{ member.username }}</span>
              <span class="text-xs text-gray-500">{{ member.role }}</span>
            </div>
            <button
              class="ml-auto text-gray-500"
              @click="openMemberMenu(member)"
            >
              &#x22EE;
            </button>
          </li>
        </ul>
      </div>

      <!-- 文件共享 -->
      <div class="mt-4">
        <div class="flex">
          <h4 class="text-gray-500 font-medium">Shared Files</h4>
          <button @click="openAllFilesModal" class="ml-2 text-blue-500 text-sm">
            View All Files
          </button>
        </div>
        <div
          v-for="file in displayedFiles"
          :key="file.id"
          class="flex items-center p-2 rounded-lg bg-gray-100 mt-2 cursor-pointer"
        >
          <div
            class="w-10 h-10 bg-blue-100 flex items-center justify-center rounded-lg"
          >
            <font-awesome-icon
              :icon="getFileIcon(file.url)"
              :class="['w-12 h-12', getFileIconColor(file.url)]"
            />
          </div>
          <div class="ml-3 flex flex-col">
            <span class="text-sm font-medium">{{ getFileName(file.url) }}</span>
            <span class="text-xs text-gray-500">{{
              formatTime(file.createdAt)
            }}</span>
          </div>
          <button class="ml-auto text-gray-500" @click="downloadFile(file.url)">
            ⬇
          </button>
        </div>
      </div>

      <!-- 设置 -->
      <div class="mt-4">
        <div class="flex items-center justify-between mt-2">
          <span class="text-sm">Mute Notifications</span>
          <label class="switch">
            <input
              type="checkbox"
              :checked="props.isMuted"
              @change="$emit('update:isMuted', $event.target.checked)"
            />
            <span class="slider"></span>
          </label>
        </div>
        <span>{{ checkGroupAdmin }}dd{{ currentRole }}</span>
        <div class="flex items-center justify-between mt-2">
          <span class="text-sm">Pin Conversation</span>
          <label class="switch">
            <input
              type="checkbox"
              :checked="props.isPinned"
              @change="$emit('update:isPinned', $event.target.checked)"
            />
            <span class="slider"></span>
          </label>
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
        @close="closeAllFilesModal"
      />
      <AddMemberModal
        v-if="isAddMemberModalOpen"
        :groupId="selectedGroupId"
        :pendingUsers="pendingUsers"
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
      :currentUserId="userId"
      @close="closeMemberMenu"
      @remove="handleRemoveMember"
    />
  </div>
</template>

<script setup>
import {
  ref as dbRef,
  query,
  orderByChild,
  equalTo,
  get,
  update,
  remove,
} from "firebase/database";
import { db } from "~/firebase/firebase.js";
import MemberMenu from "@/components/MemberMenu.vue";
import AddMemberModal from "@/components/GroupInfo/AddMemberModal.vue";
import { formatTime } from "@/utils/formatTime";

const selectedMember = ref(null);
//const currentMember = ref(null);
const userId = ref(null);

const props = defineProps({
  members: Array,
  sharedFiles: Array,
  selectedGroupId: String,
  isMuted: Boolean,
  isPinned: Boolean,
  currentRole: String,
});

defineEmits(["update:isMuted", "update:isPinned"]);

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

const { sendNotification } = useNotification();

const handleAddMember = async (userId) => {
  try {
    // 发送通知
    await sendNotification({
      userId: userId, // 替换为实际用户ID
      isSaveNotification: true,
      notification: {
        title: "New Member Request",
        body: "You have a new member request",
        chatroomId: selectedGroupId,
      },
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

const fetchPendingUsers = async (groupId) => {
  try {
    // 1. 验证用户认证状态
    await auth.authStateReady();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // 2. 检查当前用户是否是群组管理员
    const isAdmin = await checkGroupAdmin(currentUser.uid, groupId);
    if (!isAdmin) {
      throw new Error("Permission denied: User is not group admin");
    }

    // 3. 构造查询条件
    const pendingStatusQuery = `${groupId}_pending`;
    const pendingUsersQuery = query(
      dbRef(db, "chatroom_users"),
      orderByChild("chatroomId_role"),
      equalTo(pendingStatusQuery)
    );

    // 4. 执行查询
    const snapshot = await get(pendingUsersQuery);
    if (!snapshot.exists()) {
      return []; // 没有待处理用户
    }

    // 5. 提取待处理用户ID
    const pendingRequests = [];
    snapshot.forEach((childSnapshot) => {
      const requestData = childSnapshot.val();
      pendingRequests.push({
        requestId: childSnapshot.key,
        userId: requestData.userId,
        requestedAt: requestData.requestedAt || null,
        // 可以添加其他需要的请求元数据
      });
    });

    // 6. 批量获取用户信息（优化性能）
    const userIds = pendingRequests.map((req) => req.userId);
    const usersInfo = await batchGetUsersInfo(userIds);

    // 7. 合并请求数据和用户信息
    const result = pendingRequests.map((request) => ({
      ...request,
      userInfo: usersInfo[request.userId] || null,
    }));

    return result.filter((item) => item.userInfo !== null); // 过滤掉无效用户
  } catch (error) {
    console.error("Error fetching pending users:", {
      error: error.message,
      groupId,
      user: auth.currentUser?.uid,
    });
    throw error; // 重新抛出错误供调用方处理
  }
};

const checkGroupAdmin = computed(() => {
  try {
    return props.currentRole === "admin" || props.currentRole === "moderator";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
});

watch(
  () => checkGroupAdmin.value,
  async () => {
    if (checkGroupAdmin.value) {
      await fetchPendingUsers();
    }
  }
);

/**
 * 批量获取用户基本信息
 */
const batchGetUsersInfo = async (userIds) => {
  if (!userIds.length) return {};

  try {
    const usersRef = dbRef(db, "users");
    const snapshot = await get(usersRef);

    const result = {};
    userIds.forEach((uid) => {
      if (snapshot.child(uid).exists()) {
        const userData = snapshot.child(uid).val();
        result[uid] = {
          displayName: userData.displayName || "Unknown User",
          photoURL: userData.photoURL || DEFAULT_AVATAR,
          email: userData.email || "",
          // 其他公开可用的用户信息
        };
      }
    });
    return result;
  } catch (error) {
    console.error("Error batch fetching users:", error);
    return {};
  }
};

// 同意待处理用户
const approvePendingUser = async (userId) => {
  try {
    await update(dbRef(db, `chatroom_users/${userId}`), {
      role: "user", // 将 role 改为 user
    });
    fetchPendingUsers(); // 刷新待处理用户列表
  } catch (error) {
    console.error("Error approving user:", error);
  }
};

// 拒绝待处理用户
const rejectPendingUser = async (userId) => {
  try {
    await remove(dbRef(db, `chatroom_users/${userId}`));
    fetchPendingUsers(); // 刷新待处理用户列表
  } catch (error) {
    console.error("Error rejecting user:", error);
  }
};

const handleRemoveMember = async (memberId) => {
  try {
    const chatroomId = selectedGroupId;
    const chatroomUserPath = `${chatroomId}_${memberId}`;

    // 删除成员记录
    await remove(dbRef(db, `chatroom_users/${chatroomUserPath}`));

    // 可以在这里触发 UI 更新或显示成功提示
  } catch (error) {
    console.error("Error removing member:", error);
    // 可以在这里显示错误提示
  }
};
// 获取待处理用户
// const fetchPendingUsers = async () => {
//   try {
//     const chatroomUsersQuery = query(
//       collection(db, "chatroom_user"),
//       where("chatroomId", "==", props.selectedGroupId),
//       where("role", "==", "pending")
//     );
//     const chatroomUsersSnapshot = await getDocs(chatroomUsersQuery);

//     pendingUsers.value = [];
//     for (const docSnapshot of chatroomUsersSnapshot.docs) {
//       const userDoc = await getDoc(doc(db, "users", docSnapshot.data().userId));
//       if (userDoc.exists()) {
//         pendingUsers.value.push({
//           id: docSnapshot.id,
//           ...userDoc.data(),
//         });
//       }
//     }
//   } catch (error) {
//     console.error("Error fetching pending users:", error);
//   }
// };

// // 同意待处理用户
// const approvePendingUser = async (userId) => {
//   try {
//     await updateDoc(doc(db, "chatroom_user", userId), {
//       role: "user", // 将 role 改为 user
//     });
//     fetchPendingUsers(); // 刷新待处理用户列表
//   } catch (error) {
//     console.error("Error approving user:", error);
//   }
// };

// // 拒绝待处理用户
// const rejectPendingUser = async (userId) => {
//   try {
//     await deleteDoc(doc(db, "chatroom_user", userId));
//     fetchPendingUsers(); // 刷新待处理用户列表
//   } catch (error) {
//     console.error("Error rejecting user:", error);
//   }
// };

const openMemberMenu = (member) => {
  selectedMember.value = member;
};

const closeMemberMenu = () => {
  selectedMember.value = null;
};

const displayedMembers = computed(() => props.members.slice(0, 5));
const displayedFiles = computed(() => props.sharedFiles.slice(0, 5));

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

const downloadFile = (url) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = url.split("/").pop();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
