import { H3Event, getRequestHeader } from "h3";
import { adminAuth } from "./firebase-admin";
import { getAuth } from "firebase-admin/auth";

export const verifyToken = async (event: H3Event) => {
  try {
    // Get the authorization header
    const authHeader = getRequestHeader(event, "authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    // Extract the token
    const token = authHeader.split("Bearer ")[1];
    if (!token) {
      return null;
    }

    // Verify the token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
};

export async function verifyAuth(event: any) {
  const token = getHeader(event, "Authorization")?.split("Bearer ")[1];
  if (!token)
    throw createError({ statusCode: 401, message: "Missing auth token" });

  try {
    const decoded = await getAuth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: decoded.email_verified,
    };
  } catch (error) {
    throw createError({
      statusCode: 401,
      message: "Invalid token",
      data: { error: error },
    });
  }
}

export async function getRole(groupId: string, userId: string) {
  const ref = adminDb.ref(`chatroom_users/${groupId}/${userId}/role`);
  const snapshot = await ref.get();
  return snapshot.exists() ? snapshot.val() : null;
}
