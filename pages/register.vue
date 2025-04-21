<template>
  <div class="flex h-screen w-full">
    <SeoMeta :title="title" :description="description" no-index />
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
            <h1 class="text-4xl font-bold text-white">Join our platform</h1>
          </div>

          <!-- Description -->
          <p class="text-white/90 mt-4">
            Create your account and get access to all our features. It only
            takes a minute to register and start your journey with us.
          </p>
        </div>
      </div>
    </div>

    <!-- Right side with registration form -->
    <div class="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-8">
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
        <div class="md:hidden text-center mb-24">
          <div class="flex justify-center mb-4">
            <img
              src="@/assets/cloud_logo.png"
              alt="CloudTalk Logo"
              class="w-16 h-16"
            />
          </div>
          <h1 class="text-2xl font-bold text-white mb-2">Create Account</h1>
          <p class="text-white/80 text-sm">Join CloudTalk today</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
          <h2
            class="text-gray-500 text-xl font-medium mb-8 text-center hidden md:block"
          >
            USER REGISTRATION
          </h2>

          <form @submit.prevent="handleRegister">
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
                v-model="displayName"
                class="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg pl-10 pr-4 py-3 w-full"
                placeholder="Username"
              />
            </div>

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
                @input="validateEmail"
                class="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg pl-10 pr-4 py-3 w-full"
                placeholder="Email"
                id="email"
                v-model="email"
                required
              />
              <p v-if="emailError" class="text-sm text-red-500 mt-1">
                {{ emailError }}
              </p>
            </div>

            <!-- Password input -->
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
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                class="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg pl-10 pr-10 py-3 w-full"
                placeholder="Password"
                @input="validatePassword"
              />
              <div
                class="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                @click="togglePassword"
              >
                <svg
                  v-if="showPassword"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fill-rule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                    clip-rule="evenodd"
                  />
                  <path
                    d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
                  />
                </svg>
              </div>
            </div>

            <!-- Confirm Password input -->
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
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="confirmPassword"
                class="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg pl-10 pr-10 py-3 w-full"
                placeholder="Confirm Password"
                @input="validatePassword"
              />
              <div
                class="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                @click="toggleConfirmPassword"
              >
                <svg
                  v-if="showConfirmPassword"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fill-rule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                    clip-rule="evenodd"
                  />
                  <path
                    d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
                  />
                </svg>
              </div>
            </div>
            <p v-if="passwordError" class="text-sm text-red-500 mt-1">
              {{ passwordError }}
            </p>

            <!-- Terms and conditions -->
            <div class="flex items-center mb-6">
              <input
                type="checkbox"
                v-model="terms"
                class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label
                for="terms"
                class="ml-2 block text-sm text-gray-600 dark:text-gray-300"
              >
                I agree to the
                <a
                  href="https://www.termsfeed.com/live/4b716cc1-c739-4b97-925d-b1df72dfefdb"
                  class="text-purple-500 hover:underline"
                  >Terms and Conditions</a
                >
              </label>
            </div>

            <!-- Register button -->
            <button
              type="submit"
              @click="handleRegister"
              class="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 uppercase transition-all duration-200"
            >
              Register
            </button>

            <!-- Login link -->
            <div class="text-center mt-4">
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Already have an account?
                <NuxtLink href="/login" class="text-purple-500 hover:underline"
                  >Login here</NuxtLink
                >
              </p>
            </div>
          </form>
          <div
            v-if="registrationError"
            class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg"
          >
            <p class="text-sm">{{ registrationError }}</p>
          </div>
          <div
            v-if="verificationSent"
            class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg"
          >
            <p class="text-sm">
              A verification email has been sent to {{ email }}. Please check
              your inbox.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { auth, db } from "~/firebase/firebase.js";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { ref as dbRef, set, get } from "firebase/database";
import { useRouter } from "vue-router";

//SEO Meta
import SeoMeta from "@/components/SEOMeta.vue";
const title = "Join Cloudtalk - Free Chat Room Application";
const description =
  "Create your free account to join our chat community and start chatting with people from around the world in real-time.";

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
});

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const displayName = ref("");
const emailError = ref("");
const passwordError = ref("");
const registrationError = ref("");
const verificationSent = ref(false);
const isLoading = ref(false); // loading state
const router = useRouter();
const terms = ref(false);

// validate email
const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value) {
    emailError.value = "Email is required.";
  } else if (!emailRegex.test(email.value)) {
    emailError.value = "Please enter a valid email address.";
  } else {
    emailError.value = "";
  }
};

//validate password strength and match
const validatePassword = () => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!password.value) {
    passwordError.value = "Password is required.";
  } else if (!passwordRegex.test(password.value)) {
    passwordError.value =
      "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
  } else if (password.value !== confirmPassword.value) {
    passwordError.value = "Password value must same as confirm password value";
  } else {
    passwordError.value = "";
  }
};

//check if form is valid
const isFormValid = computed(() => {
  return (
    email.value &&
    !emailError.value &&
    password.value &&
    !passwordError.value &&
    displayName.value
  );
});

//check if user already exists
const checkIfUserExists = async (email) => {
  const usersRef = dbRef(db, "users");
  const snapshot = await get(usersRef);

  if (!snapshot.exists()) return false;

  const usersData = snapshot.val();

  for (const userId in usersData) {
    if (
      usersData[userId].email &&
      usersData[userId].email.toLowerCase() === email.toLowerCase()
    ) {
      return true;
    }
  }

  return false;
};

import { useUserApi } from "~/composables/useUserApi";
const { register } = useUserApi();

//handle user registration
const handleRegister = async (event) => {
  event.preventDefault();

  try {
    validateEmail();
    validatePassword();
    if (!isFormValid.value) {
      return;
    }

    if (terms.value === false) {
      registrationError.value = "You must agree to the terms and conditions.";
      return;
    }

    if (password.value !== confirmPassword.value) {
      passwordError.value = "Password and confirm password must match.";
      return;
    }

    const userExists = await checkIfUserExists(email.value);
    if (userExists) {
      registrationError.value = "This email is already registered.";
      return;
    }

    isLoading.value = true;

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
    const user = userCredential.user;

    await sendEmailVerification(user);
    registrationError.value = "";
    passwordError.value = "";
    emailError.value = "";

    verificationSent.value = true;

    const interval = setInterval(async () => {
      await user.reload();
      if (user.emailVerified) {
        clearInterval(interval);

        await updateProfile(user, {
          displayName: displayName.value,
        });

        const userData = {
          username: displayName.value,
          email: user.email,
          createdAt: { ".sv": "timestamp" },
          joinedAt: { ".sv": "timestamp" },
          emailVerified: user.emailVerified,
          avatarUrl: null,
          registerMethod: "email",
          lastLogin: { ".sv": "timestamp" },
        };
        await user.getIdToken(true);

        await set(dbRef(db, "users/" + user.uid), userData);

        router.push("/login");
      }
    }, 1000);
  } catch (error) {
    console.error("Registration error:", error);
    registrationError.value = `Registration failed: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
};
// Password visibility toggles
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const toggleConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};
</script>
