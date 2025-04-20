<template>
  <div class="space-y-6">
    <!-- 2FA Status -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Status
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{
            is2FAEnabled
              ? "Two-factor authentication is enabled"
              : "Two-factor authentication is disabled"
          }}
        </p>
      </div>
      <div class="flex gap-2">
        <button
          v-if="!is2FAEnabled"
          @click="enable2FA"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Enable
        </button>
        <button
          v-else
          @click="handleDisable2FA"
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Disable
        </button>
      </div>
    </div>

    <!-- 2FA Enrollment Form -->
    <div v-if="showEnrollmentForm" class="space-y-4">
      <div class="text-center">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Set up Two-Factor Authentication
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          1. Download Google Authenticator on your phone
          <br />
          2. Scan the QR code below
          <br />
          3. Enter the 6-digit code from the app
        </p>
      </div>

      <div class="flex justify-center">
        <img v-if="qrCode" :src="qrCode" alt="TOTP QR Code" class="w-48 h-48" />
      </div>

      <div
        v-if="secret"
        class="text-center text-sm text-gray-600 dark:text-gray-400"
      >
        <p>If you can't scan the QR code, enter this code manually:</p>
        <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{{
          secret
        }}</code>
      </div>

      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Verification Code
        </label>
        <input
          v-model="verificationCode"
          type="text"
          maxlength="6"
          pattern="[0-9]*"
          inputmode="numeric"
          class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Enter 6-digit code"
        />
      </div>

      <button
        @click="verifyCode"
        :disabled="!verificationCode || verificationCode.length !== 6"
        class="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Verify Code
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="text-red-500 text-sm">
      {{ error }}
    </div>

    <!-- reCAPTCHA Container -->
    <div id="recaptcha-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getAuth } from "firebase/auth";
import {
  generateTOTP,
  verifyTOTP,
  checkMFAStatus,
  disableMFA,
} from "~/utils/authHelper";
import { VueTelInput } from "vue3-tel-input";
import "vue3-tel-input/dist/vue3-tel-input.css";

const auth = getAuth();
auth.languageCode = "en";

const is2FAEnabled = ref(false);
const showEnrollmentForm = ref(false);
const showVerificationForm = ref(false);
const verificationCode = ref("");
const error = ref("");
const qrCode = ref("");
const secret = ref("");
const isRecaptchaVerified = ref(false);

const enable2FA = async () => {
  try {
    error.value = "";
    showEnrollmentForm.value = true;

    const { secret: newSecret, qrCode: newQrCode } = await generateTOTP();
    secret.value = newSecret;
    qrCode.value = newQrCode;
  } catch (err) {
    console.error("Error enabling 2FA:", err);
    error.value = err.message || "Failed to enable 2FA";
  }
};

const verifyCode = async () => {
  try {
    error.value = "";
    if (!verificationCode.value) {
      error.value = "Please enter the verification code";
      return;
    }

    const isValid = await verifyTOTP(verificationCode.value);
    if (isValid) {
      is2FAEnabled.value = true;
      showEnrollmentForm.value = false;
      showVerificationForm.value = false;
      verificationCode.value = "";
    } else {
      error.value = "Invalid verification code";
    }
  } catch (err) {
    console.error("Error verifying code:", err);
    error.value = err.message || "Failed to verify code";
  }
};

const handleDisable2FA = async () => {
  try {
    error.value = "";
    await disableMFA();
    is2FAEnabled.value = false;
  } catch (err) {
    console.error("Error disabling 2FA:", err);
    error.value = err.message || "Failed to disable 2FA";
  }
};

const checkStatus = async () => {
  try {
    is2FAEnabled.value = await checkMFAStatus();
  } catch (err) {
    console.error("Error checking 2FA status:", err);
  }
};

onMounted(() => {
  checkStatus();
});
</script>

<style scoped>
/* Base styles for the phone input */
.vue3-tel-input {
  width: 100%;
}

/* Input field styles */
.vue3-tel-input .vti__input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid;
  border-radius: 0.5rem;
  transition-property: box-shadow, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.vue3-tel-input .vti__input:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0
    var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0
    calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow),
    var(--tw-shadow, 0 0 #0000);
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(59 130 246 / var(--tw-ring-opacity));
  border-color: rgb(59 130 246 / var(--tw-ring-opacity));
}
.dark .vue3-tel-input .vti__input {
  background-color: rgb(55 65 81 / 1);
  border-color: rgb(75 85 99 / 1);
  color: white;
}

/* Country dropdown styles */
.vue3-tel-input .vti__dropdown {
  border: 1px solid;
  border-radius: 0.5rem;
}
.dark .vue3-tel-input .vti__dropdown {
  background-color: rgb(55 65 81 / 1);
  border-color: rgb(75 85 99 / 1);
}

/* Country dropdown item styles */
.dark .vue3-tel-input .vti__dropdown-item {
  color: white;
}
.dark .vue3-tel-input .vti__dropdown-item:hover {
  background-color: rgb(75 85 99 / 1);
}

.vue3-tel-input .vti__dropdown-item.highlighted {
  background-color: rgb(75 85 99 / 1);
}

/* Flag styles */
.vue3-tel-input .vti__flag {
  width: 1.5rem;
  height: 1rem;
}

/* Country code styles */
.dark .vue3-tel-input .vti__country-code {
  color: white;
}

/* Dropdown button styles */
.dark .vue3-tel-input .vti__dropdown-button {
  background-color: rgb(55 65 81 / 1);
  border-color: rgb(75 85 99 / 1);
}

/* Selected country styles */
.dark .vue3-tel-input .vti__selected-flag {
  background-color: rgb(55 65 81 / 1);
}

/* Input container styles */
.dark .vue3-tel-input .vti__input-container {
  background-color: rgb(55 65 81 / 1);
}
</style>
