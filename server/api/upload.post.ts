import { defineEventHandler, readMultipartFormData, getHeader } from "h3";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { db, storage } from "~/firebase/firebase";
import { adminAuth } from "~/server/utils/firebase-admin";
import { createCipheriv, randomBytes } from "crypto";
import { get, ref as dbRef } from "firebase/database";
import CryptoJS from "crypto-js";

export default defineEventHandler(async (event) => {
  // 1. Authentication
  const authHeader = getHeader(event, "Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: No ID Token provided");
  }

  const idToken = authHeader.split("Bearer ")[1];
  let userId: string;
  try {
    userId = (await adminAuth.verifyIdToken(idToken)).uid;
  } catch (error) {
    throw new Error("Unauthorized: Invalid ID Token");
  }

  // 2. Form Data
  const formData = await readMultipartFormData(event);
  if (!formData) throw new Error("No form data found");

  const { chatroomId, files } = formData.reduce(
    (acc, part) => {
      if (part.name === "chatroomId")
        acc.chatroomId = part.data.toString("utf-8");
      if (part.name === "file") acc.files.push(part);
      return acc;
    },
    { chatroomId: "", files: [] as any[] }
  );

  if (!chatroomId) throw new Error("Missing chatroomId");
  if (!files.length) throw new Error("No files found");

  try {
    // 3. Get group key directly
    const groupKeySnapshot = await get(
      dbRef(db, `chatrooms/${chatroomId}/encryption/group_key`)
    );
    const rawGroupKey = groupKeySnapshot.val();
    if (!rawGroupKey) throw new Error("群组加密密钥不存在");

    const keyBufferUtf8 = Buffer.from(
      CryptoJS.enc.Utf8.parse(rawGroupKey).toString(CryptoJS.enc.Hex),
      "hex"
    );

    const groupKey =
      keyBufferUtf8.length !== 32
        ? Buffer.from(
            CryptoJS.SHA256(rawGroupKey).toString(CryptoJS.enc.Hex),
            "hex"
          ).slice(0, 32)
        : keyBufferUtf8;

    const uploadedFiles = [];

    // 4. Encrypt + upload
    for (const part of files) {
      const fileExt = part.filename?.split(".").pop() || "file";
      const fileName = `${Date.now()}-${part.filename}`;
      const filePath = `chatroom/${chatroomId}/${fileName}`;

      const iv = randomBytes(16);
      const cipher = createCipheriv("aes-256-cbc", groupKey, iv);
      const encryptedData = Buffer.concat([
        iv,
        cipher.update(part.data),
        cipher.final(),
      ]);

      const fileRef = storageRef(storage, filePath);
      await uploadBytes(fileRef, encryptedData, {
        customMetadata: {
          encrypted: "true",
          originalType: part.type || "application/octet-stream",
        },
      });

      const downloadURL = await getDownloadURL(fileRef);
      const messageType = part.type?.startsWith("image/")
        ? "image"
        : part.type?.startsWith("video/")
        ? "video"
        : "file";

      uploadedFiles.push({
        url: downloadURL,
        type: messageType,
        fileName: part.filename,
      });
    }

    return {
      message: "Files uploaded successfully",
      files: uploadedFiles.map((f) => f.url),
      fileDetails: uploadedFiles,
    };
  } catch (error: unknown) {
    console.error("Error uploading files:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload files: ${error.message}`);
    } else {
      throw new Error("Failed to upload files: Unknown error");
    }
  }
});
