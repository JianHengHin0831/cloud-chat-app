<template>
  <div
    class="flex items-center space-x-3 cursor-pointer p-2 rounded-lg"
    :class="isSelected ? 'bg-blue-100' : 'bg-white hover:bg-gray-100'"
    @click="handleClick"
  >
    <!-- Group Image -->
    <img :src="group.photoUrl" alt="Group Icon" class="w-10 h-10 rounded-lg" />

    <div class="flex-1 min-w-0">
      <h4 class="font-semibold text-gray-800">{{ group.name }}</h4>
      <p class="text-sm text-gray-500 line-clamp-2 overflow-hidden">
        {{ group.lastMessage }}
      </p>
    </div>

    <!-- Status and Time (aligned vertically and to the right) -->
    <div class="flex flex-col items-end justify-center space-y-1">
      <span
        class="w-3 h-3 rounded-full flex-shrink-0"
        :class="isActive ? 'bg-green-500' : 'bg-gray-400'"
      ></span>

      <span class="text-xs text-gray-400 leading-none flex-shrink-0">{{
        formatTime(group.lastMessageTime)
      }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const emit = defineEmits(["click"]); // 定义点击事件

// 处理点击事件
const handleClick = () => {
  emit("click", props.group.id); // 触发点击事件并传递群组 ID
};

const props = defineProps({
  group: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    required: true,
  },
});

// Ensure lastMessageTime is a number and check if it's within 30 minutes
const isActive = computed(() => {
  if (!props.group.lastMessageTime) return false;

  // 獲取當前時間
  const currentTime = new Date();

  // 將 Firestore Timestamp 轉換為 JavaScript Date
  const messageTime = new Date(
    props.group.lastMessageTime.seconds * 1000 +
      props.group.lastMessageTime.nanoseconds / 1000000
  );

  // 計算時間差（單位：毫秒）
  const timeDiff = currentTime - messageTime;

  // 如果時間差小於 5 分鐘（5 * 60 * 1000 毫秒），則為 true
  return timeDiff <= 5 * 60 * 1000;
});

const formatTime = (timestamp) => {
  if (!timestamp || !timestamp.seconds) return "";

  // 獲取當前時間
  const currentTime = new Date();

  // 將 Firestore Timestamp 轉換為 JavaScript Date
  const messageTime = new Date(
    timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
  );

  // 計算時間差（單位：毫秒）
  const timeDiff = currentTime - messageTime;

  // 定義時間常量
  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const YEAR = 365 * DAY;

  // 根據時間差格式化輸出
  if (timeDiff < MINUTE) {
    // 少於 1 分鐘
    const seconds = Math.floor(timeDiff / SECOND);
    return `${seconds}s`;
  } else if (timeDiff < HOUR) {
    // 少於 1 小時
    const minutes = Math.floor(timeDiff / MINUTE);
    return `${minutes}min`;
  } else if (timeDiff < DAY) {
    // 少於 1 天
    const hours = Math.floor(timeDiff / HOUR);
    return `${hours}h`;
  } else if (timeDiff < WEEK) {
    // 少於 1 週
    const days = Math.floor(timeDiff / DAY);
    return `${days}d`;
  } else if (timeDiff < YEAR) {
    // 少於 1 年
    return messageTime.toLocaleDateString("en-US", {
      weekday: "short", // 星期（縮寫）
      month: "short", // 月（縮寫）
      day: "numeric", // 日
    });
  } else {
    // 超過 1 年
    const years = Math.floor(timeDiff / YEAR);
    return `${years}y`;
  }
};
// // 格式化时间
// const formatTime = (timestamp) => {
//   if (!timestamp) return "";
//   const date = new Date(timestamp);
//   return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
// };

// // 判断群组是否活跃
// const isActive = computed(() => {
//   const lastMessageTime = props.group.lastMessageTime;
//   if (!lastMessageTime) return false;
//   const now = new Date();
//   const lastMessageDate = new Date(lastMessageTime);
//   return now - lastMessageDate < 5 * 60 * 1000; // 5 分钟内活跃
// });
</script>
