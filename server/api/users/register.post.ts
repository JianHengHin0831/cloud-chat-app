import { adminDb } from "~/server/utils/firebase-admin";
import { encodeEmailForRTDB } from "~/utils/encodeEmailForRTDB";
import { encodeUsernameForRTDB } from "~/utils/encodeUsernameForRTDB";

export default defineEventHandler(async (event) => {
  const { user, displayName } = await readBody(event);

  const userData = {
    username: displayName,
    email: user.email,
    createdAt: { ".sv": "timestamp" },
    emailVerified: user.emailVerified,
    avatarUrl: null,
    registerMethod: "email",
    lastLogin: { ".sv": "timestamp" },
  };

  const updates = {
    [`users/${user.uid}`]: userData,
    [`users/emailToUid/${encodeEmailForRTDB(user.email)}`]: user.uid,
    [`usernames/${encodeUsernameForRTDB(displayName)}`]: user.uid,
  };

  await adminDb.ref().update(updates);
  return { success: true };
});
