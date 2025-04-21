<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <SeoMeta
      :title="title"
      :description="description"
      image="/images/home-og.png"
      keywords="Chat room, real time, cloud application, chat application"
    />
    <!-- Header (Fixed) -->
    <Header
      class="h-16 flex-shrink-0 md:flex"
      :class="{ hidden: selectedGroupId }"
    />

    <div
      class="hidden flex-1 md:grid grid-cols-12 bg-gray-100 min-h-0 dark:bg-gray-900"
    >
      <!-- Sidebar (Fixed) -->
      <div
        class="md:col-span-5 lg:col-span-3 grid grid-cols-12 bg-gray-100 min-h-0 dark:bg-gray-900"
      >
        <Sidebar class="col-span-1 lg:col-span-2" />
        <div class="md:col-span-1 lg:hidden" />
        <!-- Group List (1 part, Scrollable) -->
        <GroupList
          :groups="groups"
          class="col-span-10 lg:col-span-10 ml-2 lg:ml-6 bg-gray-100 dark:bg-gray-800 overflow-y-auto my-2 lg:my-3 rounded-lg"
          :selectedGroupId="selectedGroupId"
          @select="handleGroupSelect"
        />
      </div>

      <!-- Chat Window (3 parts, Scrollable) -->
      <template v-if="selectedGroupId">
        <ChatWindow
          :selectedGroupId="selectedGroupId"
          :groupData="selectedGroupData || {}"
          :membersData="selectedGroupMembers || []"
          :messages="messages"
          :hasMoreMessages="hasMoreMessages"
          :userId="currentUserId"
          @loadMore="loadMoreMessages"
          @showGroupInfo="showGroupInfo = true"
          class="md:col-span-7 lg:col-span-6 bg-white dark:bg-gray-800 overflow-y-auto min-h-0"
        />
        <GroupInfo
          :members="selectedGroupMembers || []"
          :sharedFiles="sharedFiles"
          :selectedGroupId="selectedGroupId"
          :isMuted="currentGroupMutedState"
          :isPinned="currentGroupPinnedState"
          :currentRole="currentRole"
          :pinnedMessages="messages.filter((msg) => msg.isPinned)"
          :isDisband="selectedGroupData?.isDisband"
          @update:isMuted="handleToggleMute"
          @update:isPinned="handleTogglePin"
          class="col-span-3 border-l dark:border-gray-700 hidden lg:block bg-white dark:bg-gray-800 my-2 lg:my-3 rounded-lg shadow-md dark:shadow-gray-900 overflow-y-auto min-h-0"
        />
      </template>
      <template v-else>
        <NoGroupSelected
          class="md-col-7 md:col-span-7 lg:col-span-9 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900"
        />
      </template>
    </div>

    <!-- Mobile Layout -->
    <div class="md:hidden flex-1 flex flex-col overflow-hidden">
      <!-- Mobile Group List (Default View) -->
      <div v-if="!selectedGroupId" class="flex-1 overflow-y-auto">
        <MobileGroupList :groups="groups" @select="handleGroupSelect" />
      </div>

      <!-- Mobile Chat Window -->
      <div v-else-if="!showGroupInfo" class="flex-1 flex flex-col">
        <ChatWindow
          :selectedGroupId="selectedGroupId"
          :groupData="selectedGroupData || {}"
          :membersData="selectedGroupMembers || []"
          :messages="messages"
          :hasMoreMessages="hasMoreMessages"
          :userId="currentUserId"
          @loadMore="loadMoreMessages"
          @back="selectedGroupId = null"
          @showGroupInfo="showGroupInfo = true"
          class="flex-1 overflow-y-auto"
        />
      </div>

      <!-- Mobile Group Info -->
      <div v-else class="flex-1 flex flex-col">
        <GroupInfo
          v-if="selectedGroupMembers.length > 0"
          :members="selectedGroupMembers || []"
          :sharedFiles="sharedFiles"
          :selectedGroupId="selectedGroupId"
          :isMuted="currentGroupMutedState"
          :isPinned="currentGroupPinnedState"
          :currentRole="currentRole"
          :pinnedMessages="messages.filter((msg) => msg.isPinned)"
          :isDisband="selectedGroupData?.isDisband"
          @update:isMuted="handleToggleMute"
          @update:isPinned="handleTogglePin"
          @back="showGroupInfo = false"
          class="flex-1 overflow-y-auto"
        />
      </div>
    </div>

    <!-- Mobile Navigation Bar -->
    <MobileNavBar class="md:hidden" v-if="!selectedGroupId" />

    <!-- MD Group Info Modal -->
    <div
      v-if="showGroupInfo && selectedGroupMembers.length > 0"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 md:block lg:hidden"
      @click="showGroupInfo = false"
    >
      <div
        class="absolute right-0 top-0 h-full w-full md:w-1/2 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out"
        @click.stop
      >
        <GroupInfo
          :members="selectedGroupMembers || []"
          :sharedFiles="sharedFiles"
          :selectedGroupId="selectedGroupId"
          :isMuted="currentGroupMutedState"
          :isPinned="currentGroupPinnedState"
          :currentRole="currentRole"
          @update:isMuted="handleToggleMute"
          @update:isPinned="handleTogglePin"
          @back="showGroupInfo = false"
          :pinnedMessages="messages.filter((msg) => msg.isPinned)"
          :isDisband="selectedGroupData?.isDisband"
          class="h-[calc(100%-4rem)] overflow-y-auto"
        />
      </div>
    </div>

    <!-- Loading Screen -->
    <LoadingScreen
      v-if="isInitialLoading"
      :progress="loadingProgress"
      :loading-text="loadingText"
    />
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import {
  ref as dbRef,
  query as rtdbQuery,
  orderByChild,
  equalTo,
  get,
  onValue,
  off,
  update,
  limitToLast,
  startAt,
  push,
  set,
  serverTimestamp,
} from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
} from "firebase/storage";
import { auth, db } from "~/firebase/firebase.js";
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import ChatWindow from "@/components/ChatWindow.vue";
import GroupInfo from "@/components/GroupInfo.vue";
import GroupList from "@/components/GroupList.vue";
import { decryptLastMessage } from "@/services/chatroom-service";

import SeoMeta from "@/components/SEOMeta.vue";
import MobileGroupList from "@/components/MobileGroupList.vue";
import LoadingScreen from "@/components/LoadingScreen.vue";
import NoGroupSelected from "@/components/NoGroupSelected.vue";
const title = "Cloudtalk - Real-time Chat Rooms";
const description =
  "Join our community. Chat in real-time, join themed rooms, and find new friends!";

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: "/images/home-og.jpg",
  twitterCard: "summary_large_image",
});

const groups = ref([]);
const storage = getStorage();
const selectedGroupId = ref(null);
const selectedGroupData = ref(null);
const selectedGroupMembers = ref([]);
const sharedFiles = ref([]);
const currentUserId = ref(null);
const currentGroupMutedState = ref(false);
const currentGroupPinnedState = ref(false);
const currentRole = computed(() => {
  if (!selectedGroupMembers.value || !currentUserId.value) return null;
  const currentMember = selectedGroupMembers.value.find(
    (member) => member?.id === currentUserId.value
  );

  return currentMember?.role ?? null; // use ?. and ?? to avoid errors
});
const isLoading = ref(false);
const handleGroupSelect = async (groupId) => {
  selectedGroupId.value = groupId;
  await fetchGroupData(groupId);
  messages.value = [];
  hasMoreMessages.value = true;
  lastVisible.value = null;
  await fetchMessages(groupId);
};

const lastVisible = ref(null);
const hasMoreMessages = ref(true);
let unsubscribeMessages = null;
const messages = ref([]);
import {
  getChatroomInfo,
  getChatroomMembers,
  setupMessagesListener,
  setupGroupDataListener,
  preload15GroupsMessages,
} from "@/services/chatroom-service";
const fetchMessages = async (groupId, loadMore = false) => {
  try {
    if (unsubscribeMessages && Array.isArray(unsubscribeMessages)) {
      unsubscribeMessages.forEach((unsubscribe) => unsubscribe());
    }

    unsubscribeMessages = await setupMessagesListener(
      groupId,
      (newMessages) => {
        try {
          if (loadMore) {
            messages.value = [...messages.value, ...newMessages];
          } else {
            messages.value = newMessages;
          }

          const files = newMessages
            .filter((msg) =>
              ["image", "video", "file"].includes(msg.messageType)
            )
            .map((msg) => ({
              id: msg.id,
              url: msg.messageContent,
              type: msg.messageType,
              name: msg.fileName || "unnamed file",
              senderId: msg.senderId,
              createdAt: msg.createdAt,
            }));

          sharedFiles.value = files;

          if (newMessages.length < 100) {
            hasMoreMessages.value = false;
          }

          isLoading.value = false;
        } catch (error) {
          console.error("Error processing message callback:", error);
          isLoading.value = false;
        }
      },
      loadMore,
      loadMore && messages.value.length > 0 ? messages.value[0].createdAt : null
    );
  } catch (error) {
    console.error("Error fetching messages:", error);
    isLoading.value = false;
  }
};

let unsubscribeChatroomInfo = null;
let unsubscribeChatroomMembers = null;
const fetchGroupData = async (groupId) => {
  try {
    if (groupId === selectedGroupData.value) {
      return;
    }
    const chatroomInfoRef = dbRef(db, `chatrooms/${groupId}`);
    const chatroomMembersRef = dbRef(db, `chatroom_users/${groupId}`);
    if (unsubscribeChatroomInfo) unsubscribeChatroomInfo();
    if (unsubscribeChatroomMembers) unsubscribeChatroomMembers();

    unsubscribeChatroomInfo = onValue(chatroomInfoRef, async (snapshot) => {
      try {
        const chatroomData = snapshot.val();

        if (chatroomData) {
          selectedGroupData.value = {
            id: groupId,
            chatType: chatroomData.chatType,
            description: chatroomData.description,
            name: chatroomData.name,
            photoUrl: chatroomData.photoUrl,
            isDisband: chatroomData?.isDisband || false,
            isGlobalMuted: chatroomData?.isGlobalMuted || false,
          };
        }
      } catch (error) {
        console.error("Error processing chatroom info:", error);
      }
    });

    unsubscribeChatroomMembers = onValue(
      chatroomMembersRef,
      async (snapshot) => {
        try {
          const members = [];
          snapshot.forEach((childSnapshot) => {
            const member = childSnapshot.val();
            if (member) {
              members.push({
                id: childSnapshot.key,
                ...member,
              });
            }
          });
          //await fetchGroupData(groupId);
          const [chatroomData, membersData] = await Promise.all([
            getChatroomInfo(groupId),
            getChatroomMembers(groupId),
          ]);

          if (chatroomData) {
            selectedGroupData.value = {
              ...selectedGroupData.value,
              id: groupId,
              chatType: chatroomData.chatType,
              description: chatroomData.description,
              name: chatroomData.name,
              photoUrl: chatroomData.photoUrl,
              isDisband: chatroomData?.isDisband || false,
              //isGlobalMuted: chatroomData?.isGlobalMuted || false,
            };
          }

          selectedGroupMembers.value = membersData;
        } catch (error) {
          console.error("Error processing chatroom members:", error);
        }
      }
    );

    const [chatroomData, membersData] = await Promise.all([
      getChatroomInfo(groupId),
      getChatroomMembers(groupId),
    ]);

    if (chatroomData) {
      selectedGroupData.value = {
        ...selectedGroupData.value,
        id: groupId,
        chatType: chatroomData.chatType,
        description: chatroomData.description,
        name: chatroomData.name,
        photoUrl: chatroomData.photoUrl,
        isDisband: chatroomData?.isDisband || false,
        //isGlobalMuted: chatroomData?.isGlobalMuted || false,
      };
    }

    selectedGroupMembers.value = membersData;

    return () => {
      unsubscribeChatroomInfo();
      unsubscribeChatroomMembers();
    };
  } catch (error) {
    console.error("Error fetching group data:", error);
    return () => {};
  }
};

//format message time
const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

//load more messages for a group
const loadMoreMessages = async (groupId) => {
  if (groupId) {
    await fetchMessages(groupId, true);
  }
};

let groupsListenerCleanup;
//initialize the application
const initializeApp = async () => {
  try {
    // Wait for auth to be ready
    await auth.authStateReady();
    if (!auth.currentUser) {
      isInitialLoading.value = false;
      return;
    }

    const userId = auth.currentUser.uid;

    // Phase 1: Setup groups listener and get initial data
    loadingText.value = "Fetching your groups...";
    loadingProgress.value = 10;

    // This will store the initial groups data
    let initialGroupsData = [];

    // Setup listener and get initial data in one go
    const groupsPromise = new Promise((resolve) => {
      const cleanup = setupGroupsRealtimeListener(userId, (groups) => {
        // Store initial data
        initialGroupsData = groups;
        resolve(groups);
      });

      // Store cleanup function
      groupsListenerCleanup = cleanup;
    });

    // Phase 2: Get group IDs for preloading
    loadingText.value = "Preparing messages...";
    loadingProgress.value = 20;

    // Get all group IDs (using one-time get)
    const userGroupsSnapshot = await get(dbRef(db, `user_chatrooms/${userId}`));
    const groupIds = userGroupsSnapshot.exists()
      ? Object.keys(userGroupsSnapshot.val())
      : [];

    // Phase 3: Get last activity times and statuses for sorting
    const lastActivityPromises = groupIds.map(async (groupId) => {
      try {
        // Fetch all required data in parallel
        const [lastMsg, lastLog, groupStatus, userStatus] = await Promise.all([
          get(
            rtdbQuery(
              dbRef(db, `chatrooms/${groupId}/messages`),
              orderByChild("createdAt"),
              limitToLast(1)
            )
          ),
          get(
            rtdbQuery(
              dbRef(db, `chatrooms/${groupId}/activity_logs`),
              orderByChild("timestamp"),
              limitToLast(1)
            )
          ),
          get(dbRef(db, `chatrooms/${groupId}/isDisband`)),
          get(dbRef(db, `chatroom_users/${groupId}/${userId}/isPinned`)),
        ]);

        return {
          groupId,
          lastActivity: Math.max(
            lastMsg.exists()
              ? Object.values(lastMsg.val())[0]?.createdAt || 0
              : 0,
            lastLog.exists()
              ? Object.values(lastLog.val())[0]?.timestamp || 0
              : 0
          ),
          isDisband: groupStatus.exists() ? groupStatus.val() : false,
          isPinned: userStatus.exists() ? userStatus.val() : false,
        };
      } catch (error) {
        console.error(`Error fetching data for group ${groupId}:`, error);
        return {
          groupId,
          lastActivity: 0,
          isDisband: false,
          isPinned: false,
        };
      }
    });

    const groupActivities = await Promise.all(lastActivityPromises);

    // Sort groups with proper priority: pinned > active > disbanded > by last activity
    const top15Groups = groupActivities
      .sort((a, b) => {
        // Pinned groups first
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        // Active groups before disbanded
        if (a.isDisband !== b.isDisband) {
          return a.isDisband ? 1 : -1;
        }
        // Finally by last activity
        return b.lastActivity - a.lastActivity;
      })
      .slice(0, 15)
      .map((g) => g.groupId);

    loadingProgress.value = 30;

    // Phase 4: Preload messages
    loadingText.value = "Loading messages...";
    loadingProgress.value = 40;

    // Priority load first group
    if (top15Groups.length > 0) {
      await preload15GroupsMessages([top15Groups[0]]);
    }
    loadingProgress.value = 60;

    // Background load others
    if (top15Groups.length > 1) {
      preload15GroupsMessages(top15Groups.slice(1)).catch((e) =>
        console.warn("Background preload failed:", e)
      );
    }

    // Phase 5: Setup other realtime listeners
    loadingText.value = "Setting up live updates...";
    loadingProgress.value = 80;

    // Wait for initial groups data (listener is already setup)
    const groupsData = await groupsPromise;

    // Complete initialization
    loadingProgress.value = 100;
    isInitialLoading.value = false;
  } catch (error) {
    console.error("Initialization error:", error);
    isInitialLoading.value = false;
  }
};

const cleanupAllListeners = () => {
  if (groupsListenerCleanup) {
    groupsListenerCleanup();
    groupsListenerCleanup = null;
  }
  if (realtimeListenersCleanup) {
    realtimeListenersCleanup();
    realtimeListenersCleanup = null;
  }
};

const sortGroups = (groups) => {
  return [...groups].sort((a, b) => {
    // 1. Top and undisbanded groups are at the forefront
    if (a.isPinned && !a.isDisband && !(b.isPinned && !b.isDisband)) {
      return -1;
    }
    if (b.isPinned && !b.isDisband && !(a.isPinned && !a.isDisband)) {
      return 1;
    }

    // 2. Undisbanded groups are ranked ahead of disbanded groups
    if (a.isDisband !== b.isDisband) {
      return a.isDisband ? 1 : -1;
    }

    // 3. Order in descending order of last message time (null/undefined is regarded as 0)
    const aTime = a.lastMessageTime || 0;
    const bTime = b.lastMessageTime || 0;
    return bTime - aTime;
  });
};

watch(
  selectedGroupId,
  (newId) => {
    if (newId) {
      const currentGroup = groups.value.find((group) => group.id === newId);
      if (currentGroup) {
        currentGroupMutedState.value = currentGroup.isMuted;
        currentGroupPinnedState.value = currentGroup.isPinned;
      }
    }
  },
  { immediate: true }
);

const getUnreadCount = async (userId, chatroomId) => {
  try {
    const lastReadRef = dbRef(
      db,
      `chatroom_users/${chatroomId}/${userId}/lastRead`
    );
    const lastReadSnapshot = await get(lastReadRef);
    const lastRead = lastReadSnapshot.exists() ? lastReadSnapshot.val() : 0;

    const unreadQuery = rtdbQuery(
      dbRef(db, `chatrooms/${chatroomId}/messages`),
      orderByChild("createdAt"),
      startAt(lastRead + 1)
    );

    const unreadSnapshot = await get(unreadQuery);
    return unreadSnapshot.exists()
      ? Object.keys(unreadSnapshot.val()).length
      : 0;
  } catch (error) {
    console.warn(`Error getting unread count for ${chatroomId}:`, error);
    return 0;
  }
};

const formatLastMessage = async (messageData, userId, groupId) => {
  if (messageData.messageType === "system") {
    return messageData.messageContent;
  }

  // Format mentions in text messages
  const formatMentions = (content) => {
    if (!content) return "";
    return content.replace(/@\{[^|]+\|([^}]+)\}/g, "@$1");
  };

  const isCurrentUser = messageData.senderId === userId;

  const messageContent = await decryptLastMessage(
    messageData.messageContent,
    messageData.senderId,
    groupId
  );

  if (messageData.messageType === "text") {
    const formattedContent = formatMentions(messageContent);
    return isCurrentUser
      ? formattedContent
      : `${await getUserName(messageData.senderId)}: ${formattedContent}`;
  }

  // Handle non-text messages (images, files, etc.)
  const action = isCurrentUser
    ? "You sent"
    : `${await getUserName(messageData.senderId)} sent`;
  return `${action} a ${messageData.messageType.toLowerCase()}`;
};

// const setupGroupsRealtimeListener = (userId, callback) => {
//   // Clean up previous listener if exists
//   if (groupsListenerCleanup) {
//     groupsListenerCleanup();
//   }

//   const userGroupsRef = dbRef(db, `user_chatrooms/${userId}`);
//   const unsubscribeCallbacks = [];

//   // Main groups listener
//   const unsubscribeUserGroups = onValue(
//     userGroupsRef,
//     async (userGroupsSnapshot) => {
//       if (!userGroupsSnapshot.exists()) {
//         groups.value = [];
//         if (typeof callback === "function") {
//           callback([]);
//         }
//         return;
//       }

//       const userGroups = userGroupsSnapshot.val();
//       const groupIds = Object.keys(userGroups);

//       // Process all groups in parallel
//       const groupPromises = groupIds.map(async (chatroomId) => {
//         try {
//           // Get all needed data in parallel using one-time listeners
//           const [chatroomSnap, userStatusSnap, messagesSnap, activitySnap] =
//             await Promise.all([
//               new Promise((resolve) => {
//                 const ref = dbRef(db, `chatrooms/${chatroomId}`);
//                 onValue(
//                   ref,
//                   (snapshot) => {
//                     resolve(snapshot);
//                   },
//                   { onlyOnce: true }
//                 );
//               }),
//               new Promise((resolve) => {
//                 const ref = dbRef(db, `chatroom_users/${chatroomId}/${userId}`);
//                 onValue(
//                   ref,
//                   (snapshot) => {
//                     resolve(snapshot);
//                   },
//                   { onlyOnce: true }
//                 );
//               }),
//               new Promise((resolve) => {
//                 const ref = rtdbQuery(
//                   dbRef(db, `chatrooms/${chatroomId}/messages`),
//                   orderByChild("createdAt"),
//                   limitToLast(1)
//                 );
//                 onValue(
//                   ref,
//                   (snapshot) => {
//                     resolve(snapshot);
//                   },
//                   { onlyOnce: true }
//                 );
//               }),
//               new Promise((resolve) => {
//                 const ref = rtdbQuery(
//                   dbRef(db, `chatrooms/${chatroomId}/activity_logs`),
//                   orderByChild("timestamp"),
//                   limitToLast(1)
//                 );
//                 onValue(
//                   ref,
//                   (snapshot) => {
//                     resolve(snapshot);
//                   },
//                   { onlyOnce: true }
//                 );
//               }),
//             ]);

//           // Process group data (identical to original)
//           const chatroomData = chatroomSnap.exists()
//             ? chatroomSnap.val()
//             : null;
//           const userStatus = userStatusSnap.exists()
//             ? userStatusSnap.val()
//             : { isPinned: false };

//           // Process last message (identical to original)
//           let lastMessage = null;
//           let lastMessageTime = null;
//           let lastMessageType = null;

//           const lastRegularMessage = messagesSnap.exists()
//             ? Object.values(messagesSnap.val())[0]
//             : null;

//           const lastActivityLog = activitySnap.exists()
//             ? Object.values(activitySnap.val())[0]
//             : null;

//           if (lastRegularMessage && lastActivityLog) {
//             if (lastRegularMessage.createdAt > lastActivityLog.timestamp) {
//               lastMessage = await formatLastMessage(
//                 lastRegularMessage,
//                 userId,
//                 chatroomId
//               );
//               lastMessageTime = lastRegularMessage.createdAt;
//               if (lastRegularMessage.isDeleted) {
//                 lastMessageType = "deleted";
//                 lastMessage = "This message has been deleted";
//               }
//             } else {
//               lastMessage = lastActivityLog.details;
//               lastMessageTime = lastActivityLog.timestamp;
//               lastMessageType = "system";
//             }
//           } else if (lastRegularMessage) {
//             lastMessage = await formatLastMessage(
//               lastRegularMessage,
//               userId,
//               chatroomId
//             );
//             lastMessageTime = lastRegularMessage.createdAt;

//             lastMessageType = lastRegularMessage.messageType;
//             if (lastRegularMessage.isDeleted) {
//               lastMessageType = "deleted";
//               lastMessage = "This message has been deleted";
//             }
//           } else if (lastActivityLog) {
//             lastMessage = lastActivityLog.details;
//             lastMessageTime = lastActivityLog.timestamp;
//             lastMessageType = "system";
//           }

//           // Return identical group object structure
//           return {
//             id: chatroomId,
//             name: chatroomData?.name || "Unnamed Group",
//             photoUrl: chatroomData?.photoUrl || "/images/group.png",
//             isPinned: userStatus.isPinned || false,
//             isMuted: userStatus.isMuted || false,
//             isDisband: chatroomData?.isDisband || false,
//             lastMessage,
//             lastMessageTime: lastMessageTime || chatroomData?.createdAt || 0,
//             lastMessageType,
//             unreadCount: await getUnreadCount(userId, chatroomId),
//           };
//         } catch (error) {
//           console.warn(`Error processing group ${chatroomId}:`, error);
//           return null;
//         }
//       });

//       // Process and sort groups (identical to original)
//       const groupsData = (await Promise.all(groupPromises)).filter(Boolean);
//       const sortedGroups = sortGroups(groupsData);
//       // Update reactive data
//       groups.value = sortedGroups;

//       // Auto-select first group on desktop (identical to original)
//       if (
//         !selectedGroupId.value &&
//         sortedGroups.length > 0 &&
//         window.innerWidth >= 768
//       ) {
//         selectedGroupId.value = sortedGroups[0].id;
//         handleGroupSelect(selectedGroupId.value);
//       }

//       // Call callback with initial data if provided
//       callback?.(sortedGroups);

//       // Setup listeners for each group's messages and activity logs
//       groupIds.forEach((groupId) => {
//         // Listen for new messages
//         const messagesRef = rtdbQuery(
//           dbRef(db, `chatrooms/${groupId}/messages`),
//           orderByChild("createdAt"),
//           limitToLast(1)
//         );
//         const unsubscribeMessages1 = onValue(messagesRef, async (snapshot) => {
//           if (snapshot.exists()) {
//             // Trigger a refresh of the groups data
//             const userGroupsSnapshot = await get(userGroupsRef);
//             if (userGroupsSnapshot.exists()) {
//               const userGroups = userGroupsSnapshot.val();
//               const groupIds = Object.keys(userGroups);
//               // Process groups again
//               const groupPromises = groupIds.map(async (chatroomId) => {
//                 try {
//                   const [
//                     chatroomSnap,
//                     userStatusSnap,
//                     messagesSnap,
//                     activitySnap,
//                   ] = await Promise.all([
//                     get(dbRef(db, `chatrooms/${chatroomId}`)),
//                     get(dbRef(db, `chatroom_users/${chatroomId}/${userId}`)),
//                     get(
//                       rtdbQuery(
//                         dbRef(db, `chatrooms/${chatroomId}/messages`),
//                         orderByChild("createdAt"),
//                         limitToLast(1)
//                       )
//                     ),
//                     get(
//                       rtdbQuery(
//                         dbRef(db, `chatrooms/${chatroomId}/activity_logs`),
//                         orderByChild("timestamp"),
//                         limitToLast(1)
//                       )
//                     ),
//                   ]);

//                   // ... (rest of the group processing logic)
//                   const chatroomData = chatroomSnap.exists()
//                     ? chatroomSnap.val()
//                     : null;
//                   const userStatus = userStatusSnap.exists()
//                     ? userStatusSnap.val()
//                     : { isPinned: false };
//                   let lastMessage = null;
//                   let lastMessageTime = null;
//                   let lastMessageType = null;

//                   const lastRegularMessage = messagesSnap.exists()
//                     ? Object.values(messagesSnap.val())[0]
//                     : null;
//                   const lastActivityLog = activitySnap.exists()
//                     ? Object.values(activitySnap.val())[0]
//                     : null;

//                   if (lastRegularMessage && lastActivityLog) {
//                     if (
//                       lastRegularMessage.createdAt > lastActivityLog.timestamp
//                     ) {
//                       lastMessage = await formatLastMessage(
//                         lastRegularMessage,
//                         userId,
//                         chatroomId
//                       );
//                       lastMessageTime = lastRegularMessage.createdAt;
//                       lastMessageType = lastRegularMessage.messageType;
//                       if (lastRegularMessage.isDeleted) {
//                         lastMessageType = "deleted";
//                         lastMessage = "This message has been deleted";
//                       }
//                     } else {
//                       lastMessage = lastActivityLog.details;
//                       lastMessageTime = lastActivityLog.timestamp;
//                       lastMessageType = "system";
//                     }
//                   } else if (lastRegularMessage) {
//                     lastMessage = await formatLastMessage(
//                       lastRegularMessage,
//                       userId,
//                       chatroomId
//                     );
//                     lastMessageTime = lastRegularMessage.createdAt;
//                     lastMessageType = lastRegularMessage.messageType;
//                     if (lastRegularMessage.isDeleted) {
//                       lastMessageType = "deleted";
//                       lastMessage = "This message has been deleted";
//                     }
//                   } else if (lastActivityLog) {
//                     lastMessage = lastActivityLog.details;
//                     lastMessageTime = lastActivityLog.timestamp;
//                     lastMessageType = "system";
//                   }

//                   return {
//                     id: chatroomId,
//                     name: chatroomData?.name || "Unnamed Group",
//                     photoUrl: chatroomData?.photoUrl || "/images/group.png",
//                     isPinned: userStatus.isPinned || false,
//                     isMuted: userStatus.isMuted || false,
//                     isDisband: chatroomData?.isDisband || false,
//                     lastMessage,
//                     lastMessageTime:
//                       lastMessageTime || chatroomData?.createdAt || 0,
//                     lastMessageType,
//                     unreadCount: await getUnreadCount(userId, chatroomId),
//                   };
//                 } catch (error) {
//                   console.warn(`Error processing group ${chatroomId}:`, error);
//                   return null;
//                 }
//               });

//               const groupsData = (await Promise.all(groupPromises)).filter(
//                 Boolean
//               );
//               const sortedGroups = sortGroups(groupsData);
//               groups.value = sortedGroups;
//               callback?.(sortedGroups);
//             }
//           }
//         });
//         unsubscribeCallbacks.push(unsubscribeMessages1);

//         // Listen for activity logs
//         const activityLogsRef = rtdbQuery(
//           dbRef(db, `chatrooms/${groupId}/activity_logs`),
//           orderByChild("timestamp"),
//           limitToLast(1)
//         );
//         const unsubscribeActivityLogs = onValue(
//           activityLogsRef,
//           async (snapshot) => {
//             if (snapshot.exists()) {
//               // Trigger a refresh of the groups data (same as above)
//               const userGroupsSnapshot = await get(userGroupsRef);
//               if (userGroupsSnapshot.exists()) {
//                 const userGroups = userGroupsSnapshot.val();
//                 const groupIds = Object.keys(userGroups);
//                 // Process groups again (same as above)
//                 const groupPromises = groupIds.map(async (chatroomId) => {
//                   try {
//                     const [
//                       chatroomSnap,
//                       userStatusSnap,
//                       messagesSnap,
//                       activitySnap,
//                     ] = await Promise.all([
//                       get(dbRef(db, `chatrooms/${chatroomId}`)),
//                       get(dbRef(db, `chatroom_users/${chatroomId}/${userId}`)),
//                       get(
//                         rtdbQuery(
//                           dbRef(db, `chatrooms/${chatroomId}/messages`),
//                           orderByChild("createdAt"),
//                           limitToLast(1)
//                         )
//                       ),
//                       get(
//                         rtdbQuery(
//                           dbRef(db, `chatrooms/${chatroomId}/activity_logs`),
//                           orderByChild("timestamp"),
//                           limitToLast(1)
//                         )
//                       ),
//                     ]);

//                     const chatroomData = chatroomSnap.exists()
//                       ? chatroomSnap.val()
//                       : null;
//                     const userStatus = userStatusSnap.exists()
//                       ? userStatusSnap.val()
//                       : { isPinned: false };
//                     let lastMessage = null;
//                     let lastMessageTime = null;
//                     let lastMessageType = null;

//                     const lastRegularMessage = messagesSnap.exists()
//                       ? Object.values(messagesSnap.val())[0]
//                       : null;
//                     const lastActivityLog = activitySnap.exists()
//                       ? Object.values(activitySnap.val())[0]
//                       : null;

//                     if (lastRegularMessage && lastActivityLog) {
//                       if (
//                         lastRegularMessage.createdAt > lastActivityLog.timestamp
//                       ) {
//                         lastMessage = await formatLastMessage(
//                           lastRegularMessage,
//                           userId,
//                           chatroomId
//                         );
//                         lastMessageTime = lastRegularMessage.createdAt;
//                         lastMessageType = lastRegularMessage.messageType;
//                         if (lastRegularMessage.isDeleted) {
//                           lastMessageType = "deleted";
//                           lastMessage = "This message has been deleted";
//                         }
//                       } else {
//                         lastMessage = lastActivityLog.details;
//                         lastMessageTime = lastActivityLog.timestamp;
//                         lastMessageType = "system";
//                       }
//                     } else if (lastRegularMessage) {
//                       lastMessage = await formatLastMessage(
//                         lastRegularMessage,
//                         userId,
//                         chatroomId
//                       );
//                       lastMessageTime = lastRegularMessage.createdAt;
//                       lastMessageType = lastRegularMessage.messageType;
//                       if (lastRegularMessage.isDeleted) {
//                         lastMessageType = "deleted";
//                         lastMessage = "This message has been deleted";
//                       }
//                     } else if (lastActivityLog) {
//                       lastMessage = lastActivityLog.details;
//                       lastMessageTime = lastActivityLog.timestamp;
//                       lastMessageType = "system";
//                     }

//                     return {
//                       id: chatroomId,
//                       name: chatroomData?.name || "Unnamed Group",
//                       photoUrl: chatroomData?.photoUrl || "/images/group.png",
//                       isPinned: userStatus.isPinned || false,
//                       isMuted: userStatus.isMuted || false,
//                       isDisband: chatroomData?.isDisband || false,
//                       lastMessage,
//                       lastMessageTime:
//                         lastMessageTime || chatroomData?.createdAt || 0,
//                       lastMessageType,
//                       unreadCount: await getUnreadCount(userId, chatroomId),
//                     };
//                   } catch (error) {
//                     console.warn(
//                       `Error processing group ${chatroomId}:`,
//                       error
//                     );
//                     return null;
//                   }
//                 });

//                 const groupsData = (await Promise.all(groupPromises)).filter(
//                   Boolean
//                 );
//                 const sortedGroups = sortGroups(groupsData);
//                 groups.value = sortedGroups;
//                 callback?.(sortedGroups);
//               }
//             }
//           }
//         );
//         unsubscribeCallbacks.push(unsubscribeActivityLogs);
//       });
//     }
//   );

//   // Store cleanup function
//   groupsListenerCleanup = () => {
//     unsubscribeUserGroups();
//     unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
//   };

//   return groupsListenerCleanup;
// };

const setupGroupsRealtimeListener = (userId, callback) => {
  if (groupsListenerCleanup) groupsListenerCleanup();

  const userGroupsRef = dbRef(db, `user_chatrooms/${userId}`);
  const unsubscribeCallbacks = [];

  const fetchGroupData = async (chatroomId) => {
    try {
      const [chatroomSnap, userStatusSnap, messagesSnap, activitySnap] =
        await Promise.all([
          get(dbRef(db, `chatrooms/${chatroomId}`)),
          get(dbRef(db, `chatroom_users/${chatroomId}/${userId}`)),
          get(
            rtdbQuery(
              dbRef(db, `chatrooms/${chatroomId}/messages`),
              orderByChild("createdAt"),
              limitToLast(1)
            )
          ),
          get(
            rtdbQuery(
              dbRef(db, `chatrooms/${chatroomId}/activity_logs`),
              orderByChild("timestamp"),
              limitToLast(1)
            )
          ),
        ]);

      const chatroomData = chatroomSnap.exists() ? chatroomSnap.val() : null;
      const userStatus = userStatusSnap.exists()
        ? userStatusSnap.val()
        : { isPinned: false };

      const lastRegularMessage = messagesSnap.exists()
        ? Object.values(messagesSnap.val())[0]
        : null;
      const lastActivityLog = activitySnap.exists()
        ? Object.values(activitySnap.val())[0]
        : null;

      let lastMessage = null;
      let lastMessageTime = null;
      let lastMessageType = null;

      if (lastRegularMessage && lastActivityLog) {
        if (lastRegularMessage.createdAt > lastActivityLog.timestamp) {
          lastMessage = await formatLastMessage(
            lastRegularMessage,
            userId,
            chatroomId
          );
          lastMessageTime = lastRegularMessage.createdAt;
          lastMessageType = lastRegularMessage.isDeleted
            ? "deleted"
            : lastRegularMessage.messageType;
          if (lastRegularMessage.isDeleted)
            lastMessage = "This message has been deleted";
        } else {
          lastMessage = lastActivityLog.details;
          lastMessageTime = lastActivityLog.timestamp;
          lastMessageType = "system";
        }
      } else if (lastRegularMessage) {
        lastMessage = await formatLastMessage(
          lastRegularMessage,
          userId,
          chatroomId
        );
        lastMessageTime = lastRegularMessage.createdAt;
        lastMessageType = lastRegularMessage.isDeleted
          ? "deleted"
          : lastRegularMessage.messageType;
        if (lastRegularMessage.isDeleted)
          lastMessage = "This message has been deleted";
      } else if (lastActivityLog) {
        lastMessage = lastActivityLog.details;
        lastMessageTime = lastActivityLog.timestamp;
        lastMessageType = "system";
      }

      return {
        id: chatroomId,
        name: chatroomData?.name || "Unnamed Group",
        photoUrl: chatroomData?.photoUrl || "/images/group.png",
        isPinned: userStatus.isPinned || false,
        isMuted: userStatus.isMuted || false,
        isDisband: chatroomData?.isDisband || false,
        lastMessage,
        lastMessageTime: lastMessageTime || chatroomData?.createdAt || 0,
        lastMessageType,
        unreadCount: await getUnreadCount(userId, chatroomId),
      };
    } catch (error) {
      console.warn(`Error processing group ${chatroomId}:`, error);
      return null;
    }
  };

  const refreshGroups = async () => {
    const userGroupsSnapshot = await get(userGroupsRef);
    if (!userGroupsSnapshot.exists()) return;

    const userGroups = userGroupsSnapshot.val();
    const groupIds = Object.keys(userGroups);
    const groupsData = (await Promise.all(groupIds.map(fetchGroupData))).filter(
      Boolean
    );
    const sortedGroups = sortGroups(groupsData);
    groups.value = sortedGroups;
    callback?.(sortedGroups);
  };

  const unsubscribeUserGroups = onValue(
    userGroupsRef,
    async (userGroupsSnapshot) => {
      if (!userGroupsSnapshot.exists()) {
        groups.value = [];
        callback?.([]);
        return;
      }
      if (selectedGroupId.value) await fetchMessages(selectedGroupId.value);

      const userGroups = userGroupsSnapshot.val();
      const groupIds = Object.keys(userGroups);

      const groupsData = (
        await Promise.all(groupIds.map(fetchGroupData))
      ).filter(Boolean);
      const sortedGroups = sortGroups(groupsData);
      groups.value = sortedGroups;

      if (
        !selectedGroupId.value &&
        sortedGroups.length > 0 &&
        window.innerWidth >= 768
      ) {
        selectedGroupId.value = sortedGroups[0].id;
        handleGroupSelect(selectedGroupId.value);
      }

      callback?.(sortedGroups);

      // Setup listeners for new messages and activity logs
      groupIds.forEach((groupId) => {
        const messagesRef = rtdbQuery(
          dbRef(db, `chatrooms/${groupId}/messages`),
          orderByChild("timestamp"),
          limitToLast(1)
        );
        const activityLogsRef = rtdbQuery(
          dbRef(db, `chatrooms/${groupId}/activity_logs`),
          orderByChild("timestamp"),
          limitToLast(1)
        );

        const unsubscribeMessages = onValue(messagesRef, refreshGroups);
        const unsubscribeActivities = onValue(activityLogsRef, refreshGroups);

        unsubscribeCallbacks.push(unsubscribeMessages, unsubscribeActivities);
      });
    }
  );

  groupsListenerCleanup = () => {
    unsubscribeUserGroups();
    unsubscribeCallbacks.forEach((fn) => fn());
  };
};

const getUserName = async (userId) => {
  try {
    const userSnapshot = await get(dbRef(db, `users/${userId}`));
    if (userSnapshot.exists()) {
      return userSnapshot.val().username;
    }
    return "Unknown User";
  } catch (error) {
    console.error("Error fetching user:", error);
    return "Unknown User";
  }
};

const authUnsubscribe = auth.onAuthStateChanged((user) => {
  if (user) {
    currentUserId.value = user.uid;
  } else {
    groups.value = [];
  }
});

let cleanupListeners = null;
let cleanupGroupData = null;
const isInitialLoading = ref(true);
const loadingProgress = ref(0);
const loadingText = ref("Loading your chats...");

onMounted(() => {
  initializeApp();
});

//pin and mute
const handleToggleMute = async (newMutedState) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId || !selectedGroupId.value) return;

    await update(
      dbRef(db, `chatroom_users/${selectedGroupId.value}/${userId}`),
      {
        isMuted: newMutedState,
      }
    );

    currentGroupMutedState.value = newMutedState;

    const memberIndex = selectedGroupMembers.value.findIndex(
      (m) => m.id === userId
    );
    if (memberIndex !== -1) {
      selectedGroupMembers.value[memberIndex].isMuted = newMutedState;
    }
  } catch (error) {
    console.error("Error toggling mute:", error);
  }
};

onUnmounted(() => {
  authUnsubscribe();

  if (unsubscribeMessages && Array.isArray(unsubscribeMessages)) {
    unsubscribeMessages.forEach((unsubscribe) => unsubscribe());
  }

  if (cleanupListeners) cleanupListeners();
  if (cleanupGroupData) cleanupGroupData();
  //cleanupGroupData = await fetchGroupData(selectedGroupId.value);
});

const handleTogglePin = async (newPinnedState) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId || !selectedGroupId.value) return;

    await update(
      dbRef(db, `chatroom_users/${selectedGroupId.value}/${userId}`),
      {
        isPinned: newPinnedState,
      }
    );

    currentGroupPinnedState.value = newPinnedState;

    groups.value = groups.value.map((group) => {
      if (group.id === selectedGroupId.value) {
        return { ...group, isPinned: newPinnedState };
      }
      return group;
    });

    const memberIndex = selectedGroupMembers.value.findIndex(
      (m) => m.id === userId
    );
    if (memberIndex !== -1) {
      selectedGroupMembers.value[memberIndex].isPinned = newPinnedState;
    }
  } catch (error) {
    console.error("Error toggling pin:", error);
  }
};

// Add new ref for mobile group info view
const showGroupInfo = ref(false);

const router = useRouter();

const checkIsGroupJoined = async (groupId) => {
  if (!auth.currentUser?.uid) return false;
  const userGroupsRef = dbRef(db, `user_chatrooms/${auth.currentUser.uid}`);
  const userGroupsSnapshot = await get(userGroupsRef);
  if (userGroupsSnapshot.exists()) {
    const userGroups = userGroupsSnapshot.val();
    return userGroups[groupId];
  }
};

watch(selectedGroupId, async (newGroupId, oldGroupId) => {
  await set(
    dbRef(db, `chatroom_users/${oldGroupId}/${currentUserId.value}/lastRead`),
    Date.now() + 5000
  );

  await set(
    dbRef(db, `chatroom_users/${newGroupId}/${currentUserId.value}/lastRead`),
    Date.now() + 5000
  );
});

onBeforeUnmount(async () => {
  if (selectedGroupId.value && currentUserId.value) {
    set(
      dbRef(
        db,
        `chatroom_users/${selectedGroupId.value}/${currentUserId.value}/lastRead`
      ),
      Date.now()
    );
  }
});

router.beforeEach(async (to, from) => {
  if (
    selectedGroupId.value &&
    currentUserId.value &&
    (await checkIsGroupJoined(selectedGroupId.value))
  ) {
    await set(
      dbRef(
        db,
        `chatroom_users/${selectedGroupId.value}/${currentUserId.value}/lastRead`
      ),
      Date.now()
    );
  }
});

window.addEventListener("beforeunload", async () => {
  if (
    selectedGroupId.value &&
    currentUserId.value &&
    (await checkIsGroupJoined(selectedGroupId.value))
  ) {
    await set(
      dbRef(
        db,
        `chatroom_users/${selectedGroupId.value}/${currentUserId.value}/lastRead`
      ),
      Date.now()
    );
  }
});

// Use Firebase onDisconnected to ensure logging in the event of network outages
const markLastReadOnDisconnect = async () => {
  if (selectedGroupId.value && currentUserId.value) {
    const lastReadRef = dbRef(
      db,
      `chatroom_users/${selectedGroupId.value}/${currentUserId.value}/lastRead`
    );
    onDisconnect(lastReadRef).set(Date.now());
  }
};

onMounted(() => {
  markLastReadOnDisconnect();
});
</script>
