import { verifyAuth } from "~/server/utils/auth";
import { adminDb } from "~/server/utils/firebase-admin";
import { getRouterParam } from "h3";

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, "userId");
  const user = event.context.user;

  if (userId !== user.uid) {
    throw createError({
      statusCode: 403,
      message: "You can only update your own profile",
    });
  }

  const body = await readBody(event);
  const { displayName, photoURL, bio } = body;

  const updateData = {
    displayName,
    photoURL,
    bio,
    updatedAt: Date.now(),
  };

  try {
    await adminAuth.updateUser(user.uid, updateData);
    return { success: true };
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Failed to update profile",
    });
  }
});
