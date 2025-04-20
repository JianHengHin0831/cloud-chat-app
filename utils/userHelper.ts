import { db } from "~/firebase/firebase";
import { ref as dbRef, get } from "firebase/database";

// get username by user id
export const getUsername = async (userId: string): Promise<string> => {
  try {
    if (!userId) return "Unknown User";

    const userRef = dbRef(db, `users/${userId}/username`);
    const snapshot = await get(userRef);

    return snapshot.exists() ? snapshot.val() : "Unknown User";
  } catch (error) {
    console.error("Error fetching username:", error);
    return "Unknown User";
  }
};

// get multiple usernames by user ids
export const getUsernames = async (
  userIds: string[]
): Promise<Record<string, string>> => {
  const results: Record<string, string> = {};

  await Promise.all(
    userIds.map(async (userId) => {
      results[userId] = await getUsername(userId);
    })
  );

  return results;
};
