<template>
  <div
    class="flex flex-col items-center space-y-6 my-3 rounded-lg py-4 bg-gray-100 dark:bg-gray-800 w-20 h-screen"
  >
    <!-- User Avatar -->
    <img
      :src="avatarUrl || '/images/user_avatar.png'"
      class="w-12 h-12 rounded-full border-2 border-white dark:border-gray-700"
      alt="User Avatar"
      referrerpolicy="no-referrer"
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
import { db } from "~/firebase/firebase.js";

const route = useRoute();

const avatarUrl = ref(null);

const isActivePage = (path) => route.path === path;

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User is signed in:", user);
      fetchUserAvatar();
    } else {
      avatarUrl.value = "/images/user_avatar.png";
    }
  });
});

const fetchUserAvatar = async () => {
  const user = auth.currentUser;
  if (!user) {
    avatarUrl.value = "/images/user_avatar.png";
    return;
  }
  try {
    const userRef = dbRef(db, `users/${user.uid}`);
    const userSnapshot = await get(userRef);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      const avatarUrlFromDb = userData.avatarUrl;
      if (avatarUrlFromDb) {
        avatarUrl.value = avatarUrlFromDb || "/images/user_avatar.png";
        return;
      }
    } else {
      avatarUrl.value = "/images/user_avatar.png";
    }
    console.log("User avatar not found in the database.");
  } catch (error) {
    console.error("Error fetching user avatar:", error);
    avatarUrl.value = "/images/user_avatar.png";
  }

  if (
    user.providerData.some(
      (provider) => provider.providerId === "google.com"
    ) ||
    user.photoURL?.includes("googleusercontent.com")
  ) {
    avatarUrl.value = user.photoURL;
    return;
  }
};

// const fetchUserAvatar = async () => {
//   const user = auth.currentUser;
//   if (user) {
//     if (
//       user.providerData.some((provider) => provider.providerId === "google.com")
//     ) {
//       avatarUrl.value = user.photoURL;
//     } else {
//       const userDocRef = doc(db, "users", user.uid);
//       const userDoc = await getDoc(userDocRef);

//       if (userDoc.exists()) {
//         const userData = userDoc.data();
//         avatarUrl.value = userData.avatarUrl || "/images/user_avatar.png";
//       } else {
//         avatarUrl.value = "/images/user_avatar.png";
//       }
//     }
//   } else {
//     avatarUrl.value = "/images/user_avatar.png";
//   }
// };
</script>
