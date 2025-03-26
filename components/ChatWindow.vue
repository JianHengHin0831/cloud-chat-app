<template>
  <div class="flex flex-col bg-white rounded-lg my-3 mx-2 relative">
    <!-- Header -->
    <div class="px-4 py-3 border-b flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <div
          class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"
        >
          <img
            :src="groupData?.photoUrl || '/images/user_avatar.png'"
            alt="Group Avatar"
            class="w-8 h-8 rounded-full"
          />
        </div>
        <div>
          <h2 class="text-base font-semibold">
            {{ groupData?.name || "Loading..." }}
          </h2>
        </div>
      </div>

      <GroupMenu
        :selectedGroupId="selectedGroupId"
        :groupData="groupData"
        :membersData="membersData"
      />
    </div>

    <!-- Chat content -->
    <div
      class="flex-1 overflow-y-auto max-h-[80vh] p-4 space-y-6 flex flex-col-reverse"
      @scroll="handleScroll"
      ref="chatContent"
    >
      <!-- Messages -->
      <div v-for="msg in sortedMessages" :key="msg.id" class="flex">
        <!-- Load more button -->
        <div v-if="hasMoreMessages" class="text-center">
          <button
            @click="loadMoreMessages"
            class="text-blue-500 hover:text-blue-700"
          >
            Load more messages...
          </button>
        </div>
        <!-- Other users: Avatar, name, timestamp, and message -->
        <template v-if="msg.senderId !== userId">
          <!-- Avatar -->
          <div class="flex items-start mr-2">
            <img
              :src="getUserAvatar(msg.senderId)"
              class="w-10 h-10 rounded-full"
            />
          </div>

          <!-- Name, timestamp, and message -->
          <div class="flex flex-col flex-1">
            <!-- Name and timestamp -->
            <div class="flex items-center mb-1">
              <span class="font-semibold text-sm">{{
                getUserName(msg.senderId)
              }}</span>
              <span class="text-gray-400 text-xs ml-2">{{
                formatTime(msg.createdAt)
              }}</span>
            </div>

            <!-- Message bubble -->
            <div
              class="rounded-2xl px-4 py-2 max-w-xs bg-gray-100 text-gray-800"
            >
              <!-- Text Message -->
              <p v-if="msg.messageType === 'text'" class="text-sm">
                {{ msg.messageContent }}
              </p>

              <!-- Image Message -->
              <div
                v-else-if="msg.messageType === 'image'"
                class="flex flex-col gap-2"
                @click="
                  openFilePreview(
                    msg.messageContent,
                    extractFileName(msg.messageContent)
                  )
                "
              >
                <img
                  :src="msg.messageContent"
                  class="max-w-full h-auto rounded-lg cursor-pointer"
                />
              </div>

              <!-- Video Message -->
              <div
                v-else-if="msg.messageType === 'video'"
                class="flex flex-col gap-2"
                @click="
                  openFilePreview(
                    msg.messageContent,
                    extractFileName(msg.messageContent)
                  )
                "
              >
                <video
                  :src="msg.messageContent"
                  controls
                  class="!max-w-full max-h-[300px] w-auto h-auto rounded-lg cursor-pointer"
                ></video>
              </div>

              <!-- File Message (PDF, EXE, etc.) -->
              <div
                v-else
                class="flex flex-col items-center gap-3 cursor-pointer p-3 hover:bg-gray-100 rounded-lg bg-gray-50"
                @click="
                  openFilePreview(
                    msg.messageContent,
                    extractFileName(msg.messageContent)
                  )
                "
              >
                <!-- PDF Icon -->
                <font-awesome-icon
                  v-if="extractFileName(msg.messageContent).endsWith('.pdf')"
                  :icon="['far', 'file-pdf']"
                  class="w-12 h-12 text-[#FF0000]"
                />
                <!-- Word Icon -->
                <font-awesome-icon
                  v-else-if="
                    extractFileName(msg.messageContent).match(/\.(doc|docx)$/)
                  "
                  :icon="['far', 'file-word']"
                  class="w-12 h-12 text-[#2B579A]"
                />
                <!-- PowerPoint Icon -->
                <font-awesome-icon
                  v-else-if="
                    extractFileName(msg.messageContent).match(/\.(ppt|pptx)$/)
                  "
                  :icon="['far', 'file-powerpoint']"
                  class="w-12 h-12 text-[#D24726]"
                />
                <!-- Excel Icon -->
                <font-awesome-icon
                  v-else-if="
                    extractFileName(msg.messageContent).match(
                      /\.(xls|xlsx|csv)$/
                    )
                  "
                  :icon="['far', 'file-excel']"
                  class="w-12 h-12 text-[#217346]"
                />
                <!-- Text Icon -->
                <font-awesome-icon
                  v-else-if="
                    extractFileName(msg.messageContent).endsWith('.txt')
                  "
                  :icon="['far', 'file-text']"
                  class="w-12 h-12 text-[#4A4A4A]"
                />
                <!-- Default File Icon -->
                <font-awesome-icon
                  v-else
                  :icon="['far', 'file']"
                  class="w-12 h-12 text-[#909090]"
                />
                <!-- File Name -->
                <span class="text-sm text-gray-700 text-center break-all">{{
                  extractFileName(msg.messageContent)
                }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Current user: Timestamp, name, avatar, and message -->
        <template v-else>
          <!-- Name, timestamp, and message -->
          <div class="flex flex-col flex-1 items-end">
            <!-- Timestamp and name -->
            <div class="flex items-center mb-1">
              <span class="text-gray-400 text-xs mr-2">{{
                formatTime(msg.createdAt)
              }}</span>
              <span class="font-semibold text-xs">You</span>
            </div>

            <!-- Message bubble -->
            <div
              class="rounded-2xl bg-blue-500 text-white"
              :class="msg.messageType === 'text' ? 'px-4 py-2 max-w-xs' : ''"
            >
              <!-- Text Message -->
              <p v-if="msg.messageType === 'text'" class="text-sm">
                {{ msg.messageContent }}
              </p>

              <!-- Image Message -->
              <div
                v-else-if="msg.messageType === 'image'"
                class="flex flex-col"
                @click="
                  openFilePreview(
                    msg.messageContent,
                    extractFileName(msg.messageContent)
                  )
                "
              >
                <img
                  :src="msg.messageContent"
                  class="max-w-full h-auto rounded-lg cursor-pointer"
                />
              </div>

              <!-- Video Message -->
              <div
                v-else-if="msg.messageType === 'video'"
                class="flex flex-col"
                @click="
                  openFilePreview(
                    msg.messageContent,
                    extractFileName(msg.messageContent)
                  )
                "
              >
                <video
                  :src="msg.messageContent"
                  controls
                  class="!max-w-full max-h-[300px] w-auto h-auto rounded-lg cursor-pointer"
                ></video>
              </div>

              <!-- File Message (PDF, EXE, etc.) -->
              <div
                v-else
                class="flex flex-col items-center gap-3 cursor-pointer p-3 hover:bg-gray-100 rounded-lg bg-gray-50"
                @click="
                  openFilePreview(
                    msg.messageContent,
                    extractFileName(msg.messageContent)
                  )
                "
              >
                <font-awesome-icon
                  :icon="getFileIcon(msg.messageContent)"
                  :class="['w-12 h-12', getFileIconColor(msg.messageContent)]"
                />

                <!-- File Name -->
                <span class="text-sm text-gray-700 text-center break-all">{{
                  extractFileName(msg.messageContent)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Avatar -->
          <div class="flex items-start ml-2">
            <img
              :src="getUserAvatar(msg.senderId)"
              class="w-10 h-10 rounded-full"
            />
          </div>
        </template>
      </div>

      <button
        v-show="showScrollButton"
        @click="scrollToBottom"
        class="absolute bottom-24 right-6 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
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
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>
    </div>

    <!-- Input area -->
    <div class="relative pl-4 py-3 border-t flex items-center">
      <!-- Emoji Picker -->
      <div class="absolute bottom-full left-0 w-full" v-if="showEmojiPicker">
        <Picker
          :data="emojiIndex"
          set="twitter"
          @select="showEmoji"
          class="!w-full"
        />
      </div>

      <!-- File Upload Area -->
      <!-- 修改后的文件上传区域 -->
      <div class="absolute bottom-full left-0 w-full" v-if="showFileUpload">
        <div
          class="p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center"
          @drop.prevent="handleFileDrop"
          @dragover.prevent="handleDragOver"
          @dragenter.prevent="handleDragEnter"
          @dragleave.prevent="handleDragLeave"
          :class="{ 'border-blue-400 bg-blue-50': isDragging }"
        >
          <p class="text-gray-500 mb-2">Drag and drop files here</p>
          <button
            @click="openFileBrowser"
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Browse Files
          </button>
          <input
            type="file"
            ref="fileInput"
            class="hidden"
            multiple
            @change="handleFileSelect"
          />
        </div>

        <!-- 改进的文件列表显示 -->
        <div
          v-if="filesToUpload.length > 0"
          class="mt-2 bg-white rounded-lg shadow p-3 max-h-40 overflow-y-auto"
        >
          <div
            v-for="(file, index) in filesToUpload"
            :key="index"
            class="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded"
          >
            <span class="text-sm truncate max-w-xs">{{ file.name }}</span>
            <span class="text-xs text-gray-500 ml-2">{{
              formatFileSize(file.size)
            }}</span>
            <button
              @click="removeFile(index)"
              class="text-red-500 hover:text-red-700 ml-2"
            >
              &times;
            </button>
          </div>
        </div>
      </div>

      <!-- 顯示已選擇的文件名 -->

      <!-- Plus Button -->
      <button
        @click="toggleFileUpload"
        class="text-gray-400 w-8 h-8 flex items-center justify-center"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      <!-- Message Input -->
      <div
        class="bg-gray-100 rounded-2xl w-full flex justify-center items-center"
      >
        <input
          v-model="newMessage"
          type="text"
          placeholder="Type your message..."
          class="w-full bg-transparent mx-2 outline-none border-none focus:border-none focus:ring-0 focus:outline-none shadow-none text-gray-800"
          @keydown.enter="handleEnter"
        />
        <button
          @click="toggleEmojiPicker"
          class="text-gray-400 w-8 h-8 flex items-center justify-center"
        >
          <img src="@/assets/emoji.png" alt="emoji icon" class="w-6 h-6 mr-2" />
        </button>
      </div>

      <!-- Send Button -->
      <button
        @click="handleSend"
        class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-3"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
          />
        </svg>
      </button>
    </div>
    <!-- Media Viewer Component -->
    <!-- <MediaViewer ref="mediaViewer" /> -->
    <div
      v-if="loading"
      class="fixed top-0 bottom-0 left-0 right-0 bg-gray-800/70 bg-opacity-70 z-50 flex items-center justify-center"
    >
      <div
        class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"
      ></div>
    </div>
    <FilePreview
      v-if="showFilePreview"
      :fileUrl="previewFileUrl"
      :fileName="previewFileName"
      @close="closeFilePreview"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "~/firebase/firebase.js";
import GroupMenu from "~/components/GroupMenu/GroupMenu.vue";

const props = defineProps({
  selectedGroupId: String,
  userId: String,
  groupData: Object,
  membersData: Array,
  messages: {
    type: Array,
    default: () => [],
  },
  hasMoreMessages: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["loadMore"]);

// 加載更多消息
const loadMoreMessages = async () => {
  if (props.selectedGroupId) {
    emit("loadMore", props.selectedGroupId);
  }
};

const chatContent = ref(null);
const newMessage = ref("");
import { EmojiIndex, Picker } from "emoji-mart-vue-fast/src";
//const Picker = defineAsyncComponent(() => import("emoji-mart-vue-fast"));
import data from "emoji-mart-vue-fast/data/all.json";
import "emoji-mart-vue-fast/css/emoji-mart.css";
let emojiIndex = new EmojiIndex(data);
const emojisOutput = ref("");

// 處理 emoji 選擇
const showEmoji = (emoji) => {
  emojisOutput.value += emoji.native;
  newMessage.value += emoji.native;
};

// 計算屬性：將消息按時間升序排列
// const sortedMessages = computed(() => {
//   return [...messages.value]
//     .sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds)
//     .reverse();
// });

const showEmojiPicker = ref(false);
const showFileUpload = ref(false);
const filesToUpload = ref([]);
const fileInput = ref(null);
const loading = ref(false);

const extractFileName = (url) => {
  try {
    // 创建URL对象
    const urlObj = new URL(url);

    // 获取路径名并解码
    const pathname = decodeURIComponent(urlObj.pathname);

    // 提取文件名部分（最后一个斜杠后的内容）
    const filenameWithPrefix = pathname.split("/o/")[1].split("/").pop();

    // 去掉可能的时间戳前缀（格式：数字-）
    return filenameWithPrefix.replace(/^\d+-/, "");
  } catch (e) {
    console.error("Error parsing URL:", e);
    return null;
  }
};

// 切換文件上傳區域
const toggleFileUpload = () => {
  showFileUpload.value = !showFileUpload.value;
  if (showFileUpload.value) {
    showEmojiPicker.value = false; // 關閉 Emoji Picker
  }
};

const closeAllArea = () => {
  showFileUpload.value = false;
  showEmojiPicker.value = false;
};

import FilePreview from "~/components/ChatWindow/FilePreview.vue";

// 添加预览状态
const showFilePreview = ref(false);
const previewFileUrl = ref("");
const previewFileName = ref("");

// 打开预览
const openFilePreview = (url, fileName) => {
  previewFileUrl.value = url;
  previewFileName.value = fileName;
  showFilePreview.value = true;
};

// 关闭预览
const closeFilePreview = () => {
  showFilePreview.value = false;
};

// 打開文件瀏覽器
const openFileBrowser = () => {
  fileInput.value.click();
};

// 處理文件選擇
const handleFileSelect = (event) => {
  const selectedFiles = Array.from(event.target.files);
  filesToUpload.value = [...filesToUpload.value, ...selectedFiles];
};

const isDragging = ref(false);

const handleDragEnter = (event) => {
  event.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = (event) => {
  event.preventDefault();
  isDragging.value = false;
};

const handleDragOver = (event) => {
  event.preventDefault();
  isDragging.value = true;
};

const handleFileDrop = (event) => {
  event.preventDefault();
  isDragging.value = false;

  const droppedFiles = Array.from(event.dataTransfer.files);
  if (droppedFiles.length > 0) {
    filesToUpload.value = [...filesToUpload.value, ...droppedFiles];
  }
};

const removeFile = (index) => {
  filesToUpload.value = filesToUpload.value.filter((_, i) => i !== index);
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 移除文件
const handleEnter = async (event) => {
  if (event.key === "Enter") {
    await handleSend();
  }
};

// 處理按鈕點擊
const handleSend = async () => {
  loading.value = true;
  await uploadFiles();
  if (newMessage.value.trim() !== "") {
    await sendMessage();
  }
  closeAllArea();
  loading.value = false;

  nextTick(() => {
    if (chatContent.value) {
      scrollToBottom();
    }
  });
};

import { useScroll } from "@vueuse/core";
import { getFileIconColor } from "~/utils/fileUtils";

const { arrivedState } = useScroll(chatContent);

// 上傳文件
const uploadFiles = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  const idToken = await user.getIdToken();
  for (const file of filesToUpload.value) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatroomId", props.selectedGroupId);

    //props.value.selectedGroupId
    try {
      await fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${idToken}`, // 将 ID Token 作为请求头传递
        },
      });
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }

  // 清空文件列表
  filesToUpload.value = [];
  showFileUpload.value = false;
};

// 發送消息
const sendMessage = async () => {
  if (newMessage.value.trim() === "") return;

  try {
    const senderId = auth.currentUser?.uid;

    await addDoc(
      collection(db, "chatroom", props.selectedGroupId, "messages"),
      {
        senderId: senderId,
        messageContent: newMessage.value,
        messageType: "text",
        createdAt: serverTimestamp(),
      }
    );
    newMessage.value = ""; // 清空輸入框
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

// Toggle emoji picker visibility
const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
};

// 獲取用戶頭像
const getUserAvatar = (senderId) => {
  const member = props.membersData.find((member) => member.id === senderId);
  return member ? member.avatarUrl : "/images/group.png";
};

// 獲取用戶名
const getUserName = (senderId) => {
  const member = props.membersData.find((member) => member.id === senderId);
  return member ? member.username : "User";
};

// 格式化時間
const formatTime = (timestamp) => {
  if (!timestamp || !timestamp.seconds) return "";

  const date = new Date(
    timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
  );
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// 處理滾動事件
const handleScroll = (event) => {
  const { scrollTop } = event.target;
  if (scrollTop === 0 && props.hasMoreMessages) {
    loadMoreMessages();
  }
};

// 計算屬性：將消息按時間升序排列
const sortedMessages = computed(() => {
  return [...props.messages]
    .sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds)
    .reverse();
});

const scrollToBottom = () => {
  if (chatContent.value) {
    chatContent.value.scrollTo({
      top: chatContent.value.scrollHeight,
      behavior: "smooth",
    });
  }
};

const isAtBottom = ref(true);

// 计算属性控制按钮显示
const showScrollButton = computed(() => !arrivedState.bottom);

// 确保组件挂载时设置初始状态
onMounted(() => {
  if (chatContent.value) {
    isAtBottom.value = true;
  }
});
</script>

<style scoped>
.row {
  display: flex;
}
.row > * {
  margin: auto;
}

.absolute {
  position: absolute;
}

.bottom-full {
  bottom: 100%;
}

.w-full {
  width: 100%;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
}

.file-item {
  background-color: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #374151;
  display: flex;
  align-items: center;
}

.remove-button {
  margin-left: 0.5rem;
  color: #6b7280;
  cursor: pointer;
}

.remove-button:hover {
  color: #374151;
}

img {
  max-width: 100%;
  height: auto;
}

video {
  max-width: 100%;
  height: auto;
}

.file-icon {
  width: 32px;
  height: 32px;
}

.drop-zone {
  min-height: 120px;
  transition: all 0.2s ease;
}

.file-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.file-item {
  transition: background-color 0.2s;
  padding: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.file-item:hover {
  background-color: #f9fafb;
}

.file-item:last-child {
  border-bottom: none;
}

.remove-button {
  transition: color 0.2s;
  font-size: 1.2rem;
  line-height: 1;
}

.remove-button:hover {
  color: #dc2626;
}

/* 确保拖放区域在正确的位置 */
.absolute.bottom-full {
  z-index: 10;
  margin-bottom: 0.5rem;
}

.drop-zone.active {
  background-color: #ebf8ff; /* 浅蓝色背景作为反馈 */
  border-color: #4299e1; /* 蓝色边框 */
}
</style>
