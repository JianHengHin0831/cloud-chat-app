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

  const requesterRef = adminDb.ref(`chatroom_users/${groupId}/${authUser.uid}`);
  const requesterSnap = await requesterRef.get();
  const requesterRole = requesterSnap.exists()
    ? requesterSnap.val().role
    : null;

  if (!["admin", "moderator"].includes(requesterRole)) {
    throw createError({ statusCode: 403, message: "Insufficient permissions" });
  }
  // const pendingRef = dbRef(db, `chatrooms/${newValue}/pending/${userId}`);
  await adminDb.ref(`chatrooms/${groupId}/pending/${userId}`).remove();
  return { success: true };
});
