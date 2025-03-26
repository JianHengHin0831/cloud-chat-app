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
import { ref, computed } from "vue";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "~/firebase/firebase.js";
import MemberMenu from "@/components/MemberMenu.vue";
import AddMemberModal from "@/components/GroupInfo/AddMemberModal.vue";
import { formatTime } from "@/utils/formatTime";
import { getFileIcon, getFileName, getFileIconColor } from "@/utils/fileUtils";

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

const handleAddMember = async (userId) => {
  try {
    // 获取用户的FCM token
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;

      if (fcmToken) {
        // 发送通知给新成员
        await sendNotification(
          userId,
          "Group Invitation",
          "You have been added to a new group"
        );
      }
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
// 获取待处理用户
const fetchPendingUsers = async () => {
  try {
    const chatroomUsersQuery = query(
      collection(db, "chatroom_user"),
      where("chatroomId", "==", props.selectedGroupId),
      where("role", "==", "pending")
    );
    const chatroomUsersSnapshot = await getDocs(chatroomUsersQuery);

    pendingUsers.value = [];
    for (const docSnapshot of chatroomUsersSnapshot.docs) {
      const userDoc = await getDoc(doc(db, "users", docSnapshot.data().userId));
      if (userDoc.exists()) {
        pendingUsers.value.push({
          id: docSnapshot.id,
          ...userDoc.data(),
        });
      }
    }
  } catch (error) {
    console.error("Error fetching pending users:", error);
  }
};

// 同意待处理用户
const approvePendingUser = async (userId) => {
  try {
    await updateDoc(doc(db, "chatroom_user", userId), {
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
    await deleteDoc(doc(db, "chatroom_user", userId));
    fetchPendingUsers(); // 刷新待处理用户列表
  } catch (error) {
    console.error("Error rejecting user:", error);
  }
};

onMounted(() => {
  fetchPendingUsers();
});

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

const handleRemoveMember = async (memberId) => {
  try {
    // 假设 chatroomId 是当前群组的 ID
    const chatroomId = "your-chatroom-id"; // 替换为实际的 chatroomId

    // 构建文档路径
    const chatroomUserDocRef = doc(
      db,
      "chatroom_user",
      `${chatroomId}_${memberId}`
    );

    // 删除文档
    await deleteDoc(chatroomUserDocRef);

    // 可以在这里触发 UI 更新或显示成功提示
  } catch (error) {
    console.error("Error removing member:", error);
    // 可以在这里显示错误提示
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
