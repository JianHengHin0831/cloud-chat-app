import {
  adminDb,
  adminMessaging,
  adminAuth,
} from "~/server/utils/firebase-admin";

interface NotificationPayload {
  title: string;
  body: string;
  chatroomId: string;
}

interface SendNotificationResponse {
  success: boolean;
  message?: string;
  code?: string;
  results?: {
    [userId: string]: {
      success: boolean;
      notificationId?: string | null;
      fcmResponse?: any;
    };
  };
}

export default defineEventHandler(async (event) => {
  // 验证权限
  const authHeader = getHeader(event, "Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { success: false, message: "Unauthorized", code: "UNAUTHORIZED" };
  }
  const idToken = authHeader.split("Bearer ")[1];

  // 验证用户
  let senderId: string;
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    senderId = decodedToken.uid;
  } catch (error) {
    return { success: false, message: "Invalid token", code: "INVALID_TOKEN" };
  }

  // 读取请求体
  const body = await readBody(event);
  const { userIds, notification, isSaveNotification = true } = body;

  // 验证必要字段
  if (!userIds || !Array.isArray(userIds)) {
    return {
      success: false,
      message: "Invalid userIds",
      code: "INVALID_USER_IDS",
    };
  }

  if (
    !notification?.title ||
    !notification?.body ||
    !notification?.chatroomId
  ) {
    return {
      success: false,
      message: "Missing notification fields",
      code: "MISSING_FIELDS",
    };
  }

  // 批量发送通知
  const results: SendNotificationResponse["results"] = {};
  for (const userId of userIds) {
    try {
      // 获取用户FCM tokens
      const userSnapshot = await adminDb.ref(`users/${userId}`).once("value");
      if (!userSnapshot.exists()) {
        results[userId] = { success: false };
        continue;
      }

      const userData = userSnapshot.val();
      const activeTokens = Object.entries(userData.fcmTokens || {})
        .filter(([_, isActive]) => isActive)
        .map(([token]) => token);

      if (activeTokens.length === 0) {
        results[userId] = { success: false };
        continue;
      }

      // 保存通知到数据库
      let notificationId: string | null = null;
      if (isSaveNotification) {
        const notificationRef = adminDb
          .ref(`users/${userId}/notifications`)
          .push();
        await notificationRef.set({
          ...notification,
          timestamp: { ".sv": "timestamp" },
          senderId,
          readAt: null,
        });
        notificationId = notificationRef.key;
      }

      // 发送FCM通知
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          chatroomId: notification.chatroomId,
          notificationId: notificationId || "unsaved",
          type: "chat",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        tokens: activeTokens,
        apns: { payload: { aps: { sound: "default", badge: 1 } } },
        android: {
          priority: "high" as const,
          notification: {
            sound: "default",
            channelId: "chat_notifications",
            icon: "https://firebasestorage.googleapis.com/v0/b/my-nuxt-app-b8742.firebasestorage.app/o/icons%2FChatGPT_Image_Apr_5__2025__03_03_15_PM-removebg-preview.png?alt=media&token=f9a9ea82-e44e-4522-9c53-99dccf9a60ee",
            image:
              "https://firebasestorage.googleapis.com/v0/b/my-nuxt-app-b8742.firebasestorage.app/o/icons%2Fhome-og.png?alt=media&token=13f763fd-1c96-49b7-bc13-b5d97b708c48",
          },
        },
        webpush: {
          notification: {
            icon: "https://firebasestorage.googleapis.com/v0/b/my-nuxt-app-b8742.firebasestorage.app/o/icons%2FChatGPT_Image_Apr_5__2025__03_03_15_PM-removebg-preview.png?alt=media&token=f9a9ea82-e44e-4522-9c53-99dccf9a60ee03_03_15_PM-removebg-preview.png",
            image:
              "https://firebasestorage.googleapis.com/v0/b/my-nuxt-app-b8742.firebasestorage.app/o/icons%2Fhome-og.png?alt=media&token=13f763fd-1c96-49b7-bc13-b5d97b708c48",
          },
        },
      };

      const fcmResponse = await adminMessaging.sendEachForMulticast(message);
      results[userId] = {
        success: true,
        notificationId,
        fcmResponse: {
          successCount: fcmResponse.successCount,
          failureCount: fcmResponse.failureCount,
        },
      };
    } catch (error) {
      console.error(`Error sending to user ${userId}:`, error);
      results[userId] = { success: false };
    }
  }

  return { success: true, results };
});
