<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md shadow-xl"
    >
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold dark:text-white">Member Details</h2>
        <button
          @click="$emit('close')"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <Icon icon="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <!-- 成员信息 -->
      <div class="space-y-5">
        <!-- User Avatar and Name -->
        <div class="flex items-center space-x-4">
          <div
            class="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700"
          >
            <img
              :src="userData?.avatarUrl || '/images/user_avatar.png'"
              alt="User Avatar"
              class="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ member.username }}
            </h3>
            <div class="flex items-center mt-1">
              <span
                class="w-2.5 h-2.5 rounded-full mr-2"
                :class="
                  userData?.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                "
              ></span>
              <span class="text-sm text-gray-600 dark:text-gray-300">
                {{ userData?.status === "online" ? "Online" : "Offline" }}
              </span>
            </div>
          </div>
        </div>

        <!-- Bio -->
        <div v-if="userData?.advancedSettings?.bio">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bio
          </h4>
          <p
            class="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
          >
            {{ userData.advancedSettings.bio }}
          </p>
        </div>

        <!-- Status -->
        <div v-if="userData?.advancedSettings?.status">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </h4>
          <div class="flex items-center">
            <span
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
              :class="{
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
                  userData.advancedSettings.status === 'available',
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200':
                  userData.advancedSettings.status === 'away',
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200':
                  userData.advancedSettings.status === 'do-not-disturb',
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200':
                  userData.advancedSettings.status === 'busy',
              }"
            >
              {{ formatStatus(userData.advancedSettings.status) }}
            </span>
          </div>
        </div>

        <!-- Last Active -->
        <div v-if="userData?.lastActive">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Last Active
          </h4>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ userData.formattedLastActive }}
          </p>
        </div>

        <!-- Email -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </h4>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ userData?.email }}
          </p>
        </div>

        <!-- Joined At -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Joined Group
          </h4>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ member.formattedJoinedTime }}
          </p>
        </div>

        <!-- Common Groups -->
        <div v-if="commonGroups.length > 0">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Common Groups
          </h4>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="group in commonGroups"
              :key="group.id"
              class="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-lg"
            >
              <img
                :src="group.photoUrl"
                :alt="group.name"
                class="w-6 h-6 rounded-lg object-cover"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{
                group.name
              }}</span>
            </div>
            <span
              v-if="totalCommonGroups > 3"
              class="text-sm text-gray-500 dark:text-gray-400"
            >
              and {{ totalCommonGroups - 3 }} other groups
            </span>
          </div>
        </div>

        <!-- User ID (for admins) -->
        <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
          <details class="text-xs">
            <summary
              class="text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
            >
              Technical Details
            </summary>
            <p
              class="mt-1 text-gray-500 dark:text-gray-400 font-mono break-all"
            >
              ID: {{ member.id }}
            </p>
          </details>
        </div>
      </div>

      <!-- 关闭按钮 -->
      <button
        @click="$emit('close')"
        class="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
      >
        Close
      </button>
    </div>
  </div>
</template>

<script setup>
import { formatTime as formatTimeFromUtils } from "@/utils/formatTime";
import { ref, onMounted, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import { ref as dbRef, get } from "firebase/database";
import { db } from "~/firebase/firebase.js";
import { auth } from "~/firebase/firebase.js";

const props = defineProps({
  member: Object, // 成员信息
  chatroomId: String,
});

const emit = defineEmits(["close"]);

// 用户数据
const userData = ref(null);
const commonGroups = ref([]);
const totalCommonGroups = ref(0);

// 获取用户数据
const fetchUserData = async () => {
  try {
    const userRef = dbRef(db, `users/${props.member.id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) return;

    // 1. 基础公开字段（所有人可见）
    const publicData = {
      username: snapshot.child("username").val() || "",
      avatarUrl: snapshot.child("avatarUrl").val() || "/images/user_avatar.png",
    };

    // 2. 根据隐私设置获取受限字段
    const advancedSettings = snapshot.child("advancedSettings").val() || {};

    // 2.1 邮箱处理
    if (advancedSettings.showEmail) {
      publicData.email = snapshot.child("email").val() || "anonymous";
    } else {
      publicData.email = "anonymous";
    }

    // 2.2 活动状态处理
    if (advancedSettings.activityVisibility === "everyone") {
      publicData.status = snapshot.child("status").val() || "offline";
      publicData.lastActive = snapshot.child("lastActive").val() || null;

      // 仅当用户允许显示详细状态时
      if (advancedSettings.showExactTime !== false) {
        publicData.advancedSettings = {
          bio: snapshot.child("advancedSettings/bio").val(),
          status: snapshot.child("advancedSettings/status").val(),
        };
      }
    }

    userData.value = publicData;

    // 获取加入时间
    const joinedAtRef = dbRef(
      db,
      `chatroom_users/${props.chatroomId}/${props.member.id}/joinedAt`
    );
    const joinedAtSnapshot = await get(joinedAtRef);
    if (joinedAtSnapshot.exists()) {
      props.member.joinedAt = joinedAtSnapshot.val();
    }

    // 获取共同群组
    await fetchCommonGroups();
  } catch (error) {
    console.error("获取用户数据失败:", error);
    userData.value = null;
  }
};

// 获取共同群组
const fetchCommonGroups = async () => {
  try {
    // 获取当前用户的所有群组
    const currentUserChatroomsRef = dbRef(
      db,
      `user_chatrooms/${auth.currentUser.uid}`
    );
    const currentUserChatroomsSnapshot = await get(currentUserChatroomsRef);

    if (!currentUserChatroomsSnapshot.exists()) {
      return;
    }

    // 获取当前用户的所有群组ID
    const currentUserGroups = Object.keys(currentUserChatroomsSnapshot.val());

    // 检查每个群组中是否存在目标用户
    const checkPromises = currentUserGroups
      .filter((groupId) => groupId !== props.chatroomId) // 排除当前群组
      .map(async (groupId) => {
        const targetUserInGroupRef = dbRef(
          db,
          `chatroom_users/${groupId}/${props.member.id}`
        );
        const targetUserInGroupSnapshot = await get(targetUserInGroupRef);

        if (targetUserInGroupSnapshot.exists()) {
          // 如果用户在这个群组中，获取群组信息
          const groupRef = dbRef(db, `chatrooms/${groupId}`);
          const groupSnapshot = await get(groupRef);
          if (groupSnapshot.exists()) {
            const groupData = groupSnapshot.val();
            return {
              id: groupId,
              name: groupData.name,
              photoUrl: groupData.photoUrl || "/images/group.png",
            };
          }
        }
        return null;
      });

    const results = await Promise.all(checkPromises);
    const validGroups = results.filter((group) => group !== null);

    totalCommonGroups.value = validGroups.length;
    commonGroups.value = validGroups.slice(0, 3); // 只显示前三个群组
  } catch (error) {
    console.error("获取共同群组失败:", error);
  }
};

// 根据隐私设置计算是否显示活动状态
const canShowActivity = computed(() => {
  if (!userData.value || !userData.value.advancedSettings) return false;

  const { activityVisibility } = userData.value.advancedSettings;
  return activityVisibility === "everyone";
});

// 计算是否显示在线状态
const canShowOnlineStatus = computed(() => {
  if (!canShowActivity.value) return false;
  return userData.value?.advancedSettings?.isOnline !== false;
});

// 计算是否显示最后活跃时间
const canShowLastActive = computed(() => {
  if (!canShowOnlineStatus.value) return false;
  return userData.value?.advancedSettings?.showExactTime !== false;
});

// 计算是否显示邮箱
const canShowEmail = computed(() => {
  if (!userData.value || !userData.value.advancedSettings) return false;
  return userData.value.advancedSettings.showEmail === true;
});

// 格式化状态文本
const formatStatus = (status) => {
  switch (status) {
    case "available":
      return "Available";
    case "away":
      return "Away";
    case "do-not-disturb":
      return "Do Not Disturb";
    case "busy":
      return "Busy";
    default:
      return status;
  }
};

// 格式化时间
const formatTime = async (timestamp) => {
  if (!timestamp) return "";
  return await formatTimeFromUtils(timestamp);
};

// 格式化加入时间
const formatJoinedTime = async () => {
  if (props.member.joinedAt) {
    props.member.formattedJoinedTime = await formatTimeFromUtils(
      props.member.joinedAt
    );
  }
};

// 格式化最后活跃时间
const formatLastActiveTime = async () => {
  if (userData.value?.lastActive) {
    userData.value.formattedLastActive = await formatTimeFromUtils(
      userData.value.lastActive
    );
  }
};

// 监听数据变化并更新时间
watch(() => props.member.joinedAt, formatJoinedTime, { immediate: true });
watch(() => userData.value?.lastActive, formatLastActiveTime, {
  immediate: true,
});

// 组件挂载时获取用户数据
onMounted(() => {
  fetchUserData();
});
</script>
