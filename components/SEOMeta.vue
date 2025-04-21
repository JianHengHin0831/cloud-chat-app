<!-- components/SeoMeta.vue -->
<template></template>

<script setup>
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

const siteUrl = "https://my-nuxt-app-b8742.web.app";

const route = useRoute();
const fullUrl = computed(() =>
  `${siteUrl}${route.fullPath}`.replace(/\/$/, "")
);
const imageUrl = computed(
  () => props.image || `${siteUrl}/images/cloud_logo_dark_big.png`
);
const title = computed(
  () => props.title || "CloudTalk - Real-time Group Chat Application"
);
const description = computed(
  () =>
    props.description ||
    "Connect with people worldwide in real-time with our chat platform. Join conversations, meet new friends, and find new interest."
);

useHead({
  title: title.value,
  meta: [
    { name: "description", content: description.value },
    { name: "keywords", content: props.keywords },

    // Open Graph
    { property: "og:title", content: title.value },
    { property: "og:description", content: description.value },
    { property: "og:image", content: imageUrl.value },
    { property: "og:url", content: fullUrl.value },
    { property: "og:type", content: "website" },

    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title.value },
    { name: "twitter:description", content: description.value },
    { name: "twitter:image", content: imageUrl.value },

    // No-index
    ...(props.noIndex ? [{ name: "robots", content: "noindex" }] : []),
  ],
  link: [{ rel: "canonical", href: fullUrl.value }],
});
</script>
