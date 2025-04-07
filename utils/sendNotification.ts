import { auth, db } from "~/firebase/firebase";
import { ref as dbRef, get } from "firebase/database";

/**
 * 发送通知（支持群组或特定用户）
 * @param params
 *   - userIds: 发送给特定用户（数组）
 *   - groupId: 发送给整个群组
 *   - title: 通知标题
 *   - body: 通知内容
 *   - chatroomId: 关联的聊天室ID
 *   - isSaveNotification: 是否保存到数据库（默认true）
 *   - excludeMuted: 是否排除设置了静音的用户（默认true）
 */
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

    // 验证必要参数
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

    // 如果是群组通知，先获取所有成员ID
    let targetUserIds = params.userIds || [];
    if (params.groupId) {
      const groupMembers = await getGroupMembers(
        params.groupId,
        params.excludeMuted ?? true
      );
      targetUserIds = Array.from(new Set([...targetUserIds, ...groupMembers])); // 合并并去重
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

/**
 * 获取群组成员ID列表
 */
const getGroupMembers = async (
  groupId: string,
  excludeMuted: boolean
): Promise<string[]> => {
  const groupRef = dbRef(db, `chatroom_users/${groupId}`);
  const snapshot = await get(groupRef);

  if (!snapshot.exists()) return [];

  const members: string[] = [];
  const userCheckPromises: Promise<void>[] = [];

  snapshot.forEach((childSnapshot) => {
    const userId = childSnapshot.key;
    const userData = childSnapshot.val();

    // 如果排除静音用户且用户设置了静音，则跳过
    if (excludeMuted && userData.isMuted) return;

    const userCheck = async () => {
      try {
        const userRef = dbRef(db, `users/${userId}/isMuted`);
        const userSnapshot = await get(userRef);

        // Skip if globally muted (highest priority)
        if (userSnapshot.exists() && userSnapshot.val() === true) return;

        members.push(userId);
      } catch (error) {
        console.error(`Error checking mute status for user ${userId}:`, error);
        // Default to including user if check fails
        members.push(userId);
      }
    };
    userCheckPromises.push(userCheck());

    if (userId) members.push(userId);
  });
  await Promise.all(userCheckPromises);
  return members;
};
