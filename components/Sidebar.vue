<template>
  <div
    class="flex flex-col items-center space-y-6 py-4 bg-gray-100 w-20 h-screen"
  >
    <!-- User Avatar -->
    <img
      :src="avatarUrl || '/images/user_avatar.png'"
      class="w-12 h-12 rounded-full"
      alt="User Avatar"
    />

    <!-- Navigation Icons -->
    <nav class="flex flex-col items-center space-y-4">
      <!-- Message Icon -->
      <NuxtLink to="/" class="p-2">
        <Icon
          icon="bi:chat-square-dots"
          class="w-8 h-8"
          :class="isActivePage('/') ? 'text-blue-600' : 'text-black'"
        />
      </NuxtLink>

      <!-- Search Icon -->
      <NuxtLink to="/search" class="p-2">
        <Icon
          icon="mdi:magnify"
          class="w-8 h-8"
          :class="isActivePage('/search') ? 'text-blue-600' : 'text-black'"
        />
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import { auth } from "~/firebase/firebase.js";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// 获取当前路由
const route = useRoute();

// 用户头像 URL
const avatarUrl = ref(null);

// 检查当前页面是否激活
const isActivePage = (path) => route.path === path;

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchUserAvatar(); // 用户已登录，获取头像
    } else {
      avatarUrl.value = "/images/user_avatar.png"; // 用户未登录，使用默认头像
    }
  });
});

// 从 Firestore 获取用户头像
const fetchUserAvatar = async () => {
  const user = auth.currentUser;
  if (user) {
    // 检查用户是否通过 Google 登录
    if (
      user.providerData.some((provider) => provider.providerId === "google.com")
    ) {
      // 使用 Google 的头像
      avatarUrl.value = user.photoURL;
    } else {
      // 从 Firestore 获取用户信息
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        avatarUrl.value = userData.avatarUrl || "/images/user_avatar.png"; // 使用 Firestore 中的头像或默认头像
      } else {
        // 如果用户文档不存在，使用默认头像
        avatarUrl.value = "/images/user_avatar.png";
      }
    }
  } else {
    // 用户未登录，使用默认头像
    avatarUrl.value = "/images/user_avatar.png";
  }
};

// 监听 Firebase Auth 状态变化
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchUserAvatar(); // 用户已登录，获取头像
    } else {
      avatarUrl.value = "/images/user_avatar.png"; // 用户未登录，使用默认头像
    }
  });
});
</script>
