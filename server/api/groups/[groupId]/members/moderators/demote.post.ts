import { getRole, verifyAuth } from "~/server/utils/auth";
import { adminDb } from "~/server/utils/firebase-admin";

export default defineEventHandler(async (event) => {
  const params = event.context.params;
  if (!params?.groupId) {
    throw createError({
      statusCode: 400,
      message: "Missing user ID parameter",
    });
  }
  const { groupId } = params;
  const { memberId } = await readBody(event);
  const authUser = await verifyAuth(event);

  if ((await getRole(groupId, authUser.uid)) !== "admin") {
    throw createError({
      statusCode: 403,
      message: "Admin privileges required",
    });
  }

  await adminDb.ref(`chatroom_users/${groupId}/${memberId}`).update({
    role: "user",
    demotedAt: { ".sv": "timestamp" },
  });

  return { success: true };
});
