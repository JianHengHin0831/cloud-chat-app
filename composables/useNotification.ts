// ~/composables/useNotification.ts
import { auth } from "~/firebase/firebase.js";
export const useNotification = () => {
  const sendNotification = async (payload: {
    userId: string;
    isSaveNotification?: boolean;
    notification: {
      title: string;
      body: string;
      chatroomId: string;
    };
  }) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      // Validate payload structure
      if (
        !payload.userId ||
        !payload.notification?.title ||
        !payload.notification?.body ||
        !payload.notification?.chatroomId
      ) {
        throw new Error("Missing required notification fields");
      }

      const idToken = await user.getIdToken();
      const data = {
        userId: payload.userId,
        isSaveNotification: payload.isSaveNotification ?? true,
        notification: {
          title: payload.notification.title,
          body: payload.notification.body,
          chatroomId: payload.notification.chatroomId,
        },
      };
      const response = await $fetch("/api/sendNotification", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return response;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  };

  return { sendNotification };
};
