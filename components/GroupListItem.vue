<template>
  <div
    class="flex items-center space-x-3 cursor-pointer p-2 rounded-lg"
    :class="isSelected ? 'bg-blue-100' : 'bg-white hover:bg-gray-100'"
    @click="handleClick"
  >
    <!-- Group Image -->
    <div class="relative">
      <img
        :src="group.photoUrl"
        alt="Group Icon"
        class="w-10 h-10 rounded-lg"
      />
      <!-- Status Icons -->
      <div class="absolute -top-1 -right-1 flex space-x-1">
        <!-- Pin Icon for Pinned Groups -->
        <div
          v-if="group.isPinned && !group.isDisband"
          class="bg-green-500 rounded-full p-1"
          title="Pinned Group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-3 w-3 text-white"
            viewBox="0 0 32 32"
          >
            <path
              d="m20.53125 2.5625-.6875.9375-4.90625 6.6875c-2.628906-.457031-5.410156.285156-7.4375 2.3125l-.71875.6875 5.3125 5.3125-8.09375 8.09375v1.40625h1.40625l8.09375-8.09375 5.3125 5.3125.6875-.71875c2.027344-2.027344 2.769531-4.808594 2.3125-7.4375l6.6875-4.90625.9375-.6875zm.25 3.0625 5.59375 5.59375-6.21875 4.5625-.5625.40625.1875.65625c.480469 1.832031-.042969 3.742188-1.1875 5.34375l-8.78125-8.78125c1.601563-1.144531 3.511719-1.667969 5.34375-1.1875l.65625.1875.40625-.5625z"
            />
          </svg>
        </div>
        <!-- Ban Icon for Inactive Groups -->
        <div
          v-if="group.isDisband"
          class="bg-red-500 rounded-full p-1"
          title="Inactive Group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
      </div>
      <!-- Unread Count Badge -->
      <div
        v-if="group.unreadCount > 0 && !isSelected"
        class="absolute -top-3 -left-3 bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center"
      >
        {{ isSelected ? 0 : group.unreadCount }}
      </div>
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold text-gray-800">{{ group.name }}</h4>
      </div>
      <p
        v-if="group.lastMessageType === 'deleted'"
        class="text-sm text-gray-500 line-clamp-2 overflow-hidden"
      >
        <span class="text-gray-500 italic">
          This message has been deleted
        </span>
      </p>
      <p v-else class="text-sm text-gray-500 line-clamp-2 overflow-hidden">
        {{ group.lastMessage }}
      </p>
    </div>

    <!-- Status and Time (aligned vertically and to the right) -->
    <div class="flex flex-col items-end justify-center space-y-1">
      <span
        class="w-3 h-3 rounded-full flex-shrink-0"
        :class="isActive ? 'bg-green-500' : 'bg-gray-400'"
      ></span>

      <span class="text-xs text-gray-400 leading-none flex-shrink-0"
        >{{ formatTime(group.lastMessageTime) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const emit = defineEmits(["click"]);

const handleClick = () => {
  emit("click", props.group.id);
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

  const currentTime = new Date();

  const messageTime = new Date(props.group.lastMessageTime);

  const timeDiff = currentTime - messageTime;

  return timeDiff <= 5 * 60 * 1000;
});

const formatTime = (timestamp) => {
  if (!timestamp) return "";

  const currentTime = new Date();

  const messageTime = new Date(timestamp);

  const timeDiff = currentTime - messageTime;

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const YEAR = 365 * DAY;

  if (timeDiff < MINUTE) {
    const seconds = Math.floor(timeDiff / SECOND);
    return `${seconds}s`;
  } else if (timeDiff < HOUR) {
    const minutes = Math.floor(timeDiff / MINUTE);
    return `${minutes}min`;
  } else if (timeDiff < DAY) {
    const hours = Math.floor(timeDiff / HOUR);
    return `${hours}h`;
  } else if (timeDiff < WEEK) {
    const days = Math.floor(timeDiff / DAY);
    return `${days}d`;
  } else if (timeDiff < YEAR) {
    return messageTime.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } else {
    const years = Math.floor(timeDiff / YEAR);
    return `${years}y`;
  }
};
</script>
