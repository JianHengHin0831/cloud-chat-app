import { defineEventHandler, readMultipartFormData, getHeader } from "h3";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "~/firebase/firebase";
import { adminAuth } from "~/server/utils/firebase-admin";
import { ServerValue } from "firebase-admin/database";
import { adminDb } from "~/server/utils/firebase-admin";

export default defineEventHandler(async (event) => {
  // 從請求頭中獲取 ID Token
  const authHeader = getHeader(event, "Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: No ID Token provided");
  }
  const idToken = authHeader.split("Bearer ")[1];

  // 驗證 ID Token 並獲取用戶信息
  let userId;
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    userId = decodedToken.uid;
  } catch (error) {
    console.error("Error verifying ID Token:", error);
    throw new Error("Unauthorized: Invalid ID Token");
  }

  // 解析 FormData
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw new Error("No form data found");
  }

  // 提取字段
  let chatroomId;
  for (const part of formData) {
    if (part.name === "chatroomId") {
      chatroomId = part.data.toString("utf-8");
    }
  }

  if (!chatroomId) {
    throw new Error("Missing chatroomId");
  }

  try {
    const uploadedFiles = [];

    for (const part of formData) {
      if (part.name === "file") {
        // 生成唯一文件名
        const fileExtension = part.filename?.split(".").pop() || "file";
        const fileName = `${Date.now()}-${part.filename}`;
        const filePath = `chatroom/${chatroomId}/${fileName}`;

        // 上傳文件到 Cloud Storage
        const fileRef = storageRef(storage, filePath);
        await uploadBytes(fileRef, part.data);

        // 獲取文件的下載 URL
        const downloadURL = await getDownloadURL(fileRef);

        // 根據文件類型設置 messageType
        let messageType = "file"; // 默認為文件
        if (part.type?.startsWith("image/")) {
          messageType = "image";
        } else if (part.type?.startsWith("video/")) {
          messageType = "video";
        }

        // 將文件信息存儲到 Firestore
        const chatroomRef = adminDb.ref(`chatrooms/${chatroomId}/messages`);
        const newMessageRef = chatroomRef.push(); // Automatically generates a unique key

        await newMessageRef.set({
          senderId: userId,
          messageContent: downloadURL,
          messageType, // file type
          createdAt: ServerValue.TIMESTAMP, // Admin SDK timestamp
        });

        uploadedFiles.push(downloadURL);
      }
    }

    return { message: "Files uploaded successfully", files: uploadedFiles };
  } catch (error) {
    console.error("Error uploading files:", error);
    throw new Error("Failed to upload files");
  }
});

// import { defineEventHandler, readMultipartFormData, getHeader } from "h3";
// import { db } from "~/firebase/firebase";
// import { adminAuth } from "~/server/utils/firebase-admin";
// import { ref as dbRef, push, set } from "firebase/database";
// import { uploadEncryptedFile } from "~/server/utils/storage";
// import { encrypt } from "~/server/utils/crypto";

// export default defineEventHandler(async (event) => {
//   // 從請求頭中獲取 ID Token
//   const authHeader = getHeader(event, "Authorization");
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     throw new Error("Unauthorized: No ID Token provided");
//   }
//   const idToken = authHeader.split("Bearer ")[1];

//   // 驗證 ID Token 並獲取用戶信息
//   let userId;
//   try {
//     const decodedToken = await adminAuth.verifyIdToken(idToken);
//     userId = decodedToken.uid;
//   } catch (error) {
//     console.error("Error verifying ID Token:", error);
//     throw new Error("Unauthorized: Invalid ID Token");
//   }

//   // 解析 FormData
//   const formData = await readMultipartFormData(event);
//   if (!formData) {
//     throw new Error("No form data found");
//   }

//   // 提取字段
//   let chatroomId;
//   for (const part of formData) {
//     if (part.name === "chatroomId") {
//       chatroomId = part.data.toString("utf-8");
//     }
//   }

//   if (!chatroomId) {
//     throw new Error("Missing chatroomId");
//   }

//   try {
//     const uploadedFiles = [];

//     for (const part of formData) {
//       if (part.name === "file") {
//         // Parse encrypted file metadata
//         const metadata = JSON.parse(part.data?.toString() || "{}");

//         // Upload encrypted file to storage
//         const fileId = `${Date.now()}-${Math.random()
//           .toString(36)
//           .substr(2, 9)}`;
//         const filePath = await uploadEncryptedFile(
//           userId,
//           fileId,
//           {
//             encryptedData: part.data,
//             iv: Buffer.from(metadata.iv),
//             authTag: Buffer.from(metadata.authTag),
//           },
//           {
//             name: part.filename,
//             type: part.type,
//             size: part.data.length,
//           }
//         );

//         // Encrypt file path before storing in database
//         const encryptedPath = await encrypt(filePath, metadata.key);

//         // 根據文件類型設置 messageType
//         let messageType = "file";
//         if (part.type?.startsWith("image/")) {
//           messageType = "image";
//         } else if (part.type?.startsWith("video/")) {
//           messageType = "video";
//         }

//         // 創建消息數據
//         const messageData = {
//           senderId: userId,
//           messageContent: encryptedPath,
//           messageType,
//           encrypted: true,
//           createdAt: { ".sv": "timestamp" },
//         };

//         // 使用 RTDB 存儲消息
//         const messagesRef = dbRef(db, `chatroom/${chatroomId}/messages`);
//         const newMessageRef = push(messagesRef);
//         await set(newMessageRef, messageData);

//         uploadedFiles.push({
//           url: filePath,
//           type: messageType,
//           messageId: newMessageRef.key, // 返回消息ID
//         });

//         //uploadedFiles.push(downloadURL);
//       }
//     }

//     return { message: "Files uploaded successfully", files: uploadedFiles };
//   } catch (error) {
//     console.error("Error uploading files:", error);
//     throw new Error("Failed to upload files");
//   }
// });
