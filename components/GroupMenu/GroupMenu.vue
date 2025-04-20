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
          <!-- Scheduled Messages -->
          <li>
            <button
              @click="openScheduledMessages"
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Scheduled Messages
            </button>
          </li>

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
              @click="handleGlobalMuteClick"
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
              {{
                groupData.isGlobalMuted
                  ? "Unmute All Members"
                  : "Mute All Members"
              }}
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
    :title="groupData.isGlobalMuted ? 'Unmute All Members' : 'Mute All Members'"
    :message="
      groupData.isGlobalMuted
        ? 'Are you sure you want to unmute all members?'
        : 'Are you sure you want to mute all members?'
    "
    @close="showGlobalMuteConfirmation = false"
    @confirm="confirmGlobalMute"
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

const props = defineProps({
  selectedGroupId: String,
  groupData: Object,
  membersData: Array,
});

const isMenuOpen = ref(false);
const isViewGroupDetailsOpen = ref(false);
const isUpdateGroupDetailsOpen = ref(false);
const isDisbandGroupOpen = ref(false);
const isLeaveGroupOpen = ref(false);
const isScheduledMessagesOpen = ref(false);
const showGlobalMuteConfirmation = ref(false);

const isAdmin = computed(() => {
  const currentUser = auth.currentUser;
  const currentMember = props.membersData?.find(
    (m) => m.id === currentUser?.uid
  );
  return currentMember?.role === "admin";
});

const emit = defineEmits(["toggleMenu"]);
const { muteAllMembers } = useGroupApi();

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

const handleGlobalMuteClick = () => {
  logEvent("open_global_mute_confirmation", {
    groupId: props.selectedGroupId,
    userId: auth.currentUser?.uid,
    groupName: props.groupData.name,
    currentMuteState: props.groupData.isGlobalMuted,
    timestamp: new Date().toISOString(),
  });
  showGlobalMuteConfirmation.value = true;
};

const confirmGlobalMute = async () => {
  const startTime = Date.now();
  try {
    await muteAllMembers(props.selectedGroupId, !props.groupData.isGlobalMuted);

    await writeActivityLog(
      props.selectedGroupId,
      auth.currentUser?.uid || "system",
      `${auth.currentUser?.displayName || "Admin"} has ${
        props.groupData.isGlobalMuted ? "unmuted" : "muted"
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
</script>
