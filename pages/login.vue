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
    <div
      class="bg-gray-100 dark:bg-gray-800 w-full md:w-1/2 flex items-center justify-center p-4 sm:p-8"
    >
      <!-- Mobile background elements -->
      <div class="md:hidden absolute inset-0 overflow-hidden">
        <div
          class="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-br from-purple-500 to-pink-500"
        ></div>
        <div
          class="absolute top-1/3 left-0 w-full h-2/3 bg-gray-50 dark:bg-gray-900"
        ></div>
        <!-- Decorative circles -->
        <div
          class="absolute top-1/4 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-1/2"
        ></div>
        <div
          class="absolute top-1/3 left-0 w-24 h-24 bg-white/10 rounded-full transform -translate-x-1/2"
        ></div>
      </div>

      <div class="w-full max-w-md relative z-10">
        <!-- Mobile header -->
        <div class="md:hidden my-auto text-center mb-24">
          <div class="flex justify-center mb-4">
            <img
              src="@/assets/cloud_logo.png"
              alt="CloudTalk Logo"
              class="w-16 h-16"
            />
          </div>
          <h1 class="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p class="text-white/80 text-sm">Sign in to continue to CloudTalk</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
          <h2
            class="text-gray-500 text-xl font-medium mb-8 text-center hidden md:block"
          >
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
                class="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg pl-10 pr-4 py-3 w-full"
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
                class="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg pl-10 pr-4 py-3 w-full"
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
                <label
                  for="remember"
                  class="ml-2 block text-sm text-gray-600 dark:text-gray-300"
                  >Remember me</label
                >
              </div>
              <div>
                <NuxtLink
                  to="/forgot-password"
                  class="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-500"
                  >Forgot password?</NuxtLink
                >
              </div>
            </div>

            <!-- Login button -->
            <button
              type="submit"
              class="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 uppercase transition-all duration-200"
            >
              {{ isLoading ? "Logging in..." : "Login" }}
            </button>
          </form>
          <div
            v-if="loginError"
            class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg"
          >
            <p class="text-sm">{{ loginError }}</p>
          </div>
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600 dark:text-gray-300">
              Don't have an account?
              <NuxtLink
                to="/register"
                class="text-purple-600 dark:text-purple-400 hover:text-purple-500"
                >Sign up</NuxtLink
              >
            </p>
          </div>
          <div class="mt-6">
            <p
              class="text-sm text-gray-600 dark:text-gray-300 text-center mb-4"
            >
              Log in with another methods
            </p>
            <button
              @click="signInWithGoogle"
              class="w-48 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center gap-2 shadow-md transition-all duration-200"
            >
              <font-awesome-icon
                :icon="['fab', 'google']"
                class="text-red-500"
              />
              <span class="text-sm !min-w-fit">Continue with Google</span>
            </button>
          </div>

          <!-- MFA Verification Form -->
          <div v-if="showMFAVerification" class="mt-8 space-y-6">
            <div>
              <h3
                class="text-center text-lg font-medium text-gray-900 dark:text-white"
              >
                Two-Factor Authentication
              </h3>
              <p
                class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400"
              >
                Please enter the verification code from your authenticator app
              </p>
            </div>

            <div>
              <label for="verification-code" class="sr-only"
                >Verification Code</label
              >
              <input
                id="verification-code"
                v-model="mfaVerificationCode"
                type="text"
                required
                class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter 6-digit code"
                maxlength="6"
                pattern="[0-9]*"
              />
            </div>

            <div>
              <button
                @click="verifyMFACode"
                :disabled="loading"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {{ loading ? "Verifying..." : "Verify Code" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { auth, db, googleProvider } from "~/firebase/firebase.js";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { ref as dbRef, set, get } from "firebase/database";
import { verifyTOTP } from "~/utils/authHelper";
import { logEvent, trackMetric } from "~/utils/logging";
import { useFcmToken } from "~/composables/useFcmToken";

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
const error = ref("");
const loading = ref(false);
const showMFAVerification = ref(false);
const mfaVerificationCode = ref("");
const router = useRouter();
const { isSupported, getPermissionStatus, requestPermission, updateToken } =
  useFcmToken();

// 添加缺失的响应式变量
const emailError = ref("");
const passwordError = ref("");
const loginError = ref("");
const isLoading = ref(false);

// Check notification status after login
const checkNotifications = async (userId) => {
  if (!isSupported()) return;

  const status = getPermissionStatus();
  if (status === "granted") {
    await updateToken(userId);
  }
};

// 处理登录
const handleLogin = async () => {
  const startTime = Date.now();
  try {
    isLoading.value = true;
    error.value = "";
    emailError.value = "";
    passwordError.value = "";
    loginError.value = "";

    // 记录登录尝试
    logEvent("login_attempt", {
      method: "email",
      email: email.value,
      timestamp: new Date().toISOString(),
    });

    // 使用邮箱密码登录
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );

    const user = userCredential.user;

    // 检查用户是否启用了 MFA
    const userRef = dbRef(db, `users/${user.uid}/securitySettings`);
    const userSnapshot = await get(userRef);

    if (userSnapshot.exists() && userSnapshot.val().mfaEnabled) {
      // 用户启用了 MFA，需要验证
      showMFAVerification.value = true;

      // 记录MFA验证请求
      logEvent("mfa_verification_requested", {
        userId: user.uid,
        timestamp: new Date().toISOString(),
      });
    } else {
      // 没有启用 MFA，直接登录成功
      await checkNotifications(user.uid);
      localStorage.setItem("loginTime", new Date().toISOString());

      // 记录登录成功
      const duration = Date.now() - startTime;
      logEvent("login_success", {
        userId: user.uid,
        method: "email",
        duration,
        timestamp: new Date().toISOString(),
      });

      trackMetric("login_duration", duration, {
        method: "email",
        mfa_enabled: "false",
      });

      trackMetric("login_success_count", 1, {
        method: "email",
      });

      await router.push("/");
    }
  } catch (err) {
    console.error("Login error:", err);

    // 记录登录失败
    logEvent("login_failure", {
      method: "email",
      error: err.code,
      message: err.message,
      timestamp: new Date().toISOString(),
    });

    trackMetric("login_failure_count", 1, {
      method: "email",
      error_code: err.code,
    });

    if (err.code === "auth/invalid-email") {
      emailError.value = "Invalid email address";
    } else if (err.code === "auth/wrong-password") {
      passwordError.value = "Incorrect password";
    } else if (err.code === "auth/user-not-found") {
      emailError.value = "User not found";
    } else {
      loginError.value = err.message || "Login failed";
    }
  } finally {
    isLoading.value = false;
  }
};

// 验证 MFA 验证码
const verifyMFACode = async () => {
  const startTime = Date.now();
  try {
    loading.value = true;
    error.value = "";

    if (!mfaVerificationCode.value) {
      error.value = "Please enter the verification code";
      return;
    }

    // 记录MFA验证尝试
    logEvent("mfa_verification_attempt", {
      userId: auth.currentUser?.uid,
      timestamp: new Date().toISOString(),
    });

    // 验证 TOTP 验证码
    const isValid = await verifyTOTP(mfaVerificationCode.value);

    if (isValid) {
      // 验证成功，完成登录
      await checkNotifications(auth.currentUser.uid);
      localStorage.setItem("loginTime", new Date().toISOString());

      // 记录MFA验证成功
      const duration = Date.now() - startTime;
      logEvent("mfa_verification_success", {
        userId: auth.currentUser?.uid,
        duration,
        timestamp: new Date().toISOString(),
      });

      trackMetric("mfa_verification_duration", duration, {
        result: "success",
      });

      trackMetric("mfa_verification_success_count", 1, {});

      await router.push("/");
    } else {
      // 记录MFA验证失败
      logEvent("mfa_verification_failure", {
        userId: auth.currentUser?.uid,
        reason: "invalid_code",
        timestamp: new Date().toISOString(),
      });

      trackMetric("mfa_verification_failure_count", 1, {
        reason: "invalid_code",
      });

      error.value = "Invalid verification code";
    }
  } catch (err) {
    console.error("MFA verification error:", err);

    // 记录MFA验证错误
    logEvent("mfa_verification_error", {
      userId: auth.currentUser?.uid,
      error: err.message,
      timestamp: new Date().toISOString(),
    });

    trackMetric("mfa_verification_failure_count", 1, {
      reason: "error",
    });

    error.value = err.message || "Failed to verify code";
  } finally {
    loading.value = false;
  }
};

const signInWithGoogle = async () => {
  const startTime = Date.now();
  try {
    isLoading.value = true;
    error.value = "";
    loginError.value = "";

    // 记录Google登录尝试
    logEvent("login_attempt", {
      method: "google",
      timestamp: new Date().toISOString(),
    });

    // 使用 Google 登录
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // 检查 Realtime Database 中是否存在该用户
    const userRef = dbRef(db, `users/${user.uid}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      // 如果用户不存在，则创建用户数据
      await set(userRef, {
        username: user.displayName || "Anonymous",
        email: user.email,
        createdAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        emailVerified: user.emailVerified,
        avatarUrl: user.photoURL || null,
        registerMethod: "google",
      });

      // 记录新用户创建
      logEvent("new_user_created", {
        userId: user.uid,
        method: "google",
        timestamp: new Date().toISOString(),
      });
    }

    // 检查用户是否启用了 MFA
    const securitySettingsRef = dbRef(db, `users/${user.uid}/securitySettings`);
    const securitySnapshot = await get(securitySettingsRef);

    if (securitySnapshot.exists() && securitySnapshot.val().mfaEnabled) {
      // 用户启用了 MFA，需要验证
      showMFAVerification.value = true;

      // 记录MFA验证请求
      logEvent("mfa_verification_requested", {
        userId: user.uid,
        method: "google",
        timestamp: new Date().toISOString(),
      });
    } else {
      // 没有启用 MFA，直接登录成功
      await checkNotifications(user.uid);
      localStorage.setItem("loginTime", new Date().toISOString());

      // 记录Google登录成功
      const duration = Date.now() - startTime;
      logEvent("login_success", {
        userId: user.uid,
        method: "google",
        duration,
        timestamp: new Date().toISOString(),
      });

      trackMetric("login_duration", duration, {
        method: "google",
        mfa_enabled: "false",
      });

      trackMetric("login_success_count", 1, {
        method: "google",
      });

      await router.push("/");
    }
  } catch (err) {
    console.error("Google login error:", err);

    // 记录Google登录失败
    logEvent("login_failure", {
      method: "google",
      error: err.code,
      message: err.message,
      timestamp: new Date().toISOString(),
    });

    trackMetric("login_failure_count", 1, {
      method: "google",
      error_code: err.code,
    });

    loginError.value = err.message || "Google login failed";
  } finally {
    isLoading.value = false;
  }
};
</script>
