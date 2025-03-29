import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { ref as dbRef, set, get } from "firebase/database";
import { db } from "~/firebase/firebase";

export const useFcmToken = () => {
  // Check if notifications are supported
  const isSupported = () => {
    return "Notification" in window && "serviceWorker" in navigator;
  };

  // Get current permission status
  const getPermissionStatus = () => {
    return Notification.permission;
  };

  // Request permission (must be called from user gesture)
  const requestPermission = async (userId: string) => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        return await updateToken(userId);
      }
      return null;
    } catch (error) {
      console.error("Permission request failed:", error);
      return null;
    }
  };

  // Update token in database (no permission request)
  const updateToken = async (userId: string) => {
    try {
      if (!isSupported()) return null;
      if (getPermissionStatus() !== "granted") return null;

      const messaging = getMessaging();
      const currentToken = await getToken(messaging, {
        vapidKey:
          "BD5NBkcAyMdkSiBYo35Sd14acqGBiRFByGeY2Tl2x5p4TDJFpJyDA3YnKtybifFG-7WqLIxTiwu9ZEF3CLZtYK4",
      });

      if (currentToken) {
        const userFcmRef = dbRef(db, `users/${userId}/fcmTokens`);
        const snapshot = await get(userFcmRef);
        const tokens = snapshot.exists() ? snapshot.val() || {} : {};
        tokens[currentToken] = true;
        await set(userFcmRef, tokens);
      }
      return currentToken;
    } catch (error) {
      console.error("Token update failed:", error);
      return null;
    }
  };

  // Handle incoming messages
  const setupMessageHandler = (callback: (payload: any) => void) => {
    if (!isSupported()) return;

    const messaging = getMessaging();
    onMessage(messaging, callback);
  };

  return {
    isSupported,
    getPermissionStatus,
    requestPermission,
    updateToken,
    setupMessageHandler,
  };
};
