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
      <div class="relative z-10 mx-auto">
        <h1 class="text-4xl font-bold text-white mb-4">Reset Your Password</h1>
        <p class="text-white/90 max-w-md">
          Enter your email address below, and we'll send you a link to reset
          your password.
        </p>
      </div>
    </div>

    <!-- Right side with forgot password form -->
    <div class="w-full md:w-1/2 flex items-center justify-center p-8">
      <div class="w-full max-w-md">
        <h2 class="text-gray-500 text-xl font-medium mb-8 text-center">
          RESET PASSWORD
        </h2>

        <form @submit.prevent="handleForgotPassword">
          <!-- Email input -->
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
                  d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                />
                <path
                  d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"
                />
              </svg>
            </div>
            <input
              type="email"
              v-model="email"
              class="bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md pl-10 pr-4 py-3 w-full"
              placeholder="Email"
              required
            />
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 uppercase"
          >
            {{ isLoading ? "Sending..." : "Send Reset Link" }}
          </button>

          <!-- Back to login link -->
          <!-- <div class="text-center mt-4">
            <p class="text-sm text-gray-400">
              Remember your password?
              <NuxtLink to="/login" class="text-purple-500 hover:underline"
                >Login here</NuxtLink
              >
            </p>
          </div> -->

          <!-- Error message -->
          <div
            v-if="error"
            class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md"
          >
            <p class="text-sm">{{ error }}</p>
          </div>

          <!-- Success message -->
          <div
            v-if="success"
            class="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md"
          >
            <p class="text-sm">
              A password reset email has been sent to {{ email }}. Please check
              your inbox.
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "~/firebase/firebase.js";

const email = ref("");
const error = ref("");
const success = ref(false);
const isLoading = ref(false);

//handle password reset request
const handleForgotPassword = async () => {
  try {
    isLoading.value = true;
    error.value = "";
    success.value = false;

    await sendPasswordResetEmail(auth, email.value);

    success.value = true;
  } catch (err) {
    console.error("Error sending password reset email:", err);
    error.value = err.message || "Failed to send password reset email.";
  } finally {
    isLoading.value = false;
  }
};
</script>
