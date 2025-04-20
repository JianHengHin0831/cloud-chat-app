import { defineEventHandler, readMultipartFormData, getHeader } from "h3";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { ref as dbRef, set, push } from "firebase/database";
import { db, storage } from "~/firebase/firebase";
import { adminAuth } from "~/server/utils/firebase-admin";
import { adminDb } from "~/server/utils/firebase-admin";

export default defineEventHandler(async (event) => {
  const res = event.node.res;

  const authHeader = getHeader(event, "Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: No ID Token provided");
  }
  const idToken = authHeader.split("Bearer ")[1];

  let userId;
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    userId = decodedToken.uid;
  } catch (error) {
    console.error("Error verifying ID Token:", error);
    throw new Error("Unauthorized: Invalid ID Token");
  }

  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw new Error("No form data found");
  }

  let name, description, chatType, photoFile;
  for (const part of formData) {
    if (part.name === "name") {
      name = part.data.toString("utf-8");
    } else if (part.name === "description") {
      description = part.data.toString("utf-8");
    } else if (part.name === "chatType") {
      chatType = part.data.toString("utf-8");
    } else if (part.name === "photoFile") {
      photoFile = part;
    }
  }

  if (!name || !chatType) {
    throw new Error("Missing required fields");
  }

  try {
    let photoUrl = null;

    if (photoFile) {
      try {
        const fileRef = storageRef(
          storage,
          `group-photos/${Date.now()}-${photoFile.filename}`
        );
        await uploadBytes(fileRef, photoFile.data);
        photoUrl = await getDownloadURL(fileRef);
      } catch (storageError: any) {
        console.error("Storage error:", storageError);
        if (storageError.code === "storage/unauthorized") {
          throw createError({
            statusCode: 403,
            message: "Storage permission denied: Unable to upload group photo",
          });
        }
        throw createError({
          statusCode: 500,
          message: `Storage error: ${storageError.message}`,
        });
      }
    }

    const chatroomsRef = adminDb.ref("chatrooms");
    const newChatroomRef = chatroomsRef.push();
    const chatroomId = newChatroomRef.key;

    const data = {
      name,
      description: description || null,
      chatType,
      photoUrl,
      createdAt: Date.now(),
      isDisband: false,
    };
    await newChatroomRef.set({
      name,
      description: description || null,
      chatType,
      photoUrl,
      createdAt: Date.now(),
      isMuted: false,
      isDisband: false,
    });
    const joinedAt = Date.now();
    const memberRef = adminDb.ref(`chatroom_users/${chatroomId}/${userId}`);
    await memberRef.set({
      role: "admin",
      joinedAt,
      isPinned: false,
      isMuted: false,
    });

    const userChatroomRef = adminDb.ref(
      `user_chatrooms/${userId}/${chatroomId}`
    );
    await userChatroomRef.set(true);

    return { groupId: chatroomId, joinedAt };
  } catch (error) {
    console.error("Error creating group:", error);
    throw new Error("Failed to create group");
  }
});
