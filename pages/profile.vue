<template>
  <div class="h-screen flex flex-col">
    <Header
      class="h-16 flex-shrink-0 border-b dark:border-gray-700 shadow-md px-6 flex items-center justify-between"
    />
    <div
      class="flex-1 overflow-auto pb-16 md:pb-0 bg-gray-200 dark:bg-gray-900"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl mx-auto my-4 sm:my-8 overflow-hidden"
      >
        <!-- Header with background image -->
        <div
          class="relative h-32 sm:h-48 bg-gradient-to-r from-blue-500 to-indigo-600"
        >
          <div
            class="absolute bottom-0 left-0 w-full h-16 sm:h-24 bg-gradient-to-t from-white dark:from-gray-800 to-transparent"
          ></div>
        </div>

        <div class="px-4 sm:px-8 pb-8">
          <!-- Profile Section -->
          <div
            class="flex flex-col md:flex-row gap-4 sm:gap-8 -mt-12 sm:-mt-16 mb-8"
          >
            <!-- Left Column: Avatar and Basic Info -->
            <div class="flex flex-col items-center md:items-start">
              <!-- Avatar with upload overlay -->
              <div class="relative group">
                <div
                  class="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg bg-gray-100 dark:bg-gray-700"
                >
                  <img
                    :src="avatarUrl || '/images/user_avatar.png'"
                    alt="Profile Picture"
                    referrerpolicy="no-referrer"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div
                  @click="triggerFileInput"
                  class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200"
                >
                  <Icon
                    icon="lucide:camera"
                    class="text-white text-xl sm:text-2xl"
                  />
                </div>
                <input
                  type="file"
                  ref="fileInput"
                  class="hidden"
                  accept="image/*"
                  @change="handleAvatarUpload"
                />
              </div>

              <!-- Online Status Toggle -->
              <!-- <div class="mt-4 flex items-center gap-2">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="userSettings.isOnline"
                    @change="updateOnlineStatus"
                    class="sr-only peer"
                  />
                  <div
                    class="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-green-500"
                  >
                    <div
                      class="absolute w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ease-in-out"
                      :style="{
                        transform: userSettings.isOnline
                          ? 'translateX(20px)'
                          : 'translateX(2px)',
                        top: '2px',
                      }"
                    ></div>
                  </div>
                </label>
                <span
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {{ userSettings.isOnline ? "Online" : "Invisible" }}
                </span>
              </div> -->
            </div>

            <!-- Right Column: User Info Form -->
            <div class="flex-1 space-y-4 z-10">
              <div
                class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
              >
                <h1
                  class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white"
                >
                  Profile Settings
                </h1>
                <button
                  @click="saveProfile"
                  class="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 mb-4 sm:mb-0"
                  :disabled="isSaving"
                >
                  <Icon
                    v-if="isSaving"
                    icon="lucide:loader-2"
                    class="animate-spin"
                  />
                  <Icon v-else icon="lucide:save" />
                  Save Changes
                </button>
              </div>

              <!-- Username -->
              <div>
                <label
                  for="username"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Username</label
                >
                <input
                  type="text"
                  id="username"
                  v-model="userSettings.username"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Your display name"
                />
              </div>

              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Email</label
                >
                <input
                  type="text"
                  id="email"
                  v-model="userSettings.email"
                  disabled
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-300"
                  placeholder="Email"
                />
              </div>

              <!-- Bio -->
              <div>
                <label
                  for="bio"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Bio</label
                >
                <textarea
                  id="bio"
                  v-model="userSettings.bio"
                  rows="3"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Tell us about yourself"
                ></textarea>
              </div>

              <!-- Status -->
              <div>
                <label
                  for="status"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Status</label
                >
                <select
                  id="status"
                  v-model="userSettings.status"
                  class="w-full sm:w-[50%] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="away">Away</option>
                  <option value="do-not-disturb">Do Not Disturb</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div
            class="border-b border-gray-200 dark:border-gray-700 overflow-x-auto"
          >
            <nav class="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
              <button
                @click="activeTab = 'personalization'"
                class="py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap"
                :class="
                  activeTab === 'personalization'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                "
              >
                Personalization
              </button>
              <button
                @click="activeTab = 'privacy'"
                class="py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap"
                :class="
                  activeTab === 'privacy'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                "
              >
                Privacy
              </button>
            </nav>
          </div>

          <!-- Tab Content -->
          <div class="mt-6">
            <!-- Personalization Tab -->
            <div v-if="activeTab === 'personalization'" class="space-y-6">
              <!-- Theme Mode -->
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                    Theme
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Choose between light and dark mode
                  </p>
                </div>
                <div class="flex items-center space-x-3">
                  <button
                    @click="updateThemeSetting(true)"
                    class="p-2 rounded-full flex items-center gap-2"
                    :class="
                      userSettings.isLight
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-500'
                    "
                  >
                    <Icon icon="lucide:sun" class="w-5 h-5" />
                    <span class="text-sm">Light</span>
                  </button>
                  <button
                    @click="updateThemeSetting(false)"
                    class="p-2 rounded-full flex items-center gap-2"
                    :class="
                      !userSettings.isLight
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-500'
                    "
                  >
                    <Icon icon="lucide:moon" class="w-5 h-5" />
                    <span class="text-sm">Dark</span>
                  </button>
                </div>
              </div>

              <!-- Time Display -->
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                    Time Display
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Show exact time or relative time
                  </p>
                </div>
                <div class="flex items-center space-x-3">
                  <button
                    @click="updateSetting('showExactTime', true)"
                    class="p-2 rounded-full flex items-center gap-2"
                    :class="
                      userSettings.showExactTime
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-500'
                    "
                  >
                    <Icon icon="lucide:clock" class="w-5 h-5" />
                    <span class="text-sm">Exact Time</span>
                  </button>
                  <button
                    @click="updateSetting('showExactTime', false)"
                    class="p-2 rounded-full flex items-center gap-2"
                    :class="
                      !userSettings.showExactTime
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-500'
                    "
                  >
                    <Icon icon="lucide:history" class="w-5 h-5" />
                    <span class="text-sm">Relative Time</span>
                  </button>
                </div>
              </div>

              <!-- Notifications -->
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Enable or disable notifications
                  </p>
                </div>
                <div class="flex items-center space-x-3">
                  <button
                    @click="
                      updateSetting('notifications', true);
                      updateNotificationSettings();
                    "
                    class="p-2 rounded-full flex items-center gap-2"
                    :class="
                      userSettings.notifications
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-500'
                    "
                  >
                    <Icon icon="lucide:bell" class="w-5 h-5" />
                    <span class="text-sm">Enabled</span>
                  </button>
                  <button
                    @click="
                      updateSetting('notifications', false);
                      updateNotificationSettings();
                    "
                    class="p-2 rounded-full flex items-center gap-2"
                    :class="
                      !userSettings.notifications
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-500'
                    "
                  >
                    <Icon icon="lucide:bell-off" class="w-5 h-5" />
                    <span class="text-sm">Disabled</span>
                  </button>
                </div>
              </div>

              <!-- Font Size -->
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                    Font Size
                  </h3>
                </div>
                <div class="flex items-center space-x-2 sm:space-x-4">
                  <button
                    @click="updateFontSizeSetting('small')"
                    class="px-3 py-1 rounded-md text-sm"
                    :class="{
                      'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300':
                        userSettings.fontSize === 'small',
                      'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700':
                        userSettings.fontSize !== 'small',
                    }"
                  >
                    Small
                  </button>
                  <button
                    @click="updateFontSizeSetting('normal')"
                    class="px-3 py-1 rounded-md text-sm"
                    :class="{
                      'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300':
                        userSettings.fontSize === 'normal',
                      'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700':
                        userSettings.fontSize !== 'normal',
                    }"
                  >
                    Normal
                  </button>
                  <button
                    @click="updateFontSizeSetting('large')"
                    class="px-3 py-1 rounded-md text-sm"
                    :class="{
                      'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300':
                        userSettings.fontSize === 'large',
                      'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700':
                        userSettings.fontSize !== 'large',
                    }"
                  >
                    Large
                  </button>
                </div>
              </div>
            </div>

            <!-- Privacy Tab -->
            <div v-if="activeTab === 'privacy'" class="space-y-6">
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                    Two-Factor Authentication
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    To enhance your account security, please enable two-factor
                    authentication.
                  </p>
                </div>
                <div class="flex items-center space-x-3">
                  <button
                    @click="showMFAModal = true"
                    class="p-2 rounded-full flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <Icon icon="lucide:shield" class="w-5 h-5" />
                    <span class="text-sm">Set up</span>
                  </button>
                </div>
              </div>

              <!-- MFA Modal -->
              <div
                v-if="showMFAModal"
                class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              >
                <div
                  class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
                >
                  <div class="flex items-center justify-between mb-4">
                    <h3
                      class="text-lg font-medium text-gray-900 dark:text-white"
                    >
                      Two-Factor Authentication
                    </h3>
                    <button
                      @click="showMFAModal = false"
                      class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <SecuritySettings />
                </div>
              </div>

              <!-- Who can see active state -->
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                    Activity Status Visibility
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Control who can see when you're active
                  </p>
                </div>
                <div class="flex items-center space-x-3">
                  <button
                    @click="updateSetting('activityVisibility', 'everyone')"
                    class="p-2 rounded-full flex items-center gap-2"
                    :class="
                      userSettings.activityVisibility === 'everyone'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-500'
                    "
                  >
                    <Icon icon="lucide:users" class="w-5 h-5" />
                    <span class="text-sm">Everyone</span>
                  </button>
                  <button
                    @click="updateSetting('activityVisibility', 'nobody')"
                    class="p-2 rounded-full flex items-center gap-2"
                    :class="
                      userSettings.activityVisibility === 'nobody'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-500'
                    "
                  >
                    <Icon icon="lucide:eye-off" class="w-5 h-5" />
                    <span class="text-sm">Nobody</span>
                  </button>
                </div>
              </div>

              <!-- Email visibility -->
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                    Email Visibility
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Show your email to other users
                  </p>
                </div>
                <div class="flex items-center space-x-3">
                  <button
                    @click="updateSetting('showEmail', true)"
                    class="p-2 rounded-full flex items-center gap-2"
                    :class="
                      userSettings.showEmail
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-500'
                    "
                  >
                    <Icon icon="lucide:eye" class="w-5 h-5" />
                    <span class="text-sm">Visible</span>
                  </button>
                  <button
                    @click="updateSetting('showEmail', false)"
                    class="p-2 rounded-full flex items-center gap-2"
                    :class="
                      !userSettings.showEmail
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-500'
                    "
                  >
                    <Icon icon="lucide:eye-off" class="w-5 h-5" />
                    <span class="text-sm">Hidden</span>
                  </button>
                </div>
              </div>

              <!-- Reset Password -->
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                    Password
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Change your account password
                  </p>
                </div>
                <button
                  @click="navigateToResetPassword"
                  class="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <Icon icon="lucide:key" />
                  <span class="text-sm">Reset Password</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation Bar -->
    <MobileNavBar />

    <!-- Success Toast -->
    <div
      v-if="showToast"
      class="fixed bottom-20 sm:bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-up dark:bg-green-600"
    >
      <Icon icon="lucide:check-circle" />
      Settings saved successfully!
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from "vue";
import { Icon } from "@iconify/vue";
import { auth, db } from "~/firebase/firebase.js";
import { ref as dbRef, get, set, update, onValue } from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { navigateTo } from "#app";
import { useRouter } from "vue-router";
import Header from "@/components/Header.vue";
import { useColorModeStore } from "~/stores/colorMode.js";
import { useFontSizeStore } from "~/stores/fontSize.js";
import MobileNavBar from "@/components/MobileNavBar.vue";
import SecuritySettings from "~/components/SecuritySettings.vue";

const router = useRouter();
const colorModeStore = useColorModeStore();
const fontSizeStore = useFontSizeStore();

// State
const activeTab = ref("personalization");
const fileInput = ref(null);
const avatarUrl = ref(null);
const isSaving = ref(false);
const showToast = ref(false);
const showMFAModal = ref(false);

// User settings with default values
const userSettings = reactive({
  username: "",
  email: "",
  bio: "",
  status: "available",
  isOnline: true,
  isLight: true,
  showExactTime: true,
  notifications: true,
  fontSize: "normal",
  activityVisibility: "everyone",
  showEmail: false,
});

const fetchUserData = async () => {
  const user = auth.currentUser;
  if (!user) {
    avatarUrl.value = "/images/user_avatar.png";
    return;
  }
  if (
    user.providerData.some((provider) => provider.providerId === "google.com")
  ) {
    avatarUrl.value = user.photoURL;
  } else {
    const storage = getStorage();
    const avatarRef = storageRef(storage, `avatars/${user.uid}`);
    try {
      const url = await getDownloadURL(avatarRef);
      avatarUrl.value = url;
    } catch (error) {
      console.error("Failed to fetch avatar from Storage:", error);
      avatarUrl.value = "/images/user_avatar.png";
    }
  }
};

import { onAuthStateChanged } from "firebase/auth";
let unsubscribeUserData = null;

onMounted(() => {
  const user = auth.currentUser;
  if (!user) {
    router.push("/login");
    return;
  }

  // Get user avatar
  const userRef = dbRef(db, `users/${user.uid}`);
  unsubscribeUserData = onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.val();
      avatarUrl.value = userData.avatarUrl || null;

      // Basic info
      userSettings.username = userData.username || user.displayName || "";
      userSettings.email = user.email || "";

      // Notification settings
      userSettings.notifications = !userData.isMuted;

      // Advanced settings
      if (userData.advancedSettings) {
        const advSettings = userData.advancedSettings;

        // Update all settings from the database
        userSettings.bio = advSettings.bio || "";
        userSettings.status = advSettings.status || "available";
        userSettings.isOnline = advSettings.isOnline !== false; // Default to true
        userSettings.isLight = advSettings.isLight !== false; // Default to true
        userSettings.showExactTime = advSettings.showExactTime !== false; // Default to true
        userSettings.fontSize = advSettings.fontSize || "normal";
        userSettings.activityVisibility =
          advSettings.activityVisibility || "everyone";
        userSettings.showEmail = advSettings.showEmail || false;

        // Sync with color mode store
        // if (colorModeStore.isLight !== userSettings.isLight) {
        //   colorModeStore.toggleColorMode(userSettings.isLight);
        // }
      }
    }
  });
});

// Watch for changes in the color mode store
watch(
  () => colorModeStore.isLight,
  (newValue) => {
    if (userSettings.isLight !== newValue) {
      userSettings.isLight = newValue;
    }
  }
);

onUnmounted(() => {
  if (unsubscribeUserData) {
    unsubscribeUserData();
  }
});

// Trigger file input click
const triggerFileInput = () => {
  fileInput.value.click();
};

// Handle avatar upload
const handleAvatarUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const user = auth.currentUser;
  if (!user) return;

  try {
    isSaving.value = true;

    // Upload to Firebase Storage
    const storage = getStorage();
    const avatarRef = storageRef(storage, `avatars/${user.uid}`);
    await uploadBytes(avatarRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(avatarRef);
    avatarUrl.value = downloadURL;

    // Update user profile with avatar URL
    const userRef = dbRef(db, `users/${user.uid}`);
    await update(userRef, {
      avatarUrl: downloadURL,
    });

    showSuccessToast();
  } catch (error) {
    console.error("Error uploading avatar:", error);
  } finally {
    isSaving.value = false;
  }
};

// Update online status
const updateOnlineStatus = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    isSaving.value = true;

    // Update both the advanced settings and the status field
    const userRef = dbRef(db, `users/${user.uid}`);

    // Create an updates object to perform an atomic update
    const updates = {};
    updates[`advancedSettings/isOnline`] = userSettings.isOnline;
    updates[`status`] = userSettings.isOnline ? "online" : "offline";

    await update(userRef, updates);

    showSuccessToast();
  } catch (error) {
    console.error("Error updating online status:", error);
  } finally {
    isSaving.value = false;
  }
};

// Update notification settings
const updateNotificationSettings = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const userRef = dbRef(db, `users/${user.uid}`);
    await update(userRef, {
      isMuted: !userSettings.notifications,
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
  }
};

// Save all profile settings
import { useUserApi } from "~/composables/useUserApi";
const { updateProfile } = useUserApi();
const user = auth.currentUser;
const saveProfile = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    isSaving.value = true;
    const form = {
      username: userSettings.username,
      advancedSettings: {
        bio: userSettings.bio,
        status: userSettings.status,
        isOnline: userSettings.isOnline,
        isLight: userSettings.isLight,
        showExactTime: userSettings.showExactTime,
        fontSize: userSettings.fontSize,
        activityVisibility: userSettings.activityVisibility,
        showEmail: userSettings.showEmail,
      },
    };
    await updateProfile(user.uid, form);
    // const userRef = dbRef(db, `users/${user.uid}`);
    // await update(userRef, {
    //   username: userSettings.username,
    //   advancedSettings: {
    //     bio: userSettings.bio,
    //     status: userSettings.status,
    //     isOnline: userSettings.isOnline,
    //     isLight: userSettings.isLight,
    //     showExactTime: userSettings.showExactTime,
    //     fontSize: userSettings.fontSize,
    //     activityVisibility: userSettings.activityVisibility,
    //     showEmail: userSettings.showEmail,
    //   },
    // });

    showSuccessToast();
  } catch (error) {
    console.error("Error saving profile:", error);
  } finally {
    isSaving.value = false;
  }
};

// Navigate to reset password page
const navigateToResetPassword = () => {
  navigateTo("/forgot-password");
};

// Show success toast
const showSuccessToast = () => {
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// Update theme setting
const updateThemeSetting = async (value) => {
  // Update local state
  userSettings.isLight = value;

  // Update color mode store
  colorModeStore.toggleColorMode(value);

  // The store will handle saving to database
};

// Generic function to update any setting in real-time
const updateSetting = async (settingName, value) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    isSaving.value = true;

    const userRef = dbRef(db, `users/${user.uid}`);
    const updates = {};

    // Update the setting in advancedSettings
    updates[`advancedSettings/${settingName}`] = value;

    // Special case for notifications which is stored at the root level
    if (settingName === "notifications") {
      updates["isMuted"] = !value;
    }

    // Special case for theme which should update the color mode store
    if (settingName === "isLight") {
      colorModeStore.toggleColorMode(value);
    }

    await update(userRef, updates);
    showSuccessToast();
  } catch (error) {
    console.error(`Error updating ${settingName}:`, error);
  } finally {
    isSaving.value = false;
  }
};

// Update font size setting
const updateFontSizeSetting = async (size) => {
  // Update local state
  userSettings.fontSize = size;

  // Update font size store
  fontSizeStore.setFontSize(size);

  // Update database
  const user = auth.currentUser;
  if (user) {
    try {
      isSaving.value = true;
      const userRef = dbRef(db, `users/${user.uid}`);
      const updates = {};
      updates[`advancedSettings/fontSize`] = size;
      await update(userRef, updates);
      showSuccessToast();
    } catch (error) {
      console.error("Error updating font size:", error);
    } finally {
      isSaving.value = false;
    }
  }
};
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
