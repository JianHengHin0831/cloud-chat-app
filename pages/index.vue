<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <SeoMeta
      :title="title"
      :description="description"
      image="/images/home-og.png"
      keywords="Chat room, real time, cloud application, chat application"
    />
    <!-- Header (Fixed) -->
    <Header class="h-16 flex-shrink-0" />

    <div class="flex-1 grid grid-cols-12 bg-gray-100 min-h-0">
      <!-- Sidebar (Fixed) -->
      <div class="col-span-3 grid grid-cols-12 bg-gray-100 min-h-0">
        <Sidebar class="col-span-2" />

        <!-- Group List (1 part, Scrollable) -->
        <GroupList
          :groups="groups"
          class="col-span-10 bg-gray-100 overflow-y-auto"
          :selectedGroupId="selectedGroupId"
          @select="handleGroupSelect"
        />
      </div>

      <!-- Chat Window (3 parts, Scrollable) -->
      <ChatWindow
        :selectedGroupId="selectedGroupId"
        :groupData="selectedGroupData || {}"
        :membersData="selectedGroupMembers || []"
        :messages="messages"
        :hasMoreMessages="hasMoreMessages"
        :userId="currentUserId"
        @loadMore="loadMoreMessages"
        class="col-span-6 bg-white overflow-y-auto min-h-0"
      />

      <!-- Group Info (1/4 width, Scrollable) -->
      <GroupInfo
        :members="selectedGroupMembers || []"
        :sharedFiles="sharedFiles"
        :selectedGroupId="selectedGroupId"
        :isMuted="currentGroupMutedState"
        :isPinned="currentGroupPinnedState"
        :currentRole="currentRole"
        @update:isMuted="handleToggleMute"
        @update:isPinned="handleTogglePin"
        class="col-span-3 border-l hidden md:block bg-white my-3 rounded-lg shadow-md overflow-y-auto min-h-0"
      />
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
  orderBy,
  limit,
  updateDoc,
} from "firebase/firestore";
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

//SEO Meta
import SeoMeta from "@/components/SEOMeta.vue";
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

//script
const groups = ref([]);
const storage = getStorage();
const selectedGroupId = ref(null);
const selectedGroupData = ref(null);
const selectedGroupMembers = ref([]);
const sharedFiles = ref([]); // 存储共享文件
const currentUserId = ref(null);
const currentGroupMutedState = ref(false);
const currentGroupPinnedState = ref(false);
const currentRole = computed(() => {
  if (!selectedGroupMembers.value || !currentUserId.value) return null;
  selectedGroupMembers.value?.forEach((member) => {
    if (member.id === currentUserId.value) {
      return member.role;
    }
  });
});

const handleGroupSelect = async (groupId) => {
  selectedGroupId.value = groupId;
  await fetchGroupData(groupId);
  messages.value = [];
  hasMoreMessages.value = true;
  lastVisible.value = null;
  await fetchMessages(groupId);
};

const fetchGroupData = async (groupId) => {
  try {
    // 并行获取群组数据和成员数据
    const [chatroomDoc, chatroomUsersSnapshot] = await Promise.all([
      getDoc(doc(db, "chatroom", groupId)),
      getDocs(
        query(
          collection(db, "chatroom_user"),
          where("chatroomId", "==", groupId)
        )
      ),
    ]);

    if (chatroomDoc.exists()) {
      selectedGroupData.value = {
        id: groupId,
        ...chatroomDoc.data(),
      };
    }

    // 处理成员数据
    const userPromises = chatroomUsersSnapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      const userDoc = await getDoc(doc(db, "users", data.userId));
      if (userDoc.exists()) {
        return {
          id: data.userId,
          avatarUrl: userDoc.data().avatarUrl,
          username: userDoc.data().username,
          email: userDoc.data().email,
          joinedAt: data.joinedAt,
          role: data.role,
          isMuted: data.isMuted,
          isPinned: data.isPinned,
        };
      }
      return null;
    });

    const membersData = (await Promise.all(userPromises)).filter(Boolean);
    selectedGroupMembers.value = membersData;
  } catch (error) {
    console.error("Error fetching group data:", error);
  }
};

let unsubscribeMessages = null;
const messages = ref([]);
const lastVisible = ref(null);
const hasMoreMessages = ref(true);

const fetchMessages = async (groupId, loadMore = false) => {
  try {
    let messagesQuery = query(
      collection(db, "chatroom", groupId, "messages"),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    if (loadMore && lastVisible.value) {
      messagesQuery = query(messagesQuery, startAfter(lastVisible.value));
    }

    // 取消之前的監聽
    if (unsubscribeMessages) {
      unsubscribeMessages();
    }

    // 監聽新消息
    unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 更新消息列表
      if (loadMore) {
        messages.value = [...messages.value, ...newMessages];
      } else {
        messages.value = newMessages;
      }

      // 更新共享文件列表
      const files = newMessages
        .filter((msg) => ["image", "video", "file"].includes(msg.messageType))
        .map((msg) => ({
          id: msg.id,
          type: msg.messageType,
          url: msg.messageContent,
          createdAt: msg.createdAt,
        }));

      sharedFiles.value = files;

      // 檢查是否還有更多消息
      if (newMessages.length < 100) {
        hasMoreMessages.value = false;
      }

      lastVisible.value = snapshot.docs[snapshot.docs.length - 1];
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
};

const loadMoreMessages = async (groupId) => {
  if (groupId) {
    await fetchMessages(groupId, true);
  }
};

const fetchGroups = async (userId) => {
  try {
    const chatroomUsersQuery = query(
      collection(db, "chatroom_user"),
      where("userId", "==", userId)
    );
    const chatroomUsersSnapshot = await getDocs(chatroomUsersQuery);
    const groupsData = [];
    const messagePromises = []; // 存储所有消息加载的 Promise

    // 1. 先加载所有群组基本信息
    for (const docSnapshot of chatroomUsersSnapshot.docs) {
      const chatroomId = docSnapshot.data().chatroomId;
      const isPinned = docSnapshot.data().isPinned;

      const chatroomDoc = await getDoc(doc(db, "chatroom", chatroomId));
      if (chatroomDoc.exists()) {
        const chatroomData = chatroomDoc.data();

        const group = {
          id: chatroomId,
          name: chatroomData.name,
          photoUrl: chatroomData.photoUrl,
          isDisband: chatroomData.isDisband || false,
          isPinned,
          lastMessage: null,
          lastMessageTime: null,
        };

        // 2. 对每个群组获取最后一条消息（改用 getDocs 而不是 onSnapshot）
        const messagesQuery = query(
          collection(db, "chatroom", chatroomId, "messages"),
          orderBy("createdAt", "desc"),
          limit(1)
        );

        messagePromises.push(
          getDocs(messagesQuery).then((messagesSnapshot) => {
            if (!messagesSnapshot.empty) {
              const lastMessage = messagesSnapshot.docs[0].data();
              group.lastMessageTime = lastMessage.createdAt;
              group.lastMessage = formatLastMessage(lastMessage, userId);
            }
            return group;
          })
        );

        groupsData.push(group);
      }
    }

    // 3. 等待所有消息加载完成
    const groupsWithMessages = await Promise.all(messagePromises);

    // 4. 现在所有 lastMessageTime 都已加载，可以正确排序
    const sortedGroups = sortGroupsByLastMessageTime(groupsWithMessages);
    groups.value = sortedGroups;

    // 5. 设置默认群组
    if (!selectedGroupId.value && sortedGroups.length > 0) {
      selectDefaultGroup(sortedGroups);
    }

    // 初始加载后设置监听器

    return setupRealTimeListeners(userId, sortedGroups);
  } catch (error) {
    console.error("Error fetching groups:", error);
  }
};
const cleanupListeners = ref(null);
onMounted(async () => {
  try {
    const userId = currentUserId.value;
    cleanupListeners.value = await fetchGroups(userId);
  } catch (err) {
    console.error("Component mount error:", err);
  }
});

onUnmounted(() => {
  cleanupListeners.value?.();
});

// 按最后消息时间排序（最近的在前）
const formatLastMessage = (messageData, userId) => {
  const isCurrentUser = messageData.senderId === userId;
  if (messageData.messageType === "text") {
    return isCurrentUser
      ? messageData.messageContent
      : `${getUserName(messageData.senderId)}: ${messageData.messageContent}`;
  }
  const action = isCurrentUser
    ? "You send"
    : `${getUserName(messageData.senderId)} send`;
  return `${action} a ${messageData.messageType.toLowerCase()}`;
};

const sortGroupsByLastMessageTime = (groups) => {
  return [...groups].sort((a, b) => {
    // 两个群组都没有消息时间，保持原顺序
    if (!a.lastMessageTime && !b.lastMessageTime) return 0;
    // 只有a有消息时间，a排前面
    if (a.lastMessageTime && !b.lastMessageTime) return -1;
    // 只有b有消息时间，b排前面
    if (!a.lastMessageTime && b.lastMessageTime) return 1;

    // 比较时间戳（seconds和nanoseconds）
    const aTime =
      a.lastMessageTime.seconds + a.lastMessageTime.nanoseconds / 1e9;
    const bTime =
      b.lastMessageTime.seconds + b.lastMessageTime.nanoseconds / 1e9;

    // 降序排列（最近的在前）
    return bTime - aTime;
  });
};

// 选择默认群组
const selectDefaultGroup = (sortedGroups) => {
  // 1. 先找 isPinned && !isDisband 的群组（按已排序的顺序）
  const pinnedActive = sortedGroups.find((g) => g.isPinned && !g.isDisband);
  if (pinnedActive) {
    handleGroupSelect(pinnedActive.id);
    return;
  }

  // 2. 再找 !isPinned && !isDisband 的群组（按已排序的顺序）
  const unpinnedActive = sortedGroups.find((g) => !g.isPinned && !g.isDisband);
  if (unpinnedActive) {
    handleGroupSelect(unpinnedActive.id);
    return;
  }

  // 3. 最后选择第一个群组（已排序）
  handleGroupSelect(sortedGroups[0].id);
};

// 修改 setupRealTimeListeners 函数：
const setupRealTimeListeners = (userId, initialGroups) => {
  const unsubscribeCallbacks = [];

  // 为每个群组设置消息监听器
  initialGroups.forEach((group) => {
    const messagesQuery = query(
      collection(db, "chatroom", group.id, "messages"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(messagesQuery, (messagesSnapshot) => {
      if (!messagesSnapshot.empty) {
        const lastMessageDoc = messagesSnapshot.docs[0];
        const lastMessageData = lastMessageDoc.data();

        // 创建更新后的群组数组
        const updatedGroups = groups.value.map((g) => {
          if (g.id === group.id) {
            return {
              ...g,
              lastMessage: formatLastMessage(lastMessageData, userId),
              lastMessageTime: lastMessageData.createdAt,
            };
          }
          return g;
        });

        // 重新排序
        const sortedGroups = sortGroupsByLastMessageTime(updatedGroups);

        // 更新响应式数据
        groups.value = sortedGroups;
      }
    });

    unsubscribeCallbacks.push(unsubscribe);
  });

  return () => {
    unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
  };
};

const getUserName = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data().username;
    }
    return "Unknown User"; // 如果用戶不存在，返回默認值
  } catch (error) {
    console.error("Error fetching user:", error);
    return "Unknown User";
  }
};

const authUnsubscribe = auth.onAuthStateChanged((user) => {
  if (user) {
    fetchGroups(user.uid);
    currentGroupMutedState.value = user.isMuted;
    currentGroupPinnedState.value = user.isPinned;
    currentUserId.value = user.uid;
  } else {
    groups.value = [];
  }
});

onUnmounted(() => {
  authUnsubscribe();
  if (unsubscribeMessages) {
    unsubscribeMessages();
  }
});

//pin and mute

const handleToggleMute = async (newMutedState) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId || !selectedGroupId.value) return;

    const chatroomUserDocRef = doc(
      db,
      "chatroom_user",
      `${selectedGroupId.value}_${userId}`
    );

    await updateDoc(chatroomUserDocRef, {
      isMuted: newMutedState,
    });

    currentGroupMutedState.value = newMutedState;

    // Update local state
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

const handleTogglePin = async (newPinnedState) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId || !selectedGroupId.value) return;

    const chatroomUserDocRef = doc(
      db,
      "chatroom_user",
      `${selectedGroupId.value}_${userId}`
    );

    await updateDoc(chatroomUserDocRef, {
      isPinned: newPinnedState,
    });

    currentGroupPinnedState.value = newPinnedState;

    // Update local state
    const memberIndex = selectedGroupMembers.value.findIndex(
      (m) => m.id === userId
    );
    if (memberIndex !== -1) {
      selectedGroupMembers.value[memberIndex].isPinned = newPinnedState;
    }

    // Refresh groups list to reflect pin changes
    await fetchGroups(userId);
  } catch (error) {
    console.error("Error toggling pin:", error);
  }
};
</script>
