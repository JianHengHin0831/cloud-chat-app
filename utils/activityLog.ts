import { db, auth } from "~/firebase/firebase";
import { ref as dbRef, push, get } from "firebase/database";

// activity log entry interface
interface ActivityLog {
  userId: string;
  details: string;
  timestamp: number;
  id: string;
}

// write activity log entry
export const writeActivityLog = async (
  chatroomId: string,
  userId: string,
  details: string,
  timestamp: number = Date.now()
): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }

    const activityLogRef = dbRef(db, `chatrooms/${chatroomId}/activity_logs`);
    await push(activityLogRef, {
      userId,
      details,
      timestamp,
    });
  } catch (error) {
    console.error("Error writing activity log:", error);
    throw error;
  }
};

// read activity logs for chatroom
export const readActivityLogs = async (
  chatroomId: string
): Promise<ActivityLog[]> => {
  try {
    const activityLogRef = dbRef(db, `chatrooms/${chatroomId}/activity_logs`);
    const snapshot = await get(activityLogRef);

    if (!snapshot.exists()) {
      return [];
    }

    const logs: ActivityLog[] = [];
    snapshot.forEach((childSnapshot) => {
      logs.push({
        id: childSnapshot.key as string,
        ...childSnapshot.val(),
      });
    });

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error reading activity logs:", error);
    throw error;
  }
};
