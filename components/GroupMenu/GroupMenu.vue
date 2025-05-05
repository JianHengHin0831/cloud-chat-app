<template>
  <div class="relative">
    <!-- Menu Button -->
    <button
      @click="toggleMenu"
      class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
    >
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
          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
        />
      </svg>
    </button>

    <!-- Menu Options -->
    <div
      v-if="isMenuOpen"
      class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-100 dark:border-gray-700 overflow-hidden"
    >
      <ul class="divide-y divide-gray-100 dark:divide-gray-700">
        <!-- View Group Details (Always visible) -->
        <li>
          <button
            @click="openViewGroupDetails"
            class="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            View Group Details
          </button>
        </li>

        <!-- Only show other options if group is not disbanded -->
        <li v-if="!isAdmin">
          <button
            @click="openLeaveGroup"
            class="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-150"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Leave Group
          </button>
        </li>
        <template v-if="!groupData.isDisband">
          <!-- Update Group Details (Admin only) -->
          <li v-if="isAdmin">
            <button
              @click="openUpdateGroupDetails"
              class="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Update Group Details
            </button>
          </li>

          <!-- Disband Group (Admin only) -->
          <li v-if="isAdmin">
            <button
              @click="openDisbandGroup"
              class="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-150"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Disband Group
            </button>
          </li>

          <!-- Global Mute (Admin only) -->
          <li v-if="isAdmin">
            <button
              @click="handleGlobalMuteClick(true)"
              class="flex items-center w-full px-4 py-3 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors duration-150"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                class="h-5 w-5 mr-3 text-red-500 dark:text-red-400"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M407.5,307.6c5.7-16.6,8.5-34.1,8.5-51.6v-32c0-8.8-7.2-16-16-16s-16,7.2-16,16v32
      c0,8.8-0.9,17.3-2.6,25.6L407.5,307.6z M326.8,362.7c-58.9,39.1-138.3,23-177.4-35.8c-13.9-21-21.4-45.6-21.4-70.8v-32
      c0-8.8-7.2-16-16-16s-16,7.2-16,16v32c0,82.2,62.2,151,144,159.2V480h-96c-8.8,0-16,7.2-16,16c0,8.9,7.2,16,16,16h224
      c8.8,0,16-7.1,16-16c0-8.8-7.2-16-16-16h-96v-64.8c28.1-2.8,54.9-13,77.7-29.5L326.8,362.7z M352,252.2V96.1
      c0-53-42.9-96-95.9-96.1c-41.2,0-77.8,26.2-91,65.2L352,252.2z M160,195.9l143.5,143.5c-46,26.3-104.7,10.2-130.9-35.8
      c-8.2-14.5-12.6-30.9-12.6-47.6V195.9z M436.6,427.3l-384-384l22.7-22.6l384,384L436.6,427.3z"
                />
              </svg>

              Mute All Members
            </button>
          </li>
          <li v-if="isAdmin">
            <button
              @click="handleGlobalMuteClick(false)"
              class="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>

              Unmute All Members
            </button>
          </li>
        </template>
        <template v-else>
          <li v-if="isAdmin">
            <button
              @click="handleDeleteGroupContent"
              class="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors duration-150"
            >
              <Icon icon="lucide:trash-2" class="w-4 h-4 mr-2" />
              Delete All Group Content
            </button>
          </li>
        </template>
      </ul>
    </div>
  </div>

  <!-- Modal Components (unchanged) -->
  <ViewGroupDetails
    v-if="isViewGroupDetailsOpen"
    :groupData="groupData"
    @close="closeViewGroupDetails"
  />
  <ScheduledMessagesModal
    v-if="isScheduledMessagesOpen"
    :groupId="selectedGroupId"
    :groupData="groupData"
    @close="closeScheduledMessages"
  />
  <UpdateGroupDetails
    v-if="isUpdateGroupDetailsOpen"
    :groupData="groupData"
    @close="closeUpdateGroupDetails"
  />
  <DisbandGroup
    v-if="isDisbandGroupOpen"
    :groupId="selectedGroupId"
    @close="closeDisbandGroup"
  />
  <LeaveGroup
    v-if="isLeaveGroupOpen"
    :groupId="selectedGroupId"
    @close="closeLeaveGroup"
  />

  <!-- Confirmation Modal -->
  <ConfirmationModal
    v-if="showGlobalMuteConfirmation"
    :title="!isMuteAction ? 'Unmute All Members' : 'Mute All Members'"
    :message="
      !isMuteAction
        ? 'Are you sure you want to unmute all members?'
        : 'Are you sure you want to mute all members?'
    "
    @close="showGlobalMuteConfirmation = false"
    @confirm="confirmGlobalMute"
  />
  <ConfirmationModal
    v-if="showDeleteContentConfirmation"
    title="Delete All Content?"
    message="Are you sure you want to delete ALL messages and activity logs for this group? This action cannot be undone."
    confirmButtonText="Delete"
    confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
    @close="showDeleteContentConfirmation = false"
    @confirm="confirmDeleteGroupContent"
  />
</template>

<script setup>
import ViewGroupDetails from "~/components/GroupMenu/ViewGroupDetails.vue";
import UpdateGroupDetails from "~/components/GroupMenu/UpdateGroupDetails1.vue";
import DisbandGroup from "~/components/GroupMenu/DisbandGroup.vue";
import LeaveGroup from "~/components/GroupMenu/LeaveGroup.vue";
import ScheduledMessagesModal from "~/components/GroupMenu/ScheduledMessagesModal.vue";
import ConfirmationModal from "../GroupInfo/ConfirmationModal.vue";
import { auth } from "~/firebase/firebase.js";
import { ref, computed } from "vue";
import { useGroupApi } from "~/composables/useGroupApi";
import { logEvent, trackMetric } from "~/utils/logging";
import { sendNotification } from "~/utils/sendNotification";
import { writeActivityLog } from "~/utils/activityLog";
import { Icon } from "@iconify/vue";
import { ref as dbRef, remove } from "firebase/database";
import { db } from "~/firebase/firebase.js";

const props = defineProps({
  selectedGroupId: String,
  groupData: Object,
  membersData: Array,
  isCurrentUserAdmin: Boolean,
});

const isMenuOpen = ref(false);
const isViewGroupDetailsOpen = ref(false);
const isUpdateGroupDetailsOpen = ref(false);
const isDisbandGroupOpen = ref(false);
const isLeaveGroupOpen = ref(false);
const isScheduledMessagesOpen = ref(false);
const showGlobalMuteConfirmation = ref(false);
const showDeleteContentConfirmation = ref(false);

const isAdmin = computed(() => {
  const currentUser = auth.currentUser;
  const currentMember = props.membersData?.find(
    (m) => m.id === currentUser?.uid
  );
  return currentMember?.role === "admin";
});

const emit = defineEmits(["toggleMenu"]);
const { muteAllMembers, muteMember: muteMemberApi } = useGroupApi();

const openLeaveGroup = () => {
  logEvent("open_leave_group_modal", {
    groupId: props.selectedGroupId,
    userId: auth.currentUser?.uid,
    groupName: props.groupData.name,
    timestamp: new Date().toISOString(),
  });
  isLeaveGroupOpen.value = true;
  isMenuOpen.value = false;
};

// Close Leave Group pop-up window
const closeLeaveGroup = () => {
  isLeaveGroupOpen.value = false;
};

//Open/Close Menu
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  if (isMenuOpen.value) {
    logEvent("open_group_menu", {
      groupId: props.selectedGroupId,
      userId: auth.currentUser?.uid,
      groupName: props.groupData.name,
      timestamp: new Date().toISOString(),
    });
    trackMetric("open_group_menu_count", 1);
  }
};

//Open View Group Details pop-up window
const openViewGroupDetails = () => {
  logEvent("open_view_group_details_modal", {
    groupId: props.selectedGroupId,
    userId: auth.currentUser?.uid,
    groupName: props.groupData.name,
    timestamp: new Date().toISOString(),
  });
  isViewGroupDetailsOpen.value = true;
  isMenuOpen.value = false;
};

//Close View Group Details pop-up window
const closeViewGroupDetails = () => {
  isViewGroupDetailsOpen.value = false;
};

// Open Update Group Details pop-up window
const openUpdateGroupDetails = () => {
  logEvent("open_update_group_details_modal", {
    groupId: props.selectedGroupId,
    userId: auth.currentUser?.uid,
    groupName: props.groupData.name,
    timestamp: new Date().toISOString(),
  });
  isUpdateGroupDetailsOpen.value = true;
  isMenuOpen.value = false;
};

// Close Update Group Details pop-up window
const closeUpdateGroupDetails = () => {
  isUpdateGroupDetailsOpen.value = false;
};

// Open the Disband Group pop-up window
const openDisbandGroup = () => {
  logEvent("open_disband_group_modal", {
    groupId: props.selectedGroupId,
    userId: auth.currentUser?.uid,
    groupName: props.groupData.name,
    timestamp: new Date().toISOString(),
  });
  isDisbandGroupOpen.value = true;
  isMenuOpen.value = false;
};

// Close Disband Group pop-up window
const closeDisbandGroup = () => {
  isDisbandGroupOpen.value = false;
};

// Open Scheduled Messages pop-up window
const openScheduledMessages = () => {
  logEvent("open_scheduled_messages_modal", {
    groupId: props.selectedGroupId,
    userId: auth.currentUser?.uid,
    groupName: props.groupData.name,
    timestamp: new Date().toISOString(),
  });
  isScheduledMessagesOpen.value = true;
  isMenuOpen.value = false;
};

//Close Scheduled Messages pop-up window
const closeScheduledMessages = () => {
  isScheduledMessagesOpen.value = false;
};

const isMuteAction = ref(false);
const handleGlobalMuteClick = (isMute) => {
  logEvent("open_global_mute_confirmation", {
    groupId: props.selectedGroupId,
    userId: auth.currentUser?.uid,
    groupName: props.groupData.name,
    currentMuteState: props.groupData.isGlobalMuted,
    timestamp: new Date().toISOString(),
  });
  isMuteAction.value = isMute;
  showGlobalMuteConfirmation.value = true;
};

const confirmGlobalMute = async () => {
  const startTime = Date.now();
  const action = isMuteAction.value;

  if (action === null) {
    return;
  }
  try {
    for (const member of props.membersData) {
      if (member.id === auth.currentUser?.uid && action == true) continue;
      await muteMemberApi(props.selectedGroupId, member.id, action);
    }
    await muteAllMembers(props.selectedGroupId, action);

    await writeActivityLog(
      props.selectedGroupId,
      auth.currentUser?.uid || "system",
      `${auth.currentUser?.displayName || "Admin"} has ${
        action ? "muted" : "unmuted"
      } all members`
    );

    await sendNotification({
      groupId: props.selectedGroupId,
      title: props.groupData.isGlobalMuted ? "Group Unmuted" : "Group Muted",
      body: `${props.groupData.name} has been ${
        props.groupData.isGlobalMuted ? "unmuted" : "muted"
      } by ${auth.currentUser?.displayName || "the admin"}`,
      chatroomId: props.selectedGroupId,
      isSaveNotification: true,
      excludeMuted: false,
    });

    logEvent("global_mute_success", {
      groupId: props.selectedGroupId,
      userId: auth.currentUser?.uid,
      groupName: props.groupData.name,
      newMuteState: !props.groupData.isGlobalMuted,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });

    trackMetric("global_mute_duration", Date.now() - startTime);
    trackMetric("global_mute_success_count", 1);

    showGlobalMuteConfirmation.value = false;
    isMenuOpen.value = false;
    isMuteAction.value = false;
  } catch (error) {
    console.error("Error toggling global mute:", error);

    logEvent("global_mute_failure", {
      groupId: props.selectedGroupId,
      userId: auth.currentUser?.uid,
      groupName: props.groupData.name,
      error: error.message,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });

    trackMetric("global_mute_failure_count", 1);
  }
};

const handleDeleteGroupContent = () => {
  logEvent("open_delete_group_content_confirmation", {
    groupId: props.selectedGroupId,
    userId: auth.currentUser?.uid,
    groupName: props.groupData?.name,
    timestamp: new Date().toISOString(),
  });

  showDeleteContentConfirmation.value = true;
  isMenuOpen.value = false;
};

const confirmDeleteGroupContent = async () => {
  showDeleteContentConfirmation.value = false;

  if (!isAdmin.value) {
    console.error("Permission denied: Only admins can delete group content.");
    logEvent("delete_group_content_permission_denied", {
      groupId: props.selectedGroupId,
      userId: auth.currentUser?.uid,
      groupName: props.groupData?.name,
    });
    return;
  }

  const startTime = Date.now();
  const groupId = props.selectedGroupId;
  const userId = auth.currentUser?.uid;
  const groupName = props.groupData?.name || "Unknown Group";

  logEvent("delete_group_content_attempt", {
    groupId,
    userId,
    groupName,
    timestamp: new Date().toISOString(),
  });

  try {
    await writeActivityLog(
      groupId,
      userId,
      `${
        auth.currentUser?.displayName || "Admin"
      } initiated deletion of all group messages and activity logs.`
    );

    const messagesRef = dbRef(db, `chatrooms/${groupId}/messages`);
    const activityLogsRef = dbRef(db, `chatrooms/${groupId}/activity_logs`);

    await remove(messagesRef);
    await remove(activityLogsRef);

    const duration = Date.now() - startTime;
    logEvent("delete_group_content_success", {
      groupId,
      userId,
      groupName,
      duration,
      timestamp: new Date().toISOString(),
    });
    trackMetric("delete_group_content_duration", duration, {
      group_id: groupId,
    });
    trackMetric("delete_group_content_success_count", 1, { group_id: groupId });

    console.log("Group messages and activity logs have been deleted.");
  } catch (error) {
    console.error("Error deleting group content:", error);
    const duration = Date.now() - startTime;
    logEvent("delete_group_content_failure", {
      groupId,
      userId,
      groupName,
      error: error.message,
      duration,
      timestamp: new Date().toISOString(),
    });
    trackMetric("delete_group_content_failure_count", 1, { group_id: groupId });

    console.error("Failed to delete group content. Please try again.");
  }
};
</script>
