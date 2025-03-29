// firebase-messaging-sw.js

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js"
);

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyAk7UITYRxCKdyms5JWD_4Wn-b6mEzJbr0",
  authDomain: "my-nuxt-app-b8742.firebaseapp.com",
  projectId: "my-nuxt-app-b8742",
  storageBucket: "my-nuxt-app-b8742.firebasestorage.app",
  messagingSenderId: "433505340364",
  appId: "1:433505340364:web:721396c426b03677ce2b69",
  measurementId: "G-75LWWWXX3H",
  databaseURL: "https://my-nuxt-app-b8742.firebaseio.com",
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();
