import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

export default defineEventHandler(async (event) => {
  const db = getFirestore();
  const messaging = getMessaging();
  try {
    const body = await readBody(event);
    const { userId, notification } = body;

    // 获取用户的FCM token
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;

    if (!fcmToken) {
      throw new Error("User does not have FCM token");
    }

    // 发送FCM通知
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      token: fcmToken,
    };

    const response = await messaging.send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("Error sending notification:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to send notification",
    });
  }
});
