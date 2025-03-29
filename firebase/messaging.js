import {
  getMessaging,
  getToken,
  onMessage,
  deleteToken,
} from "firebase/messaging";
import { app, db } from "./firebase";
import { ref as dbRef, set, update, remove, get } from "firebase/database";

// Initialize Firebase Cloud Messaging
let messaging;
if (typeof window !== "undefined") {
  messaging = getMessaging(app);
} else {
  console.warn("Firebase Messaging can only be initialized on the client side");
}

// Helper function to manage FCM tokens in RTDB
const updateUserFcmTokens = async (userId, token, operation = "add") => {
  const userFcmRef = dbRef(db, `users/${userId}/fcmTokens`);
  const snapshot = await get(userFcmRef);
  let tokens = snapshot.exists() ? snapshot.val() || {} : {};

  if (operation === "add") {
    tokens[token] = true; // Using object instead of array for easier management
  } else if (operation === "remove") {
    delete tokens[token];
  }

  await set(userFcmRef, tokens);
};

// Request permission and get FCM token
export const requestNotificationPermission = async (userId) => {
  if (!messaging) {
    console.warn("Messaging not available");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey:
          "BD5NBkcAyMdkSiBYo35Sd14acqGBiRFByGeY2Tl2x5p4TDJFpJyDA3YnKtybifFG-7WqLIxTiwu9ZEF3CLZtYK4",
      });

      if (token && userId) {
        await updateUserFcmTokens(userId, token, "add");
      }
      return token;
    }
    throw new Error("Notification permission denied");
  } catch (error) {
    console.error("Error getting notification permission:", error);
    throw error;
  }
};

// Remove FCM token
export const removeFCMToken = async (userId) => {
  try {
    const token = await getToken(messaging);
    if (token && userId) {
      // Remove token from Realtime Database
      await updateUserFcmTokens(userId, token, "remove");
      // Delete the token
      await deleteToken(messaging);
    }
  } catch (error) {
    console.error("Error removing FCM token:", error);
    throw error;
  }
};

// Send notification to specific user
export const sendNotification = async (
  userId,
  title,
  body,
  isSaveNotification = true,
  token
) => {
  try {
    const response = await fetch("/api/sendNotification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        notification: {
          title,
          body,
        },
        isSaveNotification,
        token,
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

// Handle foreground messages
if (typeof window !== "undefined" && messaging) {
  onMessage(messaging, (payload) => {
    // Check if Notifications API is supported
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }

    // Check if permission is already granted
    if (Notification.permission === "granted") {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.icon || "/icons/icon-192x192.png",
      });
    } else if (Notification.permission !== "denied") {
      // Ask for permission if not determined yet
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: payload.notification.icon || "/icons/icon-192x192.png",
          });
        }
      });
    }
  });
}

export { messaging };

// import {
//   getMessaging,
//   getToken,
//   onMessage,
//   deleteToken,
// } from "firebase/messaging";
// import { app, db } from "./firebase";

// // Initialize Firebase Cloud Messaging
// let messaging;
// if (typeof window !== "undefined") {
//   messaging = getMessaging(app);
// } else {
//   console.warn("Firebase Messaging can only be initialized on the client side");
// }

// // Request permission and get FCM token
// export const requestNotificationPermission = async (userId) => {
//   if (!messaging) {
//     console.warn("Messaging not available");
//     return null;
//   }

//   try {
//     const permission = await Notification.requestPermission();
//     if (permission === "granted") {
//       const token = await getToken(messaging, {
//         vapidKey:
//           "BD5NBkcAyMdkSiBYo35Sd14acqGBiRFByGeY2Tl2x5p4TDJFpJyDA3YnKtybifFG-7WqLIxTiwu9ZEF3CLZtYK4",
//       });

//       if (token && userId) {
//         const userRef = doc(db, "users", userId);
//         await updateDoc(userRef, {
//           fcmTokens: arrayUnion(token),
//         });
//       }
//       return token;
//     }
//     throw new Error("Notification permission denied");
//   } catch (error) {
//     console.error("Error getting notification permission:", error);
//     throw error;
//   }
// };

// // Remove FCM token
// export const removeFCMToken = async (userId) => {
//   try {
//     const token = await getToken(messaging);
//     if (token && userId) {
//       const userRef = doc(db, "users", userId);
//       await updateDoc(userRef, {
//         fcmTokens: arrayRemove(token),
//       });
//       // Delete the token
//       await deleteToken(messaging);
//     }
//   } catch (error) {
//     console.error("Error removing FCM token:", error);
//     throw error;
//   }
// };

// // Send notification to specific user
// export const sendNotification = async (
//   userId,
//   title,
//   body,
//   isSaveNotification = true,
//   token
// ) => {
//   try {
//     const response = await fetch("/api/sendNotification", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         userId,
//         notification: {
//           title,
//           body,
//         },
//         isSaveNotification,
//         token,
//       }),
//     });
//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.error("Error sending notification:", error);
//     throw error;
//   }
// };

// // Handle foreground messages
// if (typeof window !== "undefined" && messaging) {
//   onMessage(messaging, (payload) => {
//     new Notification(payload.notification.title, {
//       body: payload.notification.body,
//     });
//   });
// }

// export { messaging };
