import { verifyAuth } from "~/server/utils/auth";
import { adminDb } from "~/server/utils/firebase-admin";

export default defineEventHandler(async (event) => {
  const params = event.context.params;
  if (!params?.userId) {
    throw createError({
      statusCode: 400,
      message: "Missing user ID parameter",
    });
  }
  const { userId } = params;
  const profileData = await readBody(event);
  const authUser = await verifyAuth(event);

  // 只能修改自己的资料
  if (authUser.uid !== userId) {
    throw createError({
      statusCode: 403,
      message: "Can only update own profile",
    });
  }

  // 构造更新数据
  const updates = {
    username: profileData.username,
    advancedSettings: {
      bio: profileData.advancedSettings.bio,
      status: profileData.advancedSettings.status,
      isOnline: profileData.advancedSettings.isOnline,
      isLight: profileData.advancedSettings.isLight,
      showExactTime: profileData.advancedSettings.showExactTime,
      fontSize: profileData.advancedSettings.fontSize,
      activityVisibility: profileData.advancedSettings.activityVisibility,
      showEmail: profileData.advancedSettings.showEmail,
      lastUpdated: { ".sv": "timestamp" },
    },
  };

  await adminDb.ref(`users/${userId}/username`).set(updates.username);
  await adminDb
    .ref(`users/${userId}/advancedSettings`)
    .set(updates.advancedSettings);
  return { success: true };
});
