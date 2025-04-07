import { db } from "~/firebase/firebase";
import { ref as dbRef, get } from "firebase/database";

/**
 * Fetch username from user ID
 * @param userId - User ID to look up
 * @returns Promise<string> - Username or "Unknown User" if not found
 */
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

/**
 * Bulk fetch usernames for multiple user IDs
 * @param userIds - Array of user IDs
 * @returns Promise<Record<string, string>> - Dictionary of {userId: username}
 */
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
