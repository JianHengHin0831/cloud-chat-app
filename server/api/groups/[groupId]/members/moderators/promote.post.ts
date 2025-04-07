import { adminDb } from "~/server/utils/firebase-admin";
import { getRole, verifyAuth } from "~/server/utils/auth";

interface RouteParams {
  groupId: string;
}

export default defineEventHandler(async (event) => {
  // 1. 安全获取路由参数
  const params = event.context.params;
  if (!params?.groupId) {
    throw createError({
      statusCode: 400,
      message: "Missing group ID parameter",
    });
  }
  const { groupId } = params;

  // 2. 验证请求体和权限
  const { memberId } = await readBody(event);
  const authUser = await verifyAuth(event);

  // 3. 权限验证（使用Admin SDK）
  const requesterRole = await getRole(groupId, authUser.uid);
  if (requesterRole !== "admin") {
    throw createError({
      statusCode: 403,
      message: "Admin privileges required",
    });
  }

  // 4. 执行管理员提升操作
  const userRolePath = `chatroom_users/${groupId}/${memberId}/role`;
  await adminDb.ref(userRolePath).set("moderator", (error) => {
    if (error) {
      throw createError({
        statusCode: 500,
        message: "Failed to update user role",
      });
    }
  });

  return {
    success: true,
    data: {
      groupId,
      promotedUser: memberId,
      newRole: "moderator",
    },
  };
});
