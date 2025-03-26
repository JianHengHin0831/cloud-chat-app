<!-- components/SeoMeta.vue -->
<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
    default: "Cloudtalk - Real-time Group Chat Application",
  },
  description: {
    type: String,
    default:
      "Connect with people worldwide in real-time with our chat platform. Join conversations, meet new friends, and find new interest.",
  },
  image: {
    type: String,
    default: "/images/chat-og.jpg",
  },
  keywords: {
    type: String,
    default:
      "english chat, real-time chat, language exchange, meet people, online chat",
  },
  noIndex: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const fullUrl = computed(() => `https://yourdomain.com${route.path}`);

useHead({
  title: props.title,
  meta: [
    { name: "description", content: props.description },
    { name: "keywords", content: props.keywords },

    // Open Graph
    { property: "og:title", content: props.title },
    { property: "og:description", content: props.description },
    { property: "og:image", content: props.image },
    { property: "og:url", content: fullUrl.value },
    { property: "og:type", content: "website" },

    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: props.title },
    { name: "twitter:description", content: props.description },
    { name: "twitter:image", content: props.image },

    // No-index if needed
    ...(props.noIndex ? [{ name: "robots", content: "noindex" }] : []),
  ],
  link: [{ rel: "canonical", href: fullUrl.value }],
});
</script>

<template></template>
