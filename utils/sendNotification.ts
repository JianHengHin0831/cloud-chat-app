import { auth, db } from "~/firebase/firebase";
import { ref as dbRef, get } from "firebase/database";

// send notification to users or group
export const sendNotification = async (params: {
  userIds?: string[];
  groupId?: string;
  title: string;
  body: string;
  chatroomId: string;
  isSaveNotification?: boolean;
  excludeMuted?: boolean;
}) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    if (
      (!params.userIds && !params.groupId) ||
      !params.title ||
      !params.body ||
      !params.chatroomId
    ) {
      throw new Error(
        "Missing required fields: must specify userIds or groupId, and include title/body/chatroomId"
      );
    }

    let targetUserIds = params.userIds || [];

    if (params.groupId) {
      const groupMembers = await getGroupMembers(
        params.groupId,
        params.excludeMuted ?? true,
        user.uid
      );
      targetUserIds = Array.from(new Set([...targetUserIds, ...groupMembers]));
    }

    if (targetUserIds.length === 0) {
      return;
    }

    const idToken = await user.getIdToken();
    const response = await $fetch("/api/sendNotification", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userIds: targetUserIds,
        isSaveNotification: params.isSaveNotification ?? true,
        notification: {
          title: params.title,
          body: params.body,
          chatroomId: params.chatroomId,
        },
      }),
    });

    return response;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

// get group member ids
const getGroupMembers = async (
  groupId: string,
  excludeMuted: boolean,
  currentUserId: string
): Promise<string[]> => {
  const groupRef = dbRef(db, `chatroom_users/${groupId}`);
  const snapshot = await get(groupRef);

  if (!snapshot.exists()) return [];

  const members: string[] = [];
  const userCheckPromises: Promise<void>[] = [];

  snapshot.forEach((childSnapshot) => {
    const userId = childSnapshot.key;
    const userData = childSnapshot.val();

    if (currentUserId === userId) return;

    if (excludeMuted && userData.isMuted) return;

    const userCheck = async () => {
      try {
        const userRef = dbRef(db, `users/${userId}/isMuted`);
        const userSnapshot = await get(userRef);

        if (userSnapshot.exists() && userSnapshot.val() === true) return;

        members.push(userId);
      } catch (error) {
        console.error(`Error checking mute status for user ${userId}:`, error);
        members.push(userId);
      }
    };
    userCheckPromises.push(userCheck());

    if (userId) members.push(userId);
  });
  await Promise.all(userCheckPromises);
  return members;
};
