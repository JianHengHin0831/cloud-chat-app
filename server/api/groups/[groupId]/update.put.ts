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
  const { name, description, chatType } = await readBody(event);
  const authUser = await verifyAuth(event);

  // 验证管理员权限
  const role = await getRole(groupId, authUser.uid);
  if (role !== "admin") {
    throw createError({
      statusCode: 403,
      message: "Admin privileges required",
    });
  }

  await adminDb.ref(`chatrooms/${groupId}`).update({
    name,
    description,
    chatType,
    updatedAt: { ".sv": "timestamp" },
  });

  return { success: true };
});
