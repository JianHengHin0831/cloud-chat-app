import { getRole, verifyAuth } from "~/server/utils/auth";
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
  const { memberId } = await readBody(event);
  const authUser = await verifyAuth(event);

  const [requesterRole, targetRole] = await Promise.all([
    getRole(groupId, authUser.uid),
    getRole(groupId, memberId),
  ]);

  const canRemove =
    requesterRole === "admin" ||
    (requesterRole === "moderator" && targetRole === "user");

  if (!canRemove) {
    throw createError({ statusCode: 403, message: "Insufficient permissions" });
  }

  await adminDb.ref(`chatroom_users/${groupId}/${memberId}`).remove();
  await adminDb.ref(`user_chatrooms/${memberId}/${groupId}`).remove();
  return { success: true };
});
