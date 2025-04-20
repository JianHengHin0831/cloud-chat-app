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

  const { newOwnerId } = await readBody(event);

  const adminRef = adminDb.ref(`chatroom_users/${groupId}/${authUser.uid}`);
  const adminSnap = await adminRef.get();

  if (adminSnap.val()?.role !== "admin") {
    throw createError({
      statusCode: 403,
      message: "Admin privileges required",
    });
  }

  const newOwnerRef = adminDb.ref(`chatroom_users/${groupId}/${newOwnerId}`);
  const newOwnerSnap = await newOwnerRef.get();

  if (!newOwnerSnap.exists()) {
    throw createError({
      statusCode: 404,
      message: "New owner not found",
    });
  }

  const currentUserRolePath = `chatroom_users/${groupId}/${authUser.uid}/role`;
  await adminDb.ref(currentUserRolePath).set("moderator", (error) => {
    if (error) {
      throw createError({
        statusCode: 500,
        message: "Failed to update user role",
      });
    }
  });

  const newOwnerRolePath = `chatroom_users/${groupId}/${newOwnerId}/role`;
  await adminDb.ref(newOwnerRolePath).set("admin", (error) => {
    if (error) {
      throw createError({
        statusCode: 500,
        message: "Failed to update user role",
      });
    }
  });

  return { success: true };
});
