import { verifyAuth } from "~/server/utils/auth";
import { adminDb } from "~/server/utils/firebase-admin";
import { getRouterParam } from "h3";

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, "userId");
  const { username, advancedSettings } = await readBody(event);

  const authUser = await verifyAuth(event);

  if (authUser.uid !== userId) {
    throw createError({
      statusCode: 403,
      message: "You can only update your own profile",
    });
  }
  try {
    console.log(username);
    await adminDb.ref(`users/${userId}`).update({ username: username });
    await adminDb
      .ref(`users/${userId}/advancedSettings`)
      .update(advancedSettings);

    return { success: true };
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Failed to update profile",
    });
  }
});
