<template>
  <div
    class="flex flex-col bg-white dark:bg-gray-800 rounded-lg my-3 mx-2 relative transition-colors duration-200"
  >
    <!-- Header -->
    <div
      class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
    >
      <!-- Mobile Back Button and Title -->
      <div class="flex items-center space-x-2 md:hidden">
        <button @click="$emit('back')" class="flex items-center">
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div class="flex items-center space-x-2">
          <div
            class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center"
          >
            <img
              :src="groupData?.photoUrl || '/images/group.png'"
              alt="Group Avatar"
              class="w-8 h-8 rounded-full"
            />
          </div>
          <div class="status">
            <h2 class="dark:text-white">{{ groupData?.name }}</h2>
            <h2
              v-if="otherTypingUsers.length > 0"
              class="text-sm text-gray-500 dark:text-gray-400"
            >
              {{ getUserName(otherTypingUsers[0]) }} is typing...
            </h2>
            <h2
              v-else-if="onlineMembers.length > 0"
              class="text-sm text-gray-500 dark:text-gray-400"
            >
              {{ formatOnlineUsers(onlineMembers) }}
            </h2>
          </div>
        </div>
      </div>

      <!-- Desktop Header -->
      <div class="hidden md:flex items-center space-x-2">
        <div
          class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center"
        >
          <img
            :src="groupData?.photoUrl || '/images/group.png'"
            alt="Group Avatar"
            class="w-8 h-8 rounded-full"
          />
        </div>
        <div class="status">
          <h2 class="dark:text-white">{{ groupData?.name }}</h2>
          <h2
            v-if="otherTypingUsers.length > 0"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            {{ getUserName(otherTypingUsers[0]) }} is typing...
          </h2>
          <h2
            v-else-if="onlineMembers.length > 0"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            {{ formatOnlineUsers(onlineMembers) }}
          </h2>
        </div>
      </div>

      <!-- Group Menu and Mobile Group Info Button -->
      <div class="flex items-center space-x-2">
        <!-- Mobile and MD Group Info Button -->
        <button
          @click="$emit('showGroupInfo')"
          class="lg:hidden flex items-center"
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>

      <!-- Search Messages -->
      <div class="flex space-x-2">
        <div class="relative mt-[3px]">
          <button
            @click="showSearch = !showSearch"
            class="text-gray-500 dark:text-white hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <div
            v-if="showSearch"
            class="border border-gray-200 absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-50"
          >
            <div class="flex flex-col items-center mb-4">
              <!-- Search Input -->
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search messages..."
                class="flex-1 py-2 px-4 border rounded-lg w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                @input="handleSearch"
              />

              <!-- Matching Messages List -->
              <div
                v-if="matchedMessages.length > 0"
                class="max-h-60 overflow-y-auto w-full mt-4"
              >
                <div
                  v-for="msg in matchedMessages"
                  :key="msg.id"
                  @click="scrollToMessage(msg)"
                  class="py-2 px-3 w-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-lg mb-2 transition-colors duration-150"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span
                      class="text-sm font-medium text-gray-800 dark:text-gray-300 px-2"
                    >
                      {{ getUserName(msg.senderId) }}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400 px-2">
                      {{ formatTime(msg.createdAt) }}
                    </span>
                  </div>
                  <p
                    class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 px-2"
                    v-html="getHighlightedContent(msg)"
                  ></p>
                </div>
              </div>

              <!-- No Matches Found -->
              <div
                v-else-if="searchQuery"
                class="text-center text-gray-500 dark:text-gray-400 mt-4"
              >
                No matches found
              </div>
            </div>
          </div>
        </div>
        <GroupMenu
          :selectedGroupId="selectedGroupId"
          :groupData="groupData"
          :membersData="membersData"
          @toggleMenu="toggleMenu"
        />
      </div>
    </div>

    <!-- Chat content -->
    <div
      class="flex-1 overflow-y-auto max-h-[80vh] p-4 space-y-6 flex flex-col-reverse bg-white dark:bg-gray-800"
      @scroll="handleScroll"
      ref="chatContent"
    >
      <!-- Messages -->
      <div v-for="msg in messagesWithPending" :key="msg.id" class="flex">
        <!-- Load more button -->
        <div
          v-if="msg.messageType === 'system'"
          class="flex justify-center mx-auto my-1 px-2 max-w-[70%] xl:max-w-[50%] text-center"
        >
          <div
            class="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full"
            :class="{ 'bg-gray-300': msg.isTimeMarker }"
          >
            {{ msg.messageContent }}
          </div>
        </div>

        <!-- Other users: Avatar, name, timestamp, and message -->
        <template v-else-if="msg.senderId !== userId">
          <!-- Avatar -->
          <div class="flex items-start mr-2">
            <img
              :src="getUserAvatar(msg.senderId)"
              class="w-10 h-10 rounded-full"
            />
          </div>

          <!-- Name, timestamp, and message -->
          <div class="flex flex-col flex-1">
            <div class="flex items-center mb-1">
              <span class="font-semibold text-sm">{{
                getUserName(msg.senderId)
              }}</span>
              <span class="text-gray-400 text-xs ml-2">{{
                formatTime(msg.createdAt)
              }}</span>
              <!-- Pending message indicator -->
              <div v-if="msg.isPending" class="text-xs text-gray-400 ml-2">
                {{ msg.status === "failed" ? "Failed to send" : "Sending..." }}
              </div>
            </div>
            <!-- Name and timestamp -->
            <!-- Reaction button -->

            <!-- Message bubble -->
            <div class="flex">
              <div
                class="rounded-2xl bg-gray-300 text-gray-800"
                :class="
                  msg.messageType === 'text'
                    ? 'px-4 py-2 max-w-[70%]'
                    : msg.messageType !== 'image' || msg.messageType !== 'image'
                    ? 'w-[50%]'
                    : ''
                "
              >
                <p v-if="msg.isDeleted" class="text-sm break-all break-words">
                  <span class="text-gray-500 italic">
                    This message has been deleted by
                    {{ getUserName(msg.isDeleted) }}
                  </span>
                </p>
                <p
                  v-else-if="msg.messageType === 'text'"
                  class="text-sm break-all break-words"
                  :class="{
                    'bg-yellow-100 dark:bg-yellow-900/30':
                      isMessageHighlighted(msg),
                  }"
                  :ref="
                    (el) => {
                      if (isMessageHighlighted(msg)) messageRefs[msg.id] = el;
                    }
                  "
                >
                  <template v-if="isMessageHighlighted(msg)">
                    <span v-html="getHighlightedContent(msg)"></span>
                  </template>
                  <template v-else>
                    <template
                      v-for="(segment, index) in msg.messageContent.split(
                        /(@\{[^|]+\|[^}]+\})/
                      )"
                      :key="index"
                    >
                      <span
                        v-if="segment.startsWith('@{') && segment.endsWith('}')"
                        class="text-blue-600 bg-yellow-100 rounded px-1"
                      >
                        <template v-if="segment.includes('|')">
                          @{{
                            (() => {
                              const [userId, username] = segment
                                .slice(2, -1)
                                .split("|");
                              const memberExists = props.membersData.some(
                                (member) => member.id === userId
                              );
                              return memberExists
                                ? username
                                : segment.slice(2, -1);
                            })()
                          }}
                        </template>
                        <template v-else>
                          {{ segment.slice(2, -1) }}
                        </template>
                      </span>
                      <span v-else>
                        {{ segment }}
                      </span>
                    </template>
                  </template>
                </p>

                <!-- Image Message -->
                <div
                  v-else-if="msg.messageType === 'image'"
                  class="flex flex-col min-h-3 min-w-3"
                  @click="
                    openFilePreview(
                      msg.messageContent,
                      extractFileName(msg.messageContent)
                    )
                  "
                >
                  <img
                    :data-original-url="msg.messageContent"
                    :src="
                      mediaUrls[msg.messageContent] || '/images/placeholder.png'
                    "
                    :alt="extractFileName(msg.messageContent)"
                    class="h-auto rounded-lg cursor-pointer min-w-12 max-w-full transition-opacity duration-300"
                    :class="{ 'opacity-50': !mediaUrls[msg.messageContent] }"
                    ref="mediaElement"
                    loading="lazy"
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
                    :data-original-url="msg.messageContent"
                    :src="mediaUrls[msg.messageContent] || ''"
                    controls
                    class="!max-w-full max-h-[300px] w-auto h-auto rounded-lg cursor-pointer transition-opacity duration-300"
                    :class="{ 'opacity-50': !mediaUrls[msg.messageContent] }"
                    ref="mediaElement"
                    preload="metadata"
                  ></video>
                </div>

                <!-- File Message (PDF, EXE, etc.) -->
                <div
                  v-else
                  class="flex flex-col items-center gap-3 cursor-pointer p-3 hover:bg-gray-100 rounded-lg"
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
              <div class="relative">
                <button
                  class="action-button mt-1 ml-2"
                  @click="showMessageMenu(msg)"
                  :ref="(el) => setMenuRef(el, msg.id)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
                    />
                  </svg>
                </button>
                <div
                  v-if="selectedMessageForMenu?.id === msg.id"
                  class="absolute right-0 border-2 border-gray-200 dark:border-gray-700 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 text-sm font-medium"
                  :class="shouldFlipMap[msg.id] ? 'bottom-full mb-2' : 'mt-2'"
                >
                  <ul class="divide-y divide-gray-100 dark:divide-gray-700">
                    <!-- Add Reaction Button -->
                    <li>
                      <button
                        @click="showReactionPicker(msg)"
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
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                        Add Reaction
                      </button>
                    </li>

                    <!-- Pin/Unpin Message Button -->
                    <li
                      v-if="
                        isModeratorOrAdmin && !msg.isPinned && !msg.isDeleted
                      "
                    >
                      <button
                        @click="handlePinMessage(msg.id, msg.isPinned)"
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
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        {{ msg.isPinned ? "Unpin Message" : "Pin Message" }}
                      </button>
                    </li>

                    <!-- Delete Message Button -->
                    <li v-if="canDeleteMessage(msg)">
                      <button
                        @click="handleDeleteMessage(msg)"
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
                        Delete Message
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <!-- Reactions -->
            <div
              v-if="msg.reactions && Object.keys(msg.reactions).length > 0"
              class="message-reactions mt-1 flex justify-end"
            >
              <div
                v-for="(users, emojiId) in msg.reactions"
                :key="emojiId"
                class="reaction-bubble"
                :class="{
                  'reaction-self': Object.keys(users).includes(userId),
                }"
                @click="showReactionDetails(msg.id)"
              >
                <span class="emoji">{{ getEmojiById(emojiId) }}</span>
                <span class="reaction-count">{{
                  Object.keys(users).length
                }}</span>
              </div>
            </div>

            <!-- Message Menu Dropdown -->
          </div>
        </template>

        <!-- Current user: Timestamp, name, avatar, and message -->
        <template v-else>
          <!-- {{ msg }} -->
          <!-- Name, timestamp, and message -->
          <div class="flex flex-col flex-1">
            <div class="flex justify-end">
              <!-- Timestamp and name -->
              <div class="flex items-center mb-1">
                <!-- Pending message indicator -->
                <div v-if="msg.isPending" class="text-xs text-gray-400 ml-2">
                  {{
                    msg.status === "failed" ? "Failed to send" : "Sending..."
                  }}
                </div>

                <span class="text-gray-400 text-xs mr-2">{{
                  formatTime(msg.createdAt)
                }}</span>
                <span class="font-semibold text-xs">You</span>
              </div>
            </div>

            <!-- Message menu -->
            <div class="flex justify-end">
              <div class="relative" v-if="!msg.isDeleted">
                <button
                  class="action-button mt-1 ml-2"
                  @click="showMessageMenu(msg)"
                  :ref="(el) => setMenuRef(el, msg.id)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
                    />
                  </svg>
                </button>

                <div
                  v-if="selectedMessageForMenu?.id === msg.id"
                  class="absolute right-0 border-2 border-gray-200 dark:border-gray-700 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 text-sm font-medium"
                  :class="shouldFlipMap[msg.id] ? 'bottom-full mb-2' : 'mt-2'"
                >
                  <ul class="divide-y divide-gray-100 dark:divide-gray-700">
                    <!-- Add Reaction Button -->
                    <li>
                      <button
                        @click="showReactionPicker(msg)"
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
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                        Add Reaction
                      </button>
                    </li>

                    <!-- Pin/Unpin Message Button -->
                    <li
                      v-if="
                        isModeratorOrAdmin && !msg.isPinned && !msg.isDeleted
                      "
                    >
                      <button
                        @click="handlePinMessage(msg.id, msg.isPinned)"
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
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        {{ msg.isPinned ? "Unpin Message" : "Pin Message" }}
                      </button>
                    </li>

                    <!-- Delete Message Button -->
                    <li v-if="canDeleteMessage(msg)">
                      <button
                        @click="handleDeleteMessage(msg)"
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
                        Delete Message
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <div
                class="rounded-2xl bg-blue-300 text-gray-800"
                :class="
                  msg.messageType === 'text'
                    ? 'px-4 py-2 max-w-[70%]'
                    : 'w-[50%]'
                "
              >
                <!-- Text Message -->
                <!-- deleted message -->
                <p v-if="msg.isDeleted" class="text-sm break-all break-words">
                  <span class="text-gray-500 italic">
                    This message has been deleted by
                    {{ getUserName(msg.isDeleted) }}
                  </span>
                </p>
                <p
                  v-else-if="msg.messageType === 'text'"
                  class="text-sm break-all break-words"
                  :class="{
                    'bg-yellow-100 dark:bg-yellow-900/30':
                      isMessageHighlighted(msg),
                  }"
                  :ref="
                    (el) => {
                      if (isMessageHighlighted(msg)) messageRefs[msg.id] = el;
                    }
                  "
                >
                  <template v-if="isMessageHighlighted(msg)">
                    <span v-html="getHighlightedContent(msg)"></span>
                  </template>
                  <template v-else>
                    <template
                      v-for="(segment, index) in msg.messageContent.split(
                        /(@\{[^|]+\|[^}]+\})/
                      )"
                      :key="index"
                    >
                      <span
                        v-if="segment.startsWith('@{') && segment.endsWith('}')"
                        class="text-blue-600 bg-yellow-100 rounded px-1"
                      >
                        <template v-if="segment.includes('|')">
                          @{{
                            (() => {
                              const [userId, username] = segment
                                .slice(2, -1)
                                .split("|");
                              const memberExists = props.membersData.some(
                                (member) => member.id === userId
                              );
                              return memberExists
                                ? username
                                : segment.slice(2, -1);
                            })()
                          }}
                        </template>
                        <template v-else>
                          {{ segment.slice(2, -1) }}
                        </template>
                      </span>
                      <span v-else>
                        {{ segment }}
                      </span>
                    </template>
                  </template>
                </p>
                <!-- <p
                  v-if="msg.messageType === 'text'"
                  class="text-sm break-words break-all"
                >
                  <template
                    v-for="(segment, index) in msg.messageContent.split(
                      /(@\{[^|]+\|[^}]+\})/
                    )"
                    :key="index"
                  >
                    <span
                      v-if="segment.startsWith('@{') && segment.endsWith('}')"
                      class="text-blue-600 bg-yellow-100 rounded px-1"
                    >
                      <template v-if="segment.includes('|')">
                        @{{
                          (() => {
                            const [userId, username] = segment
                              .slice(2, -1)
                              .split("|");
                            const memberExists = props.membersData.some(
                              (member) => member.id === userId
                            );
                            return memberExists
                              ? username
                              : segment.slice(2, -1);
                          })()
                        }}
                      </template>
                      <template v-else>
                        {{ segment.slice(2, -1) }}
                      </template>
                    </span>
                    <span v-else>
                      {{ segment }}
                    </span>
                  </template>
                </p> -->

                <!-- Image Message -->
                <div
                  v-else-if="msg.messageType === 'image'"
                  class="flex flex-col min-h-3 min-w-3"
                  @click="
                    openFilePreview(
                      msg.messageContent,
                      extractFileName(msg.messageContent)
                    )
                  "
                >
                  <img
                    :data-original-url="msg.messageContent"
                    :src="
                      mediaUrls[msg.messageContent] || '/images/placeholder.png'
                    "
                    :alt="extractFileName(msg.messageContent)"
                    class="h-auto rounded-lg cursor-pointer min-w-12 max-w-full transition-opacity duration-300"
                    :class="{ 'opacity-50': !mediaUrls[msg.messageContent] }"
                    ref="mediaElement"
                    loading="lazy"
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
                    :data-original-url="msg.messageContent"
                    :src="mediaUrls[msg.messageContent] || ''"
                    controls
                    class="!max-w-full max-h-[300px] w-auto h-auto rounded-lg cursor-pointer transition-opacity duration-300"
                    :class="{ 'opacity-50': !mediaUrls[msg.messageContent] }"
                    ref="mediaElement"
                    preload="metadata"
                  ></video>
                </div>

                <!-- File Message (PDF, EXE, etc.) -->
                <div
                  v-else
                  class="flex flex-col items-center gap-3 cursor-pointer p-3 hover:bg-gray-100 rounded-lg"
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
                    msg.isPending
                      ? msg.messageContent
                      : extractFileName(msg.messageContent)
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Reactions -->

            <div
              v-if="msg.reactions && Object.keys(msg.reactions).length > 0"
              class="message-reactions mt-1 flex justify-end cursor-pointer"
            >
              <div
                v-for="(users, emojiId) in msg.reactions"
                :key="emojiId"
                class="reaction-bubble"
                @click="showReactionDetails(msg.id)"
              >
                <span class="emoji">{{ getEmojiById(emojiId) }}</span>
                <span class="reaction-count">{{
                  Object.keys(users).length
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
      <div v-if="hasMoreMessages" class="text-center">
        <button
          @click="loadMoreMessages"
          class="text-blue-500 hover:text-blue-700"
        >
          Load more messages...
        </button>
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
    <div
      class="relative pl-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center"
      :class="{
        'opacity-50 cursor-not-allowed pointer-events-none':
          groupData?.isDisband || isMuted,
      }"
    >
      <!-- mute prompt -->
      <div
        v-if="isMuted"
        class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 bg-opacity-50"
      >
        <span class="text-gray-500 dark:text-gray-400"
          >You have been muted</span
        >
      </div>

      <!-- Emoji Picker -->
      <div class="absolute bottom-full left-0 w-full" v-if="showEmojiPicker">
        <Picker
          :data="emojiIndex"
          set="twitter"
          @select="showEmoji"
          class="!w-full"
        />
      </div>

      <!-- Mention Dropdown -->
      <div
        v-if="showMentionDropdown"
        class="absolute bottom-full left-0 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-20 mention-dropdown"
      >
        <div
          v-for="member in filteredMembers"
          :key="member.id"
          @click="selectMention(member)"
          class="flex items-center p-3 hover:bg-gray-100 cursor-pointer"
        >
          <img :src="member.avatarUrl" class="w-8 h-8 rounded-full mr-2" />
          <span class="font-medium">{{ member.username }}</span>
        </div>
        <div
          v-if="filteredMembers.length === 0"
          class="p-3 text-gray-500 text-center"
        >
          No users found
        </div>
      </div>

      <!-- File Upload Area -->
      <!-- modified file upload area -->
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

        <!-- improved file list display -->
        <div
          v-if="filesToUpload.length > 0"
          class="mt-2 bg-white dark:bg-gray-800 border-gray-200 border-2 rounded-lg shadow p-3 max-h-40 overflow-y-auto"
        >
          <div
            v-for="(file, index) in filesToUpload"
            :key="index"
            class="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
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
        <!-- Mention Button -->

        <input
          v-model="newMessage"
          type="text"
          placeholder="Type your message..."
          class="w-full bg-transparent mx-2 outline-none border-none focus:border-none focus:ring-0 focus:outline-none shadow-none text-gray-800"
          @keydown.enter="handleEnter"
          @input="handleInput"
          ref="messageInput"
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
      :fileBlob="previewFileBlob"
      @close="closeFilePreview"
    />

    <!-- Reaction selector pop-up window -->
    <div
      v-if="isReactionPickerVisible"
      class="reaction-picker-overlay"
      @click="closeReactionPicker"
    >
      <div class="reaction-picker" @click.stop>
        <div class="reaction-grid">
          <button
            v-for="emoji in availableEmojis"
            :key="emoji.id"
            class="reaction-option"
            @click="addReaction(emoji.id)"
          >
            {{ emoji.emoji }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal box or pop-up box -->
    <div v-if="showReactionModal" class="reaction-modal">
      <div class="modal-content">
        <span class="close" @click="closeReactionModal">&times;</span>
        <h2>Reactions</h2>
        <ul>
          <!-- {{
            reactionDetails
          }} -->
          <li v-for="(reaction, index) in reactionDetails" :key="index">
            <ul v-for="(member1, index1) in reaction" :key="index1">
              {{
                props.membersData.find((member) => member.id === member1)
                  ?.username || "User"
              }}
              reacted with
              {{
                getEmojiById(index)
              }}
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref as dbRef, set, onValue } from "firebase/database";
import { db, auth } from "~/firebase/firebase.js";
import GroupMenu from "~/components/GroupMenu/GroupMenu.vue";
import { ref, computed, watch, nextTick } from "vue";
import {
  sendMessage as sendMessageUtils,
  handleFileUploadResponse,
  fetchAndDecryptFile,
  addReaction as addReactionUtils,
} from "@/services/chatroom-service";
import { useOptimisticUpdates } from "~/utils/optimisticUpdate.ts";

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

const messages = ref(props.messages);
const isMuted = computed(() => {
  const member = props.membersData.find((member) => member.id === props.userId);
  return member?.isBanned || false;
});

const emit = defineEmits(["loadMore", "back", "showGroupInfo"]);
const isMenuOpen = ref(false);
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

// load more messages
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

// handle emoji selection
const showEmoji = (emoji) => {
  emojisOutput.value += emoji.native;
  newMessage.value += emoji.native;
};

const showEmojiPicker = ref(false);
const showFileUpload = ref(false);
const filesToUpload = ref([]);
const fileInput = ref(null);
const loading = ref(false);

const extractFileName = (url) => {
  if (!url || typeof url !== "string") {
    return "unknown-file";
  }

  try {
    const urlObj = new URL(url);
    const pathname = decodeURIComponent(urlObj.pathname);

    const pathSegments = pathname.split("/");

    const lastSegment = pathSegments[pathSegments.length - 1];

    const cleanFileName = lastSegment.split("?")[0];

    const nameParts = cleanFileName.split("-");
    if (nameParts.length > 1 && !isNaN(nameParts[0])) {
      return nameParts.slice(1).join("-");
    }

    return nameParts;
  } catch (error) {
    console.error("Error parsing URL:", error);
    return "unknown-file";
  }
};

// toggle file upload area
const toggleFileUpload = () => {
  showFileUpload.value = !showFileUpload.value;
  if (showFileUpload.value) {
    showEmojiPicker.value = false; // close emoji picker
  }
};

import FilePreview from "~/components/ChatWindow/FilePreview.vue";
import {
  getFileType,
  getMimeType,
  getDecryptUrl,
} from "~/utils/fileEncryptionHelper";

const showFilePreview = ref(false);
const previewFileUrl = ref("");
const previewFileBlob = ref(null);
const previewFileName = ref("");

import {
  getCachedMediaUrl,
  cacheMediaUrl,
  addToPreloadQueue,
  processPreloadQueue,
} from "../utils/mediaCache";

const mediaUrls = ref({});

const setupIntersectionObserver = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const mediaElement = entry.target;
          const originalUrl = mediaElement.dataset.originalUrl;
          if (originalUrl) {
            const cachedUrl = getCachedMediaUrl(originalUrl);
            if (cachedUrl) {
              mediaElement.src = cachedUrl;
            } else {
              // add to preload queue
              addToPreloadQueue(originalUrl, async () => {
                const url = await getDecryptUrl(
                  originalUrl,
                  extractFileName(originalUrl),
                  props.selectedGroupId
                );
                return url;
              });
            }
            observer.unobserve(mediaElement);
          }
        }
      });
    },
    { rootMargin: "50px" }
  );
  return observer;
};

const mediaObserver = setupIntersectionObserver();

watch(
  () => props.messages,
  async (messages) => {
    for (const msg of messages) {
      if (
        (msg.messageType === "image" || msg.messageType === "video") &&
        typeof msg.messageContent === "string"
      ) {
        try {
          const cachedUrl = getCachedMediaUrl(msg.messageContent);
          if (cachedUrl) {
            mediaUrls.value[msg.messageContent] = cachedUrl;
          } else {
            addToPreloadQueue(msg.messageContent, async () => {
              const url = await getDecryptUrl(
                msg.messageContent,
                extractFileName(msg.messageContent),
                props.selectedGroupId
              );
              mediaUrls.value[msg.messageContent] = url;
              return url;
            });
          }
        } catch (error) {
          console.error("Error preloading media:", error);
        }
      }
    }
    processPreloadQueue();
  },
  { immediate: true, deep: true }
);

// open file preview function
const openFilePreview = async (url, fileName) => {
  try {
    loading.value = true;

    const fileType = getFileType(fileName);
    const mimeType = getMimeType(fileType);

    if (url && url.includes("firebasestorage.googleapis.com")) {
      const user = auth.currentUser;
      if (user) {
        try {
          const { fileUrl, decryptedBlob } = await fetchAndDecryptFile(
            url,
            user.uid,
            props.selectedGroupId,
            mimeType,
            true
          );

          previewFileUrl.value = fileUrl;
          previewFileBlob.value = decryptedBlob;
          previewFileName.value = fileName;
          showFilePreview.value = true;
        } catch (error) {
          console.error("File preview failed:", error);
        }
      } else {
        previewFileUrl.value = url;
        previewFileName.value = fileName;
        showFilePreview.value = true;
      }
    } else {
      previewFileUrl.value = url;
      previewFileName.value = fileName;
      showFilePreview.value = true;
    }
  } catch (error) {
    console.error("File preview failed:", error);
    alert("File preview failed, please try again later");
  } finally {
    loading.value = false;
  }
};

const closeFilePreview = () => {
  showFilePreview.value = false;
};

const openFileBrowser = () => {
  fileInput.value.click();
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
const handleFileSelect = (event) => {
  const selectedFiles = Array.from(event.target.files);
  filesToUpload.value = [...filesToUpload.value, ...selectedFiles];
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

const handleEnter = async (event) => {
  if (event.key === "Enter") {
    await handleSend();
  }
};

const {
  optimisticSendMessage,
  confirmMessageSent,
  markMessageFailed,
  optimisticFileUpload,
  updateFileProgress,
  confirmFileUploaded,
  markFileUploadFailed,
  getPendingItems,
} = useOptimisticUpdates();

const messagesWithPending = computed(() => {
  const pendingItems = getPendingItems(props.selectedGroupId);
  return [...pendingItems, ...messagesWithTimeMarkers.value].sort(
    (a, b) => b.createdAt - a.createdAt
  );
});

const mentionedUsers = ref([]);

const notifyNewMessage = async (groupId, senderName) => {
  await sendNotification({
    groupId: groupId,
    title: "New Message",
    body: `${senderName} sent a message`,
    chatroomId: groupId,
    excludeMuted: true,
  });
};

const notifyFileUpload = async (groupId, fileName) => {
  await sendNotification({
    groupId: groupId,
    title: "File Shared",
    body: `${auth.currentUser.displayName} shared ${fileName}`,
    chatroomId: groupId,
  });
};

const handleSend = async () => {
  closeAllArea();
  await uploadFiles();
  if (newMessage.value.trim() !== "") {
    await sendMessage();
    await notifyNewMessage(props.selectedGroupId, auth.currentUser.displayName);
  }
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || isMuted.value) return;

  const startTime = Date.now();
  const messageContent = newMessage.value;
  newMessage.value = "";

  logEvent("send_message_attempt", {
    groupId: props.selectedGroupId,
    userId: props.userId,
    messageType: "text",
    messageLength: messageContent.length,
    hasMentions: mentionedUsers.value.length > 0,
    timestamp: new Date().toISOString(),
  });

  const { tempId, optimisticMessage } = optimisticSendMessage(
    props.selectedGroupId,
    {
      messageContent,
      senderId: props.userId,
      messageType: "text",
      groupId: props.selectedGroupId,
    }
  );

  try {
    const result = await sendMessageUtils(props.selectedGroupId, {
      senderId: props.userId,
      messageContent,
      messageType: "text",
      createdAt: Date.now(),
    });

    confirmMessageSent(tempId, result);

    if (mentionedUsers.value.length > 0) {
      await sendNotification({
        userIds: mentionedUsers.value,
        title: "New Mention",
        body: `You were mentioned by ${
          props.membersData.find((member) => member.id === props.userId)
            ?.username
        }`,
        chatroomId: props.selectedGroupId,
        isSaveNotification: true,
      });
      mentionedUsers.value = [];
    }

    const duration = Date.now() - startTime;
    logEvent("send_message_success", {
      groupId: props.selectedGroupId,
      userId: props.userId,
      messageType: "text",
      messageLength: messageContent.length,
      hasMentions: mentionedUsers.value.length > 0,
      duration,
      timestamp: new Date().toISOString(),
    });

    trackMetric("send_message_duration", duration, {
      group_id: props.selectedGroupId,
      message_type: "text",
      has_mentions: mentionedUsers.value.length > 0 ? "true" : "false",
    });

    trackMetric("send_message_success_count", 1, {
      group_id: props.selectedGroupId,
      message_type: "text",
    });
  } catch (error) {
    console.error("Error sending message:", error);
    markMessageFailed(tempId);

    logEvent("send_message_failure", {
      groupId: props.selectedGroupId,
      userId: props.userId,
      messageType: "text",
      messageLength: messageContent.length,
      hasMentions: mentionedUsers.value.length > 0,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    trackMetric("send_message_failure_count", 1, {
      group_id: props.selectedGroupId,
      message_type: "text",
    });
  }
};

const handleMention = (userId) => {
  if (!mentionedUsers.value.includes(userId)) {
    mentionedUsers.value.push(userId);
  }
};

import { useScroll } from "@vueuse/core";
import { getFileIconColor } from "~/utils/fileUtils";

const { arrivedState } = useScroll(chatContent);
const menuRefs = ref({});

const shouldFlipMap = ref({});

const setMenuRef = (el, msgId) => {
  if (el) {
    menuRefs.value[msgId] = el;
  }
};

const positionMenu = (msgId) => {
  nextTick(() => {
    const menuEl = menuRefs.value[msgId];
    if (menuEl) {
      const rect = menuEl.getBoundingClientRect();
      shouldFlipMap.value[msgId] = rect.bottom > window.innerHeight - 200;
    }
  });
};

const uploadFiles = async () => {
  const user = auth.currentUser;
  if (!user) {
    await logError(new Error("User not authenticated"), {
      action: "file_upload",
      chatroomId: props.selectedGroupId,
    });
    throw new Error("User not authenticated");
  }

  const startTime = Date.now();
  const idToken = await user.getIdToken();
  const userId = user.uid;

  try {
    const uploadTasks = filesToUpload.value.map(async (file) => {
      const { tempId, optimisticFile } = optimisticFileUpload(
        props.selectedGroupId,
        file,
        {
          senderId: props.userId,
          messageType: file.type.startsWith("image/") ? "image" : "file",
          groupId: props.selectedGroupId,
          messageContent: file.name,
          fileSize: file.size,
        }
      );

      updateFileProgress(tempId, 50);
      const fileUploadStart = Date.now();
      const fileSizeMB = file.size / (1024 * 1024);

      // Logging start
      await logEvent("file_upload_start", {
        userId,
        chatroomId: props.selectedGroupId,
        fileType: file.type,
        fileName: file.name,
        fileSize: `${fileSizeMB.toFixed(2)}MB`,
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatroomId", props.selectedGroupId);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const result = await response.json();

      updateFileProgress(tempId, 90);
      if (result.fileDetails && result.fileDetails.length > 0) {
        const fileDetail = result.fileDetails[0];
        await sendMessageUtils(props.selectedGroupId, {
          senderId: user.uid,
          messageContent: fileDetail.url,
          messageType: fileDetail.type,
        });
      }
      confirmFileUploaded(tempId, result);

      await notifyFileUpload(props.selectedGroupId, file.name);

      const duration = Date.now() - fileUploadStart;

      await trackMetric("file_upload_duration", duration, {
        file_type: file.type,
        file_size: `${fileSizeMB.toFixed(2)}MB`,
        status: "success",
      });

      await logEvent("file_upload_success", {
        userId,
        chatroomId: props.selectedGroupId,
        fileType: file.type,
        duration,
        fileSize: `${fileSizeMB.toFixed(2)}MB`,
      });
    });

    // Perform all upload tasks
    await Promise.all(uploadTasks);

    await logEvent("batch_file_upload_complete", {
      userId,
      chatroomId: props.selectedGroupId,
      totalFiles: filesToUpload.value.length,
      totalDuration: Date.now() - startTime,
    });
  } catch (error) {
    console.error("File upload processing failed:", error);
    await logError(error, {
      userId,
      chatroomId: props.selectedGroupId,
      action: "file_upload",
      fileCount: filesToUpload.value.length,
    });
  } finally {
    filesToUpload.value = [];
    showFileUpload.value = false;
  }
};

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
  showFileUpload.value = false;
  showMentionDropdown.value = false;
  filesToUpload.value = [];
};

// Get user profile picture
const getUserAvatar = (senderId) => {
  const member = props.membersData.find((member) => member.id === senderId);
  return member ? member.avatarUrl : "/images/group.png";
};

// Get username
const getUserName = (senderId) => {
  const member = props.membersData.find((member) => member.id === senderId);
  return member ? member.username : "User";
};

// Format time
const formatTime = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Handle scrolling events
const handleScroll = async (event) => {
  const { scrollTop } = event.target;
  if (scrollTop === 0 && props.hasMoreMessages) {
    emit("loadMore");
  }
};

// Add this computed property to generate time markers
const messagesWithTimeMarkers = computed(() => {
  if (!props.messages || props.messages.length === 0) return [];

  const result = [];
  let lastDate = null;
  let lastTimestamp = null;

  props.messages.forEach((msg) => {
    if (!msg.createdAt) {
      result.push(msg);
      return;
    }

    const msgDate = new Date(msg.createdAt);
    const currentDate = new Date(
      msgDate.getFullYear(),
      msgDate.getMonth(),
      msgDate.getDate()
    );

    // Add date marker if it's a new day
    if (!lastDate || currentDate.getTime() !== lastDate.getTime()) {
      result.push({
        id: `date-${msgDate.getTime()}`,
        messageType: "system",
        messageContent: formatDateMarker(msgDate),
        isTimeMarker: true,
      });
      lastDate = currentDate;
      lastTimestamp = msgDate.getTime();
    }
    // Add time marker if more than 30 minutes have passed since last message
    else if (
      lastTimestamp &&
      msgDate.getTime() - lastTimestamp > 30 * 60 * 1000
    ) {
      result.push({
        id: `time-${msgDate.getTime()}`,
        messageType: "system",
        messageContent: formatTimeMarker(msgDate),
        isTimeMarker: true,
      });
    }

    result.push(msg);
    lastTimestamp = msgDate.getTime();
  });

  return result.reverse();
});

// Format date marker (for new days)
const formatDateMarker = (date) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
};

// Format time marker (for time gaps)
const formatTimeMarker = (date) => {
  return date.toLocaleTimeString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const scrollToBottom = () => {
  if (chatContent.value) {
    chatContent.value.scrollTo({
      top: chatContent.value.scrollHeight,
      behavior: "smooth",
    });
  }
};

const isAtBottom = ref(true);

const showScrollButton = computed(() => !arrivedState.bottom);

onMounted(() => {
  if (chatContent.value) {
    isAtBottom.value = true;
  }
});

const showMentionDropdown = ref(false);
const mentionQuery = ref("");
const mentionStartIndex = ref(-1);
const messageInput = ref(null);

// Watch for changes in the selected group
watch(
  () => props.selectedGroupId,
  () => {
    // Reset mention state when changing groups
    showMentionDropdown.value = false;
    mentionQuery.value = "";
    mentionStartIndex.value = -1;
  }
);

// Filter members based on the mention query
const filteredMembers = computed(() => {
  if (!mentionQuery.value) {
    return props.membersData || [];
  }

  return (props.membersData || []).filter((member) =>
    member.username.toLowerCase().includes(mentionQuery.value.toLowerCase())
  );
});

let typingTimeout;
// Handle input to detect @ symbol
const handleInput = (event) => {
  const cursorPosition = event.target.selectionStart;
  const text = newMessage.value;
  updateTypingStatus(true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    updateTypingStatus(false);
  }, 5000);

  // Check if we're already in mention mode
  if (mentionStartIndex.value !== -1) {
    // Extract the current mention query
    mentionQuery.value = text.substring(
      mentionStartIndex.value + 1,
      cursorPosition
    );

    // If user deleted the @ symbol or moved cursor, exit mention mode
    if (
      cursorPosition <= mentionStartIndex.value ||
      text[mentionStartIndex.value] !== "@"
    ) {
      showMentionDropdown.value = false;
      mentionStartIndex.value = -1;
      return;
    }

    showMentionDropdown.value = true;
    return;
  }

  // Check if user just typed @
  if (text[cursorPosition - 1] === "@") {
    mentionStartIndex.value = cursorPosition - 1;
    mentionQuery.value = "";
    showMentionDropdown.value = true;
  }
};

// Open mention dropdown when clicking the @ button
const openMentionDropdown = () => {
  // Insert @ at current cursor position
  const cursorPosition = messageInput.value.selectionStart;
  const textBefore = newMessage.value.substring(0, cursorPosition);
  const textAfter = newMessage.value.substring(cursorPosition);

  newMessage.value = textBefore + "@" + textAfter;
  mentionStartIndex.value = cursorPosition;
  mentionQuery.value = "";
  showMentionDropdown.value = true;

  // Focus input and place cursor after @
  nextTick(() => {
    messageInput.value.focus();
    messageInput.value.selectionStart = cursorPosition + 1;
    messageInput.value.selectionEnd = cursorPosition + 1;
  });
};

// Select a member from the dropdown
const selectMention = (member) => {
  const cursorPosition = messageInput.value.selectionStart;
  const textBefore = newMessage.value.substring(0, mentionStartIndex.value);
  const textAfter = newMessage.value.substring(cursorPosition);

  // Format: @{userId|username}
  const mentionText = `@{${member.id}|${member.username}}`;

  newMessage.value = textBefore + mentionText + textAfter;

  // Close dropdown
  showMentionDropdown.value = false;
  mentionStartIndex.value = -1;

  // Focus input and place cursor after the mention
  nextTick(() => {
    messageInput.value.focus();
    const newPosition = textBefore.length + mentionText.length;
    messageInput.value.selectionStart = newPosition;
    messageInput.value.selectionEnd = newPosition;
  });
};

// Close mention dropdown when clicking outside
onMounted(() => {
  document.addEventListener("click", (event) => {
    if (
      showMentionDropdown.value &&
      !event.target.closest(".mention-dropdown")
    ) {
      showMentionDropdown.value = false;
    }
  });
});

// Update the closeAllArea function to also close the mention dropdown
const closeAllArea = () => {
  showFileUpload.value = false;
  showEmojiPicker.value = false;
  showMentionDropdown.value = false;
};

import { debounce } from "lodash-es";
const typingRef = computed(() =>
  dbRef(
    db,
    `chatrooms/${props.selectedGroupId}/typing/${auth.currentUser?.uid}`
  )
);

const onlineMembers = computed(() =>
  props.membersData.filter((member) => member.status === "online")
);

const formatOnlineUsers = (users) => {
  if (users.length === 1) {
    return `${users[0].username} is online`;
  } else if (users.length === 2) {
    return `${users[0].username} and ${users[1].username} are online`;
  } else if (users.length === 3) {
    return `${users[0].username}, ${users[1].username}, and ${users[2].username} are online`;
  } else {
    return `${users[0].username}, ${users[1].username}, and ${
      users.length - 2
    } others are online`;
  }
};

const updateTypingStatus = debounce((isTyping) => {
  if (!props.selectedGroupId || !auth.currentUser?.uid) return;
  set(typingRef.value, {
    isTyping,
    timestamp: Date.now(),
  });
}, 500);
const otherTypingUsers = ref([]);
onMounted(() => {
  const groupTypingRef = dbRef(db, `chatrooms/${props.selectedGroupId}/typing`);
  onValue(groupTypingRef, (snapshot) => {
    const typingData = snapshot.val() || {};
    const activeTypers = Object.entries(typingData)
      .filter(
        ([uid, data]) =>
          //uid !== auth.currentUser?.uid &&
          data.isTyping && Date.now()
      )
      .map(([uid]) => uid);

    otherTypingUsers.value = activeTypers.filter(
      (uid) => uid !== auth.currentUser?.uid
    );
  });
});

onUnmounted(() => {
  if (props.selectedGroupId && auth.currentUser?.uid) {
    set(typingRef.value, { isTyping: false });
  }
});

const isReactionPickerVisible = ref(false);
const selectedMessage = ref(null);
const availableEmojis = ref([
  { id: "1", emoji: "👍" },
  { id: "2", emoji: "❤️" },
  { id: "3", emoji: "😂" },
  { id: "4", emoji: "😮" },
  { id: "5", emoji: "😢" },
  { id: "6", emoji: "🙏" },
  { id: "7", emoji: "👏" },
  { id: "8", emoji: "🎉" },
  { id: "9", emoji: "🤔" },
  { id: "10", emoji: "💪" },
  { id: "11", emoji: "🙌" },
  { id: "12", emoji: "💯" },
]);

const showReactionPicker = (message) => {
  selectedMessage.value = message;
  isReactionPickerVisible.value = true;
};

const closeReactionPicker = () => {
  isReactionPickerVisible.value = false;
  selectedMessage.value = null;
};

const addReaction = async (emojiId) => {
  if (!selectedMessage.value) return;

  try {
    await addReactionUtils(
      props.selectedGroupId,
      selectedMessage.value.id,
      emojiId
    );
    closeReactionPicker();
  } catch (error) {
    console.error("Failed to add reaction:", error);
  }
};

const getEmojiById = (emojiId) => {
  const emoji = availableEmojis.value.find((e) => e.id === emojiId);
  return emoji ? emoji.emoji : "❓";
};

const showReactionModal = ref(false);
const reactionDetails = ref({});

const showReactionDetails = (msgId) => {
  const currentReaction = props.messages.find((msg) => msg.id === msgId);
  reactionDetails.value = currentReaction.reactions;
  showReactionModal.value = true;
};

const closeReactionModal = () => {
  showReactionModal.value = false;
  reactionDetails.value = {};
};

const showSearch = ref(false);
const searchQuery = ref("");
const messageRefs = ref({});

const matchedMessages = computed(() => {
  if (!searchQuery.value.trim()) return [];
  return props.messages
    .filter(
      (message) =>
        message.messageType === "text" &&
        message.messageContent
          ?.toLowerCase()
          .includes(searchQuery.value.toLowerCase())
    )
    .reverse();
});

const getHighlightedContent = (message) => {
  if (!message?.messageContent) return "";
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return message.messageContent;

  const regex = new RegExp(`(${query})`, "gi");
  return message.messageContent.replace(
    regex,
    '<span class="bg-yellow-300 dark:bg-yellow-500">$1</span>'
  );
};

const handleSearch = () => {
  messageRefs.value = {};
};
const isMessageHighlighted = (message) => {
  if (
    !message.messageContent ||
    message.messageType !== "text" ||
    searchQuery.value.trim() == ""
  )
    return false;

  const query = searchQuery.value.trim().toLowerCase();
  return message.messageContent.toLowerCase().includes(query);
};

const scrollToMessage = (message) => {
  const messageEl = messageRefs.value[message.id];
  if (messageEl && chatContent.value) {
    const elementTop = messageEl.offsetTop;
    chatContent.value.scrollTo({
      top: elementTop - chatContent.value.clientHeight / 2,
      behavior: "smooth",
    });
    messageEl.classList.add("bg-yellow-100");
    setTimeout(() => messageEl.classList.remove("bg-yellow-100"), 1000);
  }
  showSearch.value = false;
};

const selectedMessageForMenu = ref(null);
const isModeratorOrAdmin = computed(() => {
  const currentUser = props.membersData.find((m) => m.id === props.userId);
  return currentUser?.role === "admin" || currentUser?.role === "moderator";
});

const showMessageMenu = (msg) => {
  selectedMessageForMenu.value =
    selectedMessageForMenu.value?.id === msg.id ? null : msg;
  positionMenu(msg.id);
};

import { useGroupApi } from "~/composables/useGroupApi";
const { pinMessage, unpinMessage, deleteMessage } = useGroupApi();
const handlePinMessage = async (messageId, isPinned) => {
  try {
    if (!props.selectedGroupId || !props.userId) return;
    if (isPinned) {
      // Unpin message
      await unpinMessage(props.selectedGroupId, msg.id);
    } else {
      // Check if max pins reached
      const pinnedCount = messagesWithTimeMarkers.value.filter(
        (msg) => msg.isPinned
      ).length;

      if (pinnedCount >= 3) {
        alert(
          "Maximum of 3 pinned messages reached. Please unpin a message first."
        );
        return;
      }
      // Pin message
      await pinMessage(props.selectedGroupId, {
        messageId: messageId,
        pinnedBy: props.userId,
        pinnedAt: Date.now(),
      });
    }
    selectedMessageForMenu.value = null;
  } catch (error) {
    console.error("Error handling pin:", error);
  }
};

const canDeleteMessage = (msg) => {
  if (msg.isDeleted) return false;
  if (isModeratorOrAdmin.value) return true;
  if (msg.senderId === props.userId) {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return msg.createdAt > fiveMinutesAgo;
  }

  return false;
};

const handleDeleteMessage = async (msg) => {
  try {
    if (!props.selectedGroupId || !props.userId) return;
    await deleteMessage(props.selectedGroupId, msg.id, props.userId);
    selectedMessageForMenu.value = null;
  } catch (error) {
    console.error("Error deleting message:", error);
  }
};

const allFlags = [
  selectedMessageForMenu,
  showSearch,
  showFileUpload,
  showEmojiPicker,
  showMentionDropdown,
];
let updateLock = false;

watch(
  allFlags,
  (newValues, oldValues) => {
    if (updateLock) return;
    updateLock = true;

    const activatedIndex = newValues.findIndex(
      (val, i) => val === true && oldValues[i] === false
    );

    const deactivatedIndex = oldValues.findIndex(
      (val, i) => val === true && newValues[i] === false
    );

    if (activatedIndex !== -1) {
      allFlags.forEach((flag, i) => {
        if (i !== activatedIndex && i !== 0) {
          flag.value = false;
        }
      });

      if (activatedIndex !== 0) {
        selectedMessageForMenu.value = null;
      }
    } else if (deactivatedIndex !== -1) {
    } else if (oldValues[0] !== null && newValues[0] === null) {
      allFlags.forEach((flag, i) => {
        if (i !== 0) flag.value = false;
      });
    } else if (oldValues[0] === null && newValues[0] !== null) {
      allFlags.forEach((flag, i) => {
        if (i !== 0) flag.value = false;
      });
    }

    updateLock = false;
  },
  { deep: true }
);
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

.absolute.bottom-full {
  z-index: 10;
  margin-bottom: 0.5rem;
}

.drop-zone.active {
  background-color: #ebf8ff;
  border-color: #4299e1;
}

/* Add styles for mention dropdown */
.mention-dropdown {
  z-index: 50;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.message-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.reaction-bubble {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 12px;
  background-color: rgba(0, 0, 0, 0.05);
  font-size: 0.9em;
}

.reaction-self {
  background-color: rgba(0, 123, 255, 0.1);
}

.reaction-count {
  font-size: 0.8em;
  color: #666;
}

.message-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message:hover .message-actions {
  opacity: 1;
}

.action-button {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
}

.action-button:hover {
  color: #007bff;
}

.reaction-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.reaction-picker {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 300px;
  width: 100%;
}

.reaction-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.reaction-option {
  background: none;
  border: none;
  padding: 8px;
  font-size: 1.5em;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.reaction-option:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.reaction-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  width: 300px;
}

.close {
  cursor: pointer;
  float: right;
}
</style>
