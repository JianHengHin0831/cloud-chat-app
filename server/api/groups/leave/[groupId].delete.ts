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
  const authUser = await verifyAuth(event);

  // Verify that it is my operation
  const memberRef = adminDb.ref(`chatroom_users/${groupId}/${authUser.uid}`);
  const memberSnap = await memberRef.get();

  const groupUserRef = adminDb.ref(`user_chatrooms/${authUser.uid}/${groupId}`);
  const groupUserSnap = await groupUserRef.get();

  if (!memberSnap.exists()) {
    throw createError({
      statusCode: 404,
      message: "Membership record not found",
    });
  }

  // The group owner cannot withdraw directly (replace or disband first)
  if (memberSnap.val().role === "admin") {
    throw createError({
      statusCode: 400,
      message: "Group admin must transfer ownership before leaving",
    });
  }
  await memberRef.remove();
  await groupUserRef.remove();
  return { success: true };
});
