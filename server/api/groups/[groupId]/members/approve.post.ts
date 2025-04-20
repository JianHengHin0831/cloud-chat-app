import { verifyAuth } from "~/server/utils/auth";
import { adminDb } from "~/server/utils/firebase-admin";

export default defineEventHandler(async (event) => {
  const params = event.context.params;
  if (!params?.groupId) {
    throw createError({
      statusCode: 400,
      message: "Missing group ID parameter",
    });
  }
  const { groupId } = params;
  const { userId } = await readBody(event);
  const authUser = await verifyAuth(event);

  const approverRef = adminDb.ref(`chatroom_users/${groupId}/${authUser.uid}`);
  const approverSnap = await approverRef.get();
  const approverRole = approverSnap.exists() ? approverSnap.val().role : null;

  if (!["admin", "moderator"].includes(approverRole)) {
    throw createError({ statusCode: 403, message: "Insufficient permissions" });
  }

  const userRef = adminDb.ref(`chatroom_users/${groupId}/${userId}`);
  await userRef.set({ role: "user" });

  const user1Ref = adminDb.ref(`user_chatrooms/${userId}/${groupId}`);
  await user1Ref.set(true);

  await adminDb.ref(`chatrooms/${groupId}/pending/${userId}`).remove();
  return { success: true };
});
