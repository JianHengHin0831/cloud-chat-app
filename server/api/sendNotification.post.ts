// ~/server/api/sendNotification.post.ts
import {
  adminDb,
  adminMessaging,
  adminAuth,
} from "~/server/utils/firebase-admin";
import { ref as dbRef, get, push, update, set } from "firebase/database";
import * as admin from "firebase-admin";

interface NotificationPayload {
  title: string;
  body: string;
  chatroomId: string;
}

interface SendNotificationResponse {
  success: boolean;
  message?: string;
  code?: string;
  notificationId?: string | null;
  fcmResponse?: {
    successCount: number;
    failureCount: number;
    responses: admin.messaging.SendResponse[];
  };
  details?: {
    required?: string[];
    received?: string[];
  };
}

export default defineEventHandler(async (event) => {
  // 验证权限
  const authHeader = getHeader(event, "Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      message: "Unauthorized: No ID Token provided",
      code: "UNAUTHORIZED",
    };
  }
  const idToken = authHeader.split("Bearer ")[1];

  // 验证 ID Token 并获取用户信息
  let tokenUserId;
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    tokenUserId = decodedToken.uid;
  } catch (error) {
    console.error("Error verifying ID Token:", error);
    return {
      success: false,
      message: "Unauthorized: Invalid ID Token",
      code: "INVALID_TOKEN",
    };
  }

  // 验证请求体
  const body = await readBody(event);

  // Add more detailed validation
  if (typeof body.userId !== "string") {
    return {
      success: false,
      message: "Invalid userId format",
      code: "INVALID_USER_ID",
    };
  }

  if (!body.notification || typeof body.notification !== "object") {
    return {
      success: false,
      message: "Notification payload must be an object",
      code: "INVALID_NOTIFICATION",
    };
  }

  const { userId, notification } = body;
  const isSaveNotification = body.isSaveNotification !== false; // 默认为true

  // 输入验证
  if (
    !userId ||
    !notification?.title ||
    !notification?.body ||
    !notification?.chatroomId
  ) {
    return {
      success: false,
      message: "Missing required fields",
      code: "MISSING_FIELDS",
      details: {
        required: [
          "userId",
          "notification.title",
          "notification.body",
          "notification.chatroomId",
        ],
        received: Object.keys(body),
      },
    };
  }

  try {
    // 获取用户数据
    const userRef = adminDb.ref(`users/${userId}`);
    const userSnapshot = await adminDb.ref(`users/${userId}`).once("value");

    if (!userSnapshot.exists()) {
      return {
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      };
    }

    const userData = userSnapshot.val();
    const fcmTokens = userData.fcmTokens || {};
    const tokenList = Object.keys(fcmTokens).filter(
      (k) => fcmTokens[k] === true
    );

    if (tokenList.length === 0) {
      return {
        success: false,
        message: "User has no registered FCM tokens",
        code: "NO_TOKENS",
      };
    }

    // 准备通知数据
    const notificationData = {
      userId,
      chatroomId: notification.chatroomId,
      title: notification.title,
      body: notification.body,
      timestamp: { ".sv": "timestamp" },
      readAt: null,
    };

    // 保存通知到数据库
    let notificationId: string | null = null;
    if (isSaveNotification) {
      const notificationsRef = adminDb.ref(`users/${userId}/notifications`);
      const newNotificationRef = notificationsRef.push();
      await newNotificationRef.set(notificationData);
      notificationId = newNotificationRef.key;
    }

    // 准备FCM消息
    const message: admin.messaging.MulticastMessage = {
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
      tokens: tokenList,
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "chat_notifications",
        },
      },
    };

    // 发送通知
    const fcmResponse = await adminMessaging.sendEachForMulticast(message);

    // 更新未读计数
    await adminDb.ref(`users/${userId}`).update({
      unreadNotifications: (userData.unreadNotifications || 0) + 1,
    });

    // 返回成功响应
    return {
      success: true,
      notificationId,
      fcmResponse: {
        successCount: fcmResponse.successCount,
        failureCount: fcmResponse.failureCount,
        responses: fcmResponse.responses,
      },
    };
  } catch (error) {
    console.error("Notification processing error:", error);
    return {
      success: false,
      message: "Internal server error while processing notification",
      code: "INTERNAL_ERROR",
    };
  }
});

// // ~/server/api/sendNotification.post.ts
// import { adminDb, adminMessaging, adminAuth } from "~/server/utils/firebase-admin";
// import * as admin from "firebase-admin";

// interface NotificationPayload {
//   title: string;
//   body: string;
//   chatroomId: string;
// }

// export default defineEventHandler(async (event) => {
//   try {
//     const body = await readBody(event);
//     const { userId, notification, isSaveNotification = true } = body;

//     // Input validation
//     if (
//       !userId ||
//       !notification?.title ||
//       !notification?.body ||
//       !notification?.chatroomId
//     ) {
//       throw createError({
//         statusCode: 400,
//         statusMessage: "Missing required fields",
//         data: {
//           required: [
//             "userId",
//             "notification.title",
//             "notification.body",
//             "notification.chatroomId",
//           ],
//           received: body,
//         },
//       });
//     }

//     // Get user document
//     const userRef = adminDb.collection("users").doc(userId);
//     const userDoc = await userRef.get();

//     if (!userDoc.exists) {
//       throw createError({
//         statusCode: 404,
//         statusMessage: "User not found",
//       });
//     }

//     const fcmTokens = userDoc.data()?.fcmTokens || [];
//     if (fcmTokens.length === 0) {
//       return {
//         success: false,
//         message: "User has no registered FCM tokens",
//         code: "NO_TOKENS",
//       };
//     }

//     // Prepare notification data
//     const notificationData = {
//       userId,
//       chatroomId: notification.chatroomId,
//       title: notification.title,
//       body: notification.body,
//       timestamp: Timestamp.now(),
//       readAt: null,
//     };

//     let notificationRef;
//     if (isSaveNotification) {
//       notificationRef = await adminDb
//         .collection("users")
//         .doc(userId)
//         .collection("notifications") // 存储到 users/{userId}/notifications
//         .add(notificationData);
//     }

//     // Prepare FCM message with proper typing
//     const message: admin.messaging.MulticastMessage = {
//       notification: {
//         title: notification.title,
//         body: notification.body,
//       },
//       data: {
//         chatroomId: notification.chatroomId,
//         notificationId: notificationRef?.id || "unsaved",
//         type: "chat",
//         click_action: "FLUTTER_NOTIFICATION_CLICK",
//       },
//       tokens: fcmTokens,
//       apns: {
//         payload: {
//           aps: {
//             sound: "default",
//             badge: 1,
//           },
//         },
//       },
//       android: {
//         priority: "high" as const,
//         notification: {
//           sound: "default",
//           channelId: "chat_notifications",
//         },
//       },
//     };

//     // Send notification
//     const response = await adminMessaging.sendEachForMulticast(message);

//     // Update unread count
//     await userRef.update({
//       unreadNotifications: FieldValue.increment(1),
//     });

//     return {
//       success: true,
//       notificationId: notificationRef?.id,
//       fcmResponse: {
//         successCount: response.successCount,
//         failureCount: response.failureCount,
//         responses: response.responses,
//       },
//     };
//   } catch (error: any) {
//     console.error("Notification error:", error);
//     throw createError({
//       statusCode: 500,
//       statusMessage: "Failed to send notification",
//       data: error,
//     });
//   }
// });
