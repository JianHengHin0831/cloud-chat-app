// middleware/auth.ts
import { defineEventHandler, createError, H3Event } from "h3";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "~/server/utils/firebase-admin";

export default defineEventHandler(async (event: H3Event) => {
  //try {
  return;
  //   if (
  //     event.path === "/" ||
  //     event.path === "/search" ||
  //     event.path === "/login" ||
  //     event.path === "/register"
  //   ) {
  //     return;
  //   }
  //   // Get the authorization header
  //   const authHeader = event.node.req.headers.authorization;
  //   if (!authHeader || !authHeader.startsWith("Bearer ")) {
  //     throw createError({
  //       statusCode: 401,
  //       message: "No token provided",
  //     });
  //   }

  //   // Extract and verify the token
  //   const token = authHeader.split("Bearer ")[1];
  //   const decodedToken = await getAuth().verifyIdToken(token);
  //   const { uid } = decodedToken;

  //   // Get device ID from headers
  //   const deviceId = event.node.req.headers["x-device-id"] as string;
  //   if (!deviceId) {
  //     throw createError({
  //       statusCode: 400,
  //       message: "Device ID not provided",
  //     });
  //   }

  //   // Verify device registration in Realtime Database
  //   const deviceRef = adminDb.ref(`devices/${uid}/registered/${deviceId}`);
  //   const snapshot = await deviceRef.once("value");

  //   if (!snapshot.exists()) {
  //     throw createError({
  //       statusCode: 403,
  //       message: "Device not registered",
  //     });
  //   }

  //   // Add user and device info to event context
  //   event.context.auth = {
  //     ...decodedToken,
  //     deviceId, // deviceId is now properly included without overwriting uid
  //   };

  //   return;
  // } catch (error: any) {
  //   throw createError({
  //     statusCode: error.statusCode || 500,
  //     message: error.message || "Authentication failed",
  //   });
  // }
});
