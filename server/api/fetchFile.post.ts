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

      // 检查响应头中的metadata
      const contentType =
        response.headers.get("content-type") || "application/octet-stream";
      const isEncrypted =
        response.headers.get("x-goog-meta-encrypted") === "true";
      const originalContentType = response.headers.get(
        "x-goog-meta-originaltype"
      );

      // 确保文件名正确
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "file";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      } else {
        // 从URL提取文件名
        const urlParts = url.split("/");
        const lastPart = urlParts[urlParts.length - 1].split("?")[0];
        if (lastPart) {
          filename = decodeURIComponent(lastPart);
        }
      }

      // 使用适当的内容类型
      let finalContentType = originalContentType || contentType;

      // 如果标记为加密或者是来自Firebase Storage的URL，尝试解密
      if (isEncrypted || url.includes("firebasestorage.googleapis.com")) {
        try {
          // 确保我们有足够的数据来解密
          if (encryptedBuffer.byteLength <= 16) {
            throw new Error("Encrypted data too short");
          }

          // 前16字节是IV，之后是加密内容
          const encryptedData = new Uint8Array(encryptedBuffer);
          const iv = encryptedData.slice(0, 16);
          const encryptedContent = encryptedData.slice(16);

          // 直接获取群组密钥
          const groupKeySnapshot = await adminDb
            .ref(`chatrooms/${chatroomId}/encryption/group_key`)
            .get();

          if (!groupKeySnapshot.exists()) {
            throw new Error("群组加密密钥不存在");
          }

          const rawGroupKey = groupKeySnapshot.val();

          // 处理密钥格式，与加密逻辑保持一致
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

          // 创建解密器
          const decipher = createDecipheriv("aes-256-cbc", groupKey, iv);

          // 解密内容
          const decryptedContent = Buffer.concat([
            decipher.update(Buffer.from(encryptedContent)),
            decipher.final(),
          ]);

          // 设置适当的响应头
          setResponseHeader(event, "Content-Type", finalContentType);
          setResponseHeader(
            event,
            "Content-Disposition",
            `inline; filename="${filename}"`
          );

          // 返回解密后的文件内容
          return decryptedContent;
        } catch (decryptError) {
          console.error("解密文件失败:", decryptError);
          // 如果解密失败，尝试返回原始内容
          setResponseHeader(event, "Content-Type", contentType);
          setResponseHeader(
            event,
            "Content-Disposition",
            `inline; filename="${filename}"`
          );
          return Buffer.from(encryptedBuffer);
        }
      } else {
        // 如果文件未加密，直接返回
        setResponseHeader(event, "Content-Type", contentType);
        setResponseHeader(
          event,
          "Content-Disposition",
          `inline; filename="${filename}"`
        );
        return Buffer.from(encryptedBuffer);
      }
    } catch (error) {
      console.error("Error fetching or decrypting file:", error);
      return { error: "Failed to fetch or decrypt file", status: 500 };
    }
  } catch (error) {
    console.error("Error in fetch file API:", error);
    return { error: "Internal server error", status: 500 };
  }
});

// import { defineEventHandler, readBody, setResponseHeader } from "h3";
// import { verifyToken } from "~/server/utils/auth";
// import fetch from "node-fetch";
// import { createDecipheriv } from "crypto";
// import { get, ref as dbRef } from "firebase/database";
// import CryptoJS from "crypto-js";
// import { adminDb } from "~/server/utils/firebase-admin";

// export default defineEventHandler(async (event) => {
//   try {
//     // Verify user authentication
//     const user = await verifyToken(event);
//     if (!user) {
//       return { error: "Unauthorized", status: 401 };
//     }

//     // Get request body
//     const { url, chatroomId, userId } = await readBody(event);

//     // Validate required parameters
//     if (!url || !chatroomId || !userId) {
//       return { error: "Missing required parameters", status: 400 };
//     }

//     try {
//       // Fetch the file from Firebase Storage using server-side fetch to avoid CORS
//       const response = await fetch(url);
//       if (!response.ok) {
//         //console.error(`Failed to fetch file: ${response.statusText}`);
//         return {
//           error: `Failed to fetch file: ${response.statusText}`,
//           status: response.status,
//         };
//       }

//       // Get file content as buffer
//       const encryptedBuffer = await response.arrayBuffer();

//       // 检查响应头中的metadata
//       const contentType =
//         response.headers.get("content-type") || "application/octet-stream";
//       const isEncrypted =
//         response.headers.get("x-goog-meta-encrypted") === "true";
//       const originalContentType = response.headers.get(
//         "x-goog-meta-originaltype"
//       );

//       // 确保文件名正确
//       const contentDisposition = response.headers.get("content-disposition");
//       let filename = "file";
//       if (contentDisposition) {
//         const match = contentDisposition.match(/filename="([^"]+)"/);
//         if (match && match[1]) {
//           filename = match[1];
//         }
//       } else {
//         // 从URL提取文件名
//         const urlParts = url.split("/");
//         const lastPart = urlParts[urlParts.length - 1].split("?")[0];
//         if (lastPart) {
//           filename = decodeURIComponent(lastPart);
//         }
//       }

//       // 使用适当的内容类型
//       let finalContentType = originalContentType || contentType;

//       // 如果标记为加密或者是来自Firebase Storage的URL，尝试解密
//       if (isEncrypted || url.includes("firebasestorage.googleapis.com")) {
//         try {
//           // 确保我们有足够的数据来解密
//           if (encryptedBuffer.byteLength <= 16) {
//             throw new Error("Encrypted data too short");
//           }

//           // 前16字节是IV，之后是加密内容
//           const encryptedData = new Uint8Array(encryptedBuffer);
//           const iv = encryptedData.slice(0, 16);
//           const encryptedContent = encryptedData.slice(16);

//           const userGroupKeyRef = adminDb.ref(
//             `chatrooms/${chatroomId}/encryption/${userId}/privatekey`
//           );
//           const userGroupKeySnapshot = await userGroupKeyRef.get();

//           if (!userGroupKeySnapshot.exists()) {
//             throw new Error("用户群组加密密钥不存在");
//           }

//           const encryptedGroupKey = userGroupKeySnapshot.val();
//           const userKeyRef = adminDb.ref(`users/${userId}/keys/private_key`);
//           const snapshot = await userKeyRef.get();
//           const encryptedKey = snapshot.val();
//           const derivedKey = CryptoJS.PBKDF2(userId, "user-key-salt", {
//             keySize: 256 / 32,
//             iterations: 10000,
//           });
//           const privateKey = CryptoJS.AES.decrypt(
//             encryptedKey,
//             derivedKey.toString()
//           ).toString(CryptoJS.enc.Utf8);

//           // 使用用户私钥解密群组密钥
//           const groupKey = CryptoJS.AES.decrypt(
//             encryptedGroupKey,
//             privateKey
//           ).toString(CryptoJS.enc.Utf8);

//           // 使用用户私钥解密群组密钥

//           // 确保密钥长度为32字节
//           const keyBuffer = Buffer.from(groupKey, "utf8");
//           let key;
//           if (keyBuffer.length !== 32) {
//             // 如果密钥长度不是32字节，使用SHA-256生成32字节密钥
//             const hashedKey = CryptoJS.SHA256(groupKey).toString(
//               CryptoJS.enc.Hex
//             );
//             const paddedKey = Buffer.from(hashedKey, "hex");
//             key = paddedKey.slice(0, 32); // 确保密钥长度为32字节
//           } else {
//             key = keyBuffer;
//           }

//           // 创建解密器
//           const decipher = createDecipheriv("aes-256-cbc", key, iv);

//           // 解密内容
//           const decryptedContent = Buffer.concat([
//             decipher.update(Buffer.from(encryptedContent)),
//             decipher.final(),
//           ]);

//           // 设置适当的响应头
//           setResponseHeader(event, "Content-Type", finalContentType);
//           setResponseHeader(
//             event,
//             "Content-Disposition",
//             `inline; filename="${filename}"`
//           );

//           // 返回解密后的文件内容
//           return decryptedContent;
//         } catch (decryptError) {
//           console.error("解密文件失败:", decryptError);
//           // 如果解密失败，尝试返回原始内容
//           setResponseHeader(event, "Content-Type", contentType);
//           setResponseHeader(
//             event,
//             "Content-Disposition",
//             `inline; filename="${filename}"`
//           );
//           return Buffer.from(encryptedBuffer);
//         }
//       } else {
//         // 如果文件未加密，直接返回
//         setResponseHeader(event, "Content-Type", contentType);
//         setResponseHeader(
//           event,
//           "Content-Disposition",
//           `inline; filename="${filename}"`
//         );
//         return Buffer.from(encryptedBuffer);
//       }
//     } catch (error) {
//       //console.error("Error fetching or decrypting file:", error);
//       return { error: "Failed to fetch or decrypt file", status: 500 };
//     }
//   } catch (error) {
//     //console.error("Error in fetch file API:", error);
//     return { error: "Internal server error", status: 500 };
//   }
// });
