import { defineEventHandler, readBody, setResponseHeader } from "h3";
import { verifyToken } from "~/server/utils/auth";
import fetch from "node-fetch";
import { createDecipheriv } from "crypto";
import CryptoJS from "crypto-js";
import { adminDb } from "~/server/utils/firebase-admin";

export default defineEventHandler(async (event) => {
  try {
    // Verify user authentication
    const user = await verifyToken(event);
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    // Get request body
    const { url, chatroomId } = await readBody(event);

    // Validate required parameters
    if (!url || !chatroomId) {
      return { error: "Missing required parameters", status: 400 };
    }

    try {
      // Fetch the file from Firebase Storage using server-side fetch to avoid CORS
      const response = await fetch(url);
      if (!response.ok) {
        return {
          error: `Failed to fetch file: ${response.statusText}`,
          status: response.status,
        };
      }

      // Get file content as buffer
      const encryptedBuffer = await response.arrayBuffer();

      const contentType =
        response.headers.get("content-type") || "application/octet-stream";
      const isEncrypted =
        response.headers.get("x-goog-meta-encrypted") === "true";
      const originalContentType = response.headers.get(
        "x-goog-meta-originaltype"
      );

      const contentDisposition = response.headers.get("content-disposition");
      let filename = "file";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      } else {
        const urlParts = url.split("/");
        const lastPart = urlParts[urlParts.length - 1].split("?")[0];
        if (lastPart) {
          filename = decodeURIComponent(lastPart);
        }
      }

      let finalContentType = originalContentType || contentType;

      if (isEncrypted || url.includes("firebasestorage.googleapis.com")) {
        try {
          if (encryptedBuffer.byteLength <= 16) {
            throw new Error("Encrypted data too short");
          }

          const encryptedData = new Uint8Array(encryptedBuffer);
          const iv = encryptedData.slice(0, 16);
          const encryptedContent = encryptedData.slice(16);

          const groupKeySnapshot = await adminDb
            .ref(`chatrooms/${chatroomId}/encryption/group_key`)
            .get();

          if (!groupKeySnapshot.exists()) {
            throw new Error("group key not found");
          }

          const rawGroupKey = groupKeySnapshot.val();

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

          const decipher = createDecipheriv("aes-256-cbc", groupKey, iv);

          const decryptedContent = Buffer.concat([
            decipher.update(Buffer.from(encryptedContent)),
            decipher.final(),
          ]);

          setResponseHeader(event, "Content-Type", finalContentType);
          setResponseHeader(
            event,
            "Content-Disposition",
            `inline; filename="${filename}"`
          );

          return decryptedContent;
        } catch (decryptError) {
          console.error("Decrypting the file failed:", decryptError);

          setResponseHeader(event, "Content-Type", contentType);
          setResponseHeader(
            event,
            "Content-Disposition",
            `inline; filename="${filename}"`
          );
          return Buffer.from(encryptedBuffer);
        }
      } else {
        setResponseHeader(event, "Content-Type", contentType);
        setResponseHeader(
          event,
          "Content-Disposition",
          `inline; filename="${filename}"`
        );
        return Buffer.from(encryptedBuffer);
      }
    } catch (error) {
      console.error(
        "Error fetching or decrypting file:",
        error,
        url,
        chatroomId
      );
      return { error: "Failed to fetch or decrypt file", status: 500 };
    }
  } catch (error) {
    console.error("Error in fetch file API:", error);
    return { error: "Internal server error", status: 500 };
  }
});
