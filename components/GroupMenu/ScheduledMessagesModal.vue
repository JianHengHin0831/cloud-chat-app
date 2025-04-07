<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto"
    >
      <!-- Header with close button -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold mb-4 dark:text-white">
          Scheduled Messages
        </h2>
        <button
          @click="closeModal"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <Icon icon="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b dark:border-gray-700 mb-4">
        <button
          @click="activeTab = 'scheduled'"
          :class="[
            'py-2 px-4 font-medium',
            activeTab === 'scheduled'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400',
          ]"
        >
          Scheduled
        </button>
        <button
          @click="activeTab = 'create'"
          :class="[
            'py-2 px-4 font-medium',
            activeTab === 'create'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400',
          ]"
        >
          Create New
        </button>
      </div>

      <!-- Scheduled Messages List -->
      <div v-if="activeTab === 'scheduled'" class="space-y-4">
        <div v-if="loading" class="text-center py-4">
          <p class="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
        <div
          v-else-if="scheduledMessages.length === 0"
          class="text-center py-4"
        >
          <p class="text-gray-500 dark:text-gray-400">No scheduled messages</p>
        </div>
        <div
          v-else
          v-for="message in scheduledMessages"
          :key="message.id"
          class="border dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700"
        >
          <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-medium dark:text-white">
              {{ formatDateTime(message.scheduledFor) }}
            </span>
            <div class="flex space-x-2">
              <button
                @click="editMessage(message)"
                class="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <Icon icon="lucide:edit" class="w-4 h-4" />
              </button>
              <button
                @click="confirmDelete(message.id)"
                class="text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                <Icon icon="lucide:trash-2" class="w-4 h-4" />
              </button>
            </div>
          </div>
          <p
            class="text-gray-800 dark:text-gray-200 break-words"
            v-if="message.messageType === 'text'"
          >
            {{ message.messageContent }}
          </p>
          <div v-if="message.messageType === 'file'" class="mt-2">
            <div class="flex items-center text-sm text-blue-500">
              <Icon icon="lucide:paperclip" class="w-4 h-4 mr-1" />
              <span>{{ getFileName(message.messageContent) }}</span>
            </div>
          </div>
          <div v-if="message.files && message.files.length > 0" class="mt-2">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Attachments:
            </p>
            <div
              v-for="(file, index) in message.files"
              :key="index"
              class="flex items-center text-sm text-blue-500 ml-2"
            >
              <Icon icon="lucide:paperclip" class="w-4 h-4 mr-1" />
              <span>{{ getFileName(file) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Create/Edit Form -->
      <div v-if="activeTab === 'create'" class="space-y-4">
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Message
          </label>
          <textarea
            v-model="newMessage.messageContent"
            rows="4"
            class="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Type your message here..."
          ></textarea>

          <!-- Emoji Picker -->
          <div class="relative mt-2">
            <button
              ref="emojiButtonRef"
              @click="showEmojiPicker = !showEmojiPicker"
              class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg"
              type="button"
            >
              <Icon icon="lucide:smile" class="w-5 h-5" />
            </button>
            <div
              ref="emojiPickerRef"
              v-if="showEmojiPicker"
              class="absolute bottom-10 z-50"
              style="position: fixed; transform: translateY(-100%)"
            >
              <Picker
                class="emoji-picker"
                :data="emojiIndex"
                @select="addEmoji"
                :set="'twitter'"
                title="Pick an emoji..."
                emoji="point_up"
                :style="{ width: '320px' }"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Schedule Date & Time
          </label>
          <input
            type="datetime-local"
            v-model="newMessage.scheduledFor"
            class="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <p v-if="dateError" class="mt-1 text-sm text-red-500">
            {{ dateError }}
          </p>
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Attach Files (Optional)
          </label>
          <input
            type="file"
            @change="handleFileChange"
            multiple
            class="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <!-- Selected Files Preview -->
        <div v-if="selectedFiles.length > 0" class="mt-2 space-y-2">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            Selected files:
          </p>
          <div
            v-for="(file, index) in selectedFiles"
            :key="index"
            class="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded"
          >
            <div class="flex items-center">
              <Icon icon="lucide:file" class="w-4 h-4 mr-2 text-blue-500" />
              <span
                class="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px]"
              >
                {{ file.name }}
              </span>
            </div>
            <button
              @click="removeFile(index)"
              class="text-red-500 hover:text-red-700"
              type="button"
            >
              <Icon icon="lucide:x" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Status Message -->
        <div
          v-if="statusMessage"
          :class="[
            'p-3 rounded-lg',
            statusType === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
          ]"
        >
          {{ statusMessage }}
        </div>

        <div class="flex justify-end space-x-3">
          <button
            @click="
              resetForm();
              activeTab = 'scheduled';
            "
            class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            @click="closeModal"
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
          <button
            @click="saveScheduledMessage"
            :disabled="!isFormValid || isSaving"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isSaving">Saving...</span>
            <span v-else>{{ isEditing ? "Update" : "Schedule" }}</span>
          </button>
        </div>
      </div>

      <!-- Close Button -->
      <button
        @click="$emit('close')"
        class="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <Icon icon="lucide:x" class="w-5 h-5" />
      </button>
    </div>
  </div>
  <!-- Delete Confirmation -->
  <div
    v-if="showDeleteConfirm"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50"
    style="position: fixed; top: 0; left: 0; right: 0; bottom: 0"
  >
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-80">
      <h3 class="text-lg font-semibold mb-4 dark:text-white">Confirm Delete</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-6">
        Are you sure you want to delete this scheduled message?
      </p>
      <div class="flex justify-end space-x-3">
        <button
          @click="showDeleteConfirm = false"
          class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          @click="deleteScheduledMessage"
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { Icon } from "@iconify/vue";
import {
  ref as dbRef,
  onValue,
  push,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
  get,
} from "firebase/database";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { db, storage, auth } from "~/firebase/firebase.js";
import { EmojiIndex, Picker } from "emoji-mart-vue-fast/src";
import data from "emoji-mart-vue-fast/data/all.json";
import "emoji-mart-vue-fast/css/emoji-mart.css";
import { logEvent, trackMetric } from "~/utils/logging";
import { sendNotification } from "~/utils/sendNotification";

// State
const props = defineProps({
  groupId: {
    type: String,
    required: true,
  },
  groupData: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["close"]);

// 关闭模态框
const closeModal = () => {
  // 如果有未保存的更改，可以在这里添加确认提示
  emit("close");
};

const activeTab = ref("scheduled");
const scheduledMessages = ref([]);
const loading = ref(true);
const isSaving = ref(false);
const showDeleteConfirm = ref(false);
const messageToDeleteId = ref(null);
const statusMessage = ref("");
const statusType = ref("");
const isEditing = ref(false);
const selectedFiles = ref([]);
const showEmojiPicker = ref(false);
const emojiPickerRef = ref(null);
const emojiButtonRef = ref(null);
const emojiIndex = new EmojiIndex(data);

// New message form
const newMessage = ref({
  messageContent: "",
  messageType: "text",
  scheduledFor: "",
  id: null,
  files: [],
});

// Computed
const isFormValid = computed(() => {
  // 检查是否有消息内容或文件
  const hasContent =
    newMessage.value.messageContent.trim() !== "" ||
    selectedFiles.value.length > 0;

  // 检查日期是否有效且在未来
  const scheduledDate = new Date(newMessage.value.scheduledFor).getTime();
  const now = Date.now();
  const isValidFutureDate = !isNaN(scheduledDate) && scheduledDate > now;

  return hasContent && isValidFutureDate;
});

// 添加日期验证错误提示
const dateError = computed(() => {
  if (!newMessage.value.scheduledFor) return "";

  const scheduledDate = new Date(newMessage.value.scheduledFor).getTime();
  const now = Date.now();

  if (isNaN(scheduledDate)) {
    return "Please enter a valid date and time";
  }

  if (scheduledDate <= now) {
    return "Scheduled time must be in the future";
  }

  return "";
});

// Methods
const fetchScheduledMessages = async () => {
  loading.value = true;
  try {
    const messagesRef = dbRef(
      db,
      `chatrooms/${props.groupId}/scheduledMessages`
    );
    const userQuery = query(
      messagesRef,
      orderByChild("senderId"),
      equalTo(auth.currentUser.uid)
    );
    const snapshot = await get(userQuery);

    if (snapshot.exists()) {
      const messages = [];
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });

      // Sort by scheduled time
      scheduledMessages.value = messages.sort(
        (a, b) => a.scheduledFor - b.scheduledFor
      );
    } else {
      scheduledMessages.value = [];
    }
  } catch (error) {
    console.error("Error fetching scheduled messages:", error);
    showStatus("Failed to load scheduled messages", "error");
  } finally {
    loading.value = false;
  }
};

const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const getFileName = (url) => {
  if (!url) return "";
  const parts = url.split("/");
  return parts[parts.length - 1].split("?")[0];
};

const resetForm = () => {
  newMessage.value = {
    messageContent: "",
    messageType: "text",
    scheduledFor: "",
    id: null,
    files: [],
  };
  selectedFiles.value = [];
  isEditing.value = false;
  showEmojiPicker.value = false;

  // Set default scheduled time to 1 hour from now
  const now = new Date();
  now.setMinutes(now.getMinutes() + 61);
  newMessage.value.scheduledFor = now.toISOString().slice(0, 16);
};

const editMessage = (message) => {
  // Convert timestamp to local datetime-local format
  const date = new Date(message.scheduledFor);
  const localDatetime = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16);

  newMessage.value = {
    messageContent: message.messageContent,
    messageType: message.messageType,
    scheduledFor: localDatetime,
    id: message.id,
    files: message.files || [],
  };

  isEditing.value = true;
  activeTab.value = "create";
};

const handleFileChange = (event) => {
  const files = Array.from(event.target.files);
  if (files.length > 0) {
    selectedFiles.value = [...selectedFiles.value, ...files];
  }
};

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

const addEmoji = (emoji) => {
  newMessage.value.messageContent += emoji.native;
  showEmojiPicker.value = false;
};

const uploadFile = async (file) => {
  if (!file) return null;

  const fileRef = storageRef(
    storage,
    `scheduledMessages/${props.groupId}/${Date.now()}_${file.name}`
  );
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
};

const saveScheduledMessage = async () => {
  if (!isFormValid.value) return;

  const startTime = Date.now();
  isSaving.value = true;
  statusMessage.value = "";

  try {
    // Upload all files first
    const uploadedFiles = [];
    if (selectedFiles.value.length > 0) {
      for (const file of selectedFiles.value) {
        const fileUrl = await uploadFile(file);
        if (fileUrl) {
          uploadedFiles.push(fileUrl);
        }
      }
    }

    const scheduledTime = new Date(newMessage.value.scheduledFor).getTime();

    // Determine message type based on content
    let messageType = "text";
    if (
      newMessage.value.messageContent.trim() === "" &&
      uploadedFiles.length > 0
    ) {
      messageType = "file";
    }

    const messageData = {
      messageContent: newMessage.value.messageContent,
      messageType: messageType,
      scheduledFor: scheduledTime,
      senderId: auth.currentUser.uid,
      createdAt: Date.now(),
      files: uploadedFiles,
    };

    if (isEditing.value) {
      // Update existing message
      const messageRef = dbRef(
        db,
        `chatrooms/${props.groupId}/scheduledMessages/${newMessage.value.id}`
      );
      await update(messageRef, messageData);

      // 发送通知给管理员
      await sendNotification({
        userIds: [auth.currentUser.uid], // 只通知当前用户
        title: "Scheduled Message Updated",
        body: `Your scheduled message in ${
          props.groupData?.name || "the group"
        } has been updated`,
        chatroomId: props.groupId,
        isSaveNotification: true,
        excludeMuted: true,
      });

      // Log successful update
      logEvent("update_scheduled_message_success", {
        groupId: props.groupId,
        userId: auth.currentUser.uid,
        messageId: newMessage.value.id,
        messageType: messageType,
        scheduledFor: scheduledTime,
        hasFiles: uploadedFiles.length > 0,
        timestamp: new Date().toISOString(),
      });

      showStatus("Message updated successfully", "success");
    } else {
      // Create new message
      const messagesRef = dbRef(
        db,
        `chatrooms/${props.groupId}/scheduledMessages`
      );
      const newMessageRef = await push(messagesRef, messageData);

      // 发送通知给管理员
      await sendNotification({
        userIds: [auth.currentUser.uid], // 只通知当前用户
        title: "Message Scheduled",
        body: `Your message has been scheduled in ${
          props.groupData?.name || "the group"
        }`,
        chatroomId: props.groupId,
        isSaveNotification: true,
        excludeMuted: true,
      });

      // Log successful creation
      logEvent("create_scheduled_message_success", {
        groupId: props.groupId,
        userId: auth.currentUser.uid,
        messageId: newMessageRef.key,
        messageType: messageType,
        scheduledFor: scheduledTime,
        hasFiles: uploadedFiles.length > 0,
        timestamp: new Date().toISOString(),
      });

      showStatus("Message scheduled successfully", "success");
    }

    // Track metrics
    trackMetric("scheduled_message_operation_duration", Date.now() - startTime);
    trackMetric(
      isEditing.value
        ? "update_scheduled_message_success_count"
        : "create_scheduled_message_success_count",
      1
    );

    resetForm();
    fetchScheduledMessages();
    activeTab.value = "scheduled";
  } catch (error) {
    console.error("Error saving scheduled message:", error);

    // Log failure
    logEvent(
      isEditing.value
        ? "update_scheduled_message_failure"
        : "create_scheduled_message_failure",
      {
        groupId: props.groupId,
        userId: auth.currentUser.uid,
        messageId: isEditing.value ? newMessage.value.id : null,
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    );

    // Track failure metric
    trackMetric(
      isEditing.value
        ? "update_scheduled_message_failure_count"
        : "create_scheduled_message_failure_count",
      1
    );

    showStatus("Failed to schedule message", "error");
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = (id) => {
  messageToDeleteId.value = id;
  showDeleteConfirm.value = true;

  // 确保状态更新后再显示对话框
  nextTick(() => {
    if (!showDeleteConfirm.value) {
      showDeleteConfirm.value = true;
    }
  });
};

const deleteScheduledMessage = async () => {
  if (!messageToDeleteId.value) return;

  const startTime = Date.now();
  try {
    const messageRef = dbRef(
      db,
      `chatrooms/${props.groupId}/scheduledMessages/${messageToDeleteId.value}`
    );
    await remove(messageRef);

    // 发送通知给管理员
    await sendNotification({
      userIds: [auth.currentUser.uid], // 只通知当前用户
      title: "Scheduled Message Deleted",
      body: `Your scheduled message in ${
        props.groupData?.name || "the group"
      } has been deleted`,
      chatroomId: props.groupId,
      isSaveNotification: true,
      excludeMuted: true,
    });

    // Log successful deletion
    logEvent("delete_scheduled_message_success", {
      groupId: props.groupId,
      userId: auth.currentUser.uid,
      messageId: messageToDeleteId.value,
      timestamp: new Date().toISOString(),
    });

    // Track metrics
    trackMetric("delete_scheduled_message_duration", Date.now() - startTime);
    trackMetric("delete_scheduled_message_success_count", 1);

    showStatus("Message deleted successfully", "success");
    fetchScheduledMessages();
  } catch (error) {
    console.error("Error deleting scheduled message:", error);

    // Log failure
    logEvent("delete_scheduled_message_failure", {
      groupId: props.groupId,
      userId: auth.currentUser.uid,
      messageId: messageToDeleteId.value,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    // Track failure metric
    trackMetric("delete_scheduled_message_failure_count", 1);

    showStatus("Failed to delete message", "error");
  } finally {
    showDeleteConfirm.value = false;
    messageToDeleteId.value = null;
  }
};

const showStatus = (message, type) => {
  statusMessage.value = message;
  statusType.value = type;
  setTimeout(() => {
    statusMessage.value = "";
  }, 3000);
};

// Initialize
onMounted(() => {
  fetchScheduledMessages();

  // Set default scheduled time to 1 hour from now
  const now = new Date();
  now.setMinutes(now.getMinutes() + 61);
  newMessage.value.scheduledFor = now.toISOString().slice(0, 16);

  // Add click outside listener
  document.addEventListener("click", handleClickOutside);
});

// Remove event listener on component unmount
onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Handle click outside of emoji picker
const handleClickOutside = (event) => {
  if (showEmojiPicker.value) {
    const emojiPickerElement = emojiPickerRef.value;
    const emojiButtonElement = emojiButtonRef.value;

    // Check if click is outside both the picker and the button
    if (
      emojiPickerElement &&
      emojiButtonElement &&
      !emojiPickerElement.contains(event.target) &&
      !emojiButtonElement.contains(event.target)
    ) {
      showEmojiPicker.value = false;
    }
  }
};
</script>

<style>
.emoji-picker {
  position: relative;
  z-index: 9999 !important;
}

/* 确保 emoji-mart 容器不会被截断 */
.emoji-mart {
  overflow: visible !important;
}

/* 确保所有 emoji-mart 子元素也不会被截断 */
/* .emoji-mart * {
  overflow: visible !important;
} */
</style>
