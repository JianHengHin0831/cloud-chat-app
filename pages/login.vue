<template>
  <div class="flex h-screen w-full">
    <!-- Left side with gradient background -->
    <div
      class="hidden md:flex md:w-1/2 relative bg-gradient-to-br from-purple-500 to-pink-500 p-10 flex-col justify-center"
    >
      <!-- Abstract shapes -->
      <div class="absolute inset-0 overflow-hidden">
        <div
          class="absolute left-0 bottom-0 w-16 h-64 bg-orange-300 rounded-full transform rotate-45 translate-y-20 translate-x-10 opacity-70"
        ></div>
        <div
          class="absolute left-20 bottom-10 w-16 h-64 bg-pink-300 rounded-full transform rotate-45 translate-y-10 opacity-70"
        ></div>
        <div
          class="absolute left-40 bottom-20 w-12 h-64 bg-orange-400 rounded-full transform rotate-45 translate-y-5 opacity-70"
        ></div>
        <div
          class="absolute left-10 bottom-40 w-12 h-64 bg-pink-400 rounded-full transform rotate-45 translate-y-0 opacity-70"
        ></div>
        <div
          class="absolute left-60 bottom-0 w-10 h-64 bg-orange-300 rounded-full transform rotate-45 translate-y-20 opacity-70"
        ></div>

        <!-- Diagonal lines -->
        <div
          v-for="(_, index) in 8"
          :key="index"
          :class="`absolute h-1 w-40 bg-gradient-to-r from-orange-400 to-pink-300 rounded-full transform rotate-45 opacity-70`"
          :style="`left: ${index * 20}px; top: ${200 + index * 30}px;`"
        ></div>
      </div>

      <!-- Welcome text -->
      <div class="relative mx-auto z-10 flex flex-col items-center text-center">
        <!-- University Logo -->
        <img
          src="@/assets/university_logo.png"
          alt="University Logo"
          class="w-36 mb-4"
        />

        <!-- Course Title -->
        <h1 class="text-lg font-semibold text-white mb-4">
          COMP3207 CLOUD APPLICATION DEVELOPMENT - Chatroom
        </h1>

        <!-- Branding & Welcome Message -->
        <div class="bg-white/10 p-6 rounded-lg shadow-lg max-w-lg">
          <div class="flex items-center justify-center gap-4">
            <img
              src="@/assets/cloud_logo.png"
              alt="CloudTalk Logo"
              class="w-12 h-12"
            />
            <h1 class="text-4xl font-bold text-white">Welcome to CloudTalk</h1>
          </div>

          <!-- Description -->
          <p class="text-white/90 mt-4">
            Connect, share, and explore with like-minded individuals. Join
            groups, discuss topics, and stay updated with the latest trends. Log
            in now to be part of the conversation!
          </p>
        </div>
      </div>
    </div>

    <!-- Right side with login form -->
    <div class="w-full md:w-1/2 flex items-center justify-center p-8">
      <div class="w-full max-w-md">
        <h2 class="text-gray-500 text-xl font-medium mb-8 text-center">
          USER LOGIN
        </h2>

        <form @submit.prevent="handleLogin">
          <!-- Username input -->
          <div class="mb-4 relative">
            <div
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              v-model="email"
              autocomplete="email"
              class="bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md pl-10 pr-4 py-3 w-full"
              placeholder="Email"
            />
          </div>
          <p v-if="emailError" class="text-sm text-red-500 mt-1">
            {{ emailError }}
          </p>

          <!-- Password input -->
          <div class="mb-6 relative">
            <div
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <input
              type="password"
              autocomplete="current-password"
              class="bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md pl-10 pr-4 py-3 w-full"
              placeholder="Password"
              v-model="password"
            />
          </div>
          <p v-if="passwordError" class="text-sm text-red-500 mt-1">
            {{ passwordError }}
          </p>

          <!-- Remember me and forgot password -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center">
              <input
                type="checkbox"
                id="remember"
                class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label for="remember" class="ml-2 block text-sm text-gray-400"
                >Remember me</label
              >
            </div>
            <div>
              <NuxtLink
                to="/forgot-password"
                class="text-sm text-gray-400 hover:text-purple-500"
                >Forgot password?</NuxtLink
              >
            </div>
          </div>

          <!-- Login button -->
          <button
            type="submit"
            class="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 uppercase"
          >
            {{ isLoading ? "Logging in..." : "Login" }}
          </button>
        </form>
        <div
          v-if="loginError"
          class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md"
        >
          <p class="text-sm">{{ loginError }}</p>
        </div>
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Don't have an account?
            <NuxtLink
              to="/register"
              class="text-indigo-600 hover:text-indigo-500"
              >Sign up</NuxtLink
            >
          </p>
        </div>
        <div class="mt-6">
          <p class="text-sm text-gray-600 text-center mb-4">
            Log in with another methods
          </p>
          <button
            @click="signInWithGoogle"
            class="w-10 bg-red-600 text-white py-1 px-1 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center shadow-md"
          >
            <font-awesome-icon :icon="['fab', 'google']" class="" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { auth, db, googleProvider } from "~/firebase/firebase.js";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { ref as dbRef, set, get } from "firebase/database";

//SEO meta
const title = "Login to Cloudtalk - Chat Room Application";
const description =
  "Login to access your Cloudtalk account and start chatting with people from around the world in real-time.";

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
});

const email = ref("");
const password = ref("");
const loginError = ref("");
const emailError = ref("");
const passwordError = ref("");
const isLoading = ref(false);
const router = useRouter();
import { useFcmToken } from "~/composables/useFcmToken";
const { isSupported, getPermissionStatus, requestPermission, updateToken } =
  useFcmToken();

const { sendNotification } = useNotification();

const showNotificationPrompt = ref(false);

// Check notification status after login
const checkNotifications = async (userId) => {
  if (!isSupported()) return;

  const status = getPermissionStatus();
  if (status === "granted") {
    await updateToken(userId);
  } else if (status === "default") {
    showNotificationPrompt.value = true;
  }
};

// Call this from user gesture only
const enableNotifications = async () => {
  const token = await requestPermission();
  if (token) {
    await updateToken(currentUser.value.uid);
    showNotificationPrompt.value = false;
  }
};

const sendTestNotification = async (userId) => {
  try {
    if (!auth.currentUser) {
      throw new Error("No authenticated user");
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    await sendNotification({
      userId: userId,
      isSaveNotification: true,
      notification: {
        title: "Welcome to CloudTalk",
        body: "You've successfully logged in",
        chatroomId: "welcome_chat",
      },
    });
  } catch (error) {
    console.error("Notification sending error:", error);
  }
};

const handleLogin = async () => {
  try {
    isLoading.value = true; // 开始加载
    loginError.value = ""; // 清空之前的错误信息

    await setPersistence(auth, browserLocalPersistence);

    // 使用 Firebase Authentication 登录
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
    const user = userCredential.user;
    await checkNotifications(user.uid);

    localStorage.setItem("loginTime", new Date().toISOString());

    // 登录成功后重定向到主页或其他页面
    router.push("/");
  } catch (error) {
    console.error("Login error:", error);

    // 根据错误类型显示友好的错误信息
    switch (error.code) {
      case "auth/invalid-email":
        loginError.value = "Invalid email address.";
        break;
      case "auth/user-not-found":
        loginError.value = "User not found.";
        break;
      case "auth/wrong-password":
        loginError.value = "Incorrect password.";
        break;
      case "auth/too-many-requests":
        loginError.value = "Too many failed attempts. Please try again later.";
        break;
      default:
        loginError.value = "Login failed. Please try again.";
    }
  } finally {
    isLoading.value = false; // 结束加载
  }
};

const signInWithGoogle = async () => {
  try {
    // 使用 Google 登录
    await setPersistence(auth, browserLocalPersistence);

    const result = await signInWithPopup(auth, googleProvider);
    localStorage.setItem("loginTime", new Date().toISOString());
    const user = result.user;

    // 检查 Realtime Database 中是否存在该用户
    const userRef = dbRef(db, `users/${user.uid}`); // 用户引用
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      // 如果用户不存在，则创建用户数据
      await set(userRef, {
        username: user.displayName || "Anonymous", // 用户名（如果没有则设为 "Anonymous"）
        email: user.email, // 电子邮件
        createdAt: new Date().toISOString(), // 创建时间
        joinedAt: new Date().toISOString(), // 加入时间
        emailVerified: user.emailVerified, // 邮件验证状态
        avatarUrl: user.photoURL || null, // 头像 URL（如果没有则设为 null）
        registerMethod: "google", // 注册方式
      });
      await checkNotifications(user.uid);
      await sendTestNotification(user.uid);

      await navigateTo("/");
    } else {
      await checkNotifications(user.uid);
      await sendTestNotification(user.uid);
      await navigateTo("/");
    }
  } catch (error) {
    console.error("Google login error:", error);
  }
};
</script>
