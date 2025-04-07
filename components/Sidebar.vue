<template>
  <div
    class="flex flex-col items-center space-y-6 my-3 rounded-lg py-4 bg-gray-100 dark:bg-gray-800 w-20 h-screen"
  >
    <!-- User Avatar -->
    <img
      :src="avatarUrl || '/images/user_avatar.png'"
      class="w-12 h-12 rounded-full border-2 border-white dark:border-gray-700"
      alt="User Avatar"
    />

    <!-- Navigation Icons -->
    <nav class="flex flex-col items-center space-y-4">
      <!-- Message Icon -->
      <NuxtLink to="/" class="p-2">
        <Icon
          icon="bi:chat-square-dots"
          class="w-8 h-8"
          :class="
            isActivePage('/')
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-black dark:text-white'
          "
        />
      </NuxtLink>

      <!-- Search Icon -->
      <NuxtLink to="/search" class="p-2">
        <Icon
          icon="mdi:magnify"
          class="w-8 h-8"
          :class="
            isActivePage('/search')
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-black dark:text-white'
          "
        />
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import { auth } from "~/firebase/firebase.js";
import { get, ref as dbRef } from "firebase/database";
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

const fetchUserAvatar = async () => {
  const user = auth.currentUser;
  if (!user) {
    avatarUrl.value = "/images/user_avatar.png";
    return;
  }

  // 检查用户是否通过 Google 登录
  if (
    user.providerData.some(
      (provider) => provider.providerId === "google.com"
    ) ||
    user.photoURL.includes("googleusercontent.com")
  ) {
    // 使用 Google 的头像
    avatarUrl.value = user.photoURL;
    return;
  }

  try {
    // 从 Realtime Database 获取用户数据
    const userRef = dbRef(db, `users/${user.uid}`);
    const userSnapshot = await get(userRef);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      avatarUrl.value = userData.avatarUrl || "/images/user_avatar.png";
    } else {
      // 如果用户数据不存在，使用默认头像
      avatarUrl.value = "/images/user_avatar.png";
    }
  } catch (error) {
    console.error("Error fetching user avatar:", error);
    avatarUrl.value = "/images/user_avatar.png";
  }
};

// const fetchUserAvatar = async () => {
//   const user = auth.currentUser;
//   if (user) {
//     // 检查用户是否通过 Google 登录
//     if (
//       user.providerData.some((provider) => provider.providerId === "google.com")
//     ) {
//       // 使用 Google 的头像
//       avatarUrl.value = user.photoURL;
//     } else {
//       const userDocRef = doc(db, "users", user.uid);
//       const userDoc = await getDoc(userDocRef);

//       if (userDoc.exists()) {
//         const userData = userDoc.data();
//         avatarUrl.value = userData.avatarUrl || "/images/user_avatar.png";
//       } else {
//         // 如果用户文档不存在，使用默认头像
//         avatarUrl.value = "/images/user_avatar.png";
//       }
//     }
//   } else {
//     // 用户未登录，使用默认头像
//     avatarUrl.value = "/images/user_avatar.png";
//   }
// };

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
