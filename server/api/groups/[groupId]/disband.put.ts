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

  // 验证管理员权限
  const adminRef = adminDb.ref(`chatroom_users/${groupId}/${authUser.uid}`);
  const adminSnap = await adminRef.get();

  if (adminSnap.val()?.role !== "admin") {
    throw createError({
      statusCode: 403,
      message: "Admin privileges required",
    });
  }

  await adminDb.ref(`chatrooms/${groupId}`).update({
    isDisband: true,
    disbandedAt: { ".sv": "timestamp" },
    disbandedBy: authUser.uid,
  });

  return { success: true };
});
