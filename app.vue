<template>
  <ClientOnly>
    <div>
      <NuxtRouteAnnouncer />
      <NuxtPage /></div
  ></ClientOnly>
</template>

<script setup>
import { onMounted } from "vue";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "~/firebase/firebase.js";
import { navigateTo } from "#app";

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // 检查 Token 是否过期
      const decodedToken = await user.getIdTokenResult();
      const expirationTime = new Date(decodedToken.expirationTime);

      if (new Date() > expirationTime) {
        await auth.signOut();
        localStorage.removeItem("loginTime");
        navigateTo("/login");
      }
    } else {
      navigateTo("/login");
    }
  });
});
</script>
