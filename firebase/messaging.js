import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "./firebase";

// Initialize Firebase Cloud Messaging
const messaging = getMessaging(app);

// Request permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: "YOUR_VAPID_KEY", // Replace with your VAPID key from Firebase Console
      });
      return token;
    }
    throw new Error("Notification permission denied");
  } catch (error) {
    console.error("Error getting notification permission:", error);
    throw error;
  }
};

// Send notification to specific user
export const sendNotification = async (userId, title, body) => {
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
onMessage(messaging, (payload) => {
  console.log("Received foreground message:", payload);
  // You can handle the message here, e.g., show a notification
  new Notification(payload.notification.title, {
    body: payload.notification.body,
  });
});
