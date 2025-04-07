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

  // 从请求头中获取 ID Token
  const authHeader = getHeader(event, "Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: No ID Token provided");
  }
  const idToken = authHeader.split("Bearer ")[1];

  // 验证 ID Token 并获取用户信息
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

  // 验证输入
  if (!name || !chatType) {
    throw new Error("Missing required fields");
  }

  try {
    let photoUrl = null;

    // 如果有上传照片，先上传到 Cloud Storage
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

    // 创建群组并存储到 Realtime Database
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
    // 存储群组成员信息
    // 2. 添加成员信息 (使用 Admin SDK)
    const joinedAt = Date.now();
    const memberRef = adminDb.ref(`chatroom_users/${chatroomId}/${userId}`);
    await memberRef.set({
      role: "admin",
      joinedAt,
      isPinned: false,
      isMuted: false,
    });

    // 3. 在用户的群组列表中添加该群组
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

// import { defineEventHandler, readMultipartFormData, getHeader } from "h3";
// import {
//   ref as storageRef,
//   uploadBytes,
//   getDownloadURL,
// } from "firebase/storage";
// import { db, storage } from "~/firebase/firebase";
// import { adminAuth } from "~/server/utils/firebase-admin"; // 使用 Firebase Admin SDK

// export default defineEventHandler(async (event) => {
//   const res = event.node.res;

//   // 从请求头中获取 ID Token
//   const authHeader = getHeader(event, "Authorization");
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     throw new Error("Unauthorized: No ID Token provided");
//   }
//   const idToken = authHeader.split("Bearer ")[1];

//   // 验证 ID Token 并获取用户信息
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
//   let name, description, chatType, photoFile;
//   for (const part of formData) {
//     if (part.name === "name") {
//       name = part.data.toString("utf-8");
//     } else if (part.name === "description") {
//       description = part.data.toString("utf-8");
//     } else if (part.name === "chatType") {
//       chatType = part.data.toString("utf-8");
//     } else if (part.name === "photoFile") {
//       photoFile = part;
//     }
//   }

//   // 验证输入
//   if (!name || !chatType) {
//     throw new Error("Missing required fields");
//   }

//   try {
//     let photoUrl = null;

//     // 如果有上传照片，先上传到 Cloud Storage
//     if (photoFile) {
//       try {
//         const fileRef = storageRef(
//           storage,
//           `group-photos/${Date.now()}-${photoFile.filename}`
//         );
//         await uploadBytes(fileRef, photoFile.data);
//         photoUrl = await getDownloadURL(fileRef);
//       } catch (storageError: any) {
//         console.error("Storage error:", storageError);
//         if (storageError.code === "storage/unauthorized") {
//           throw createError({
//             statusCode: 403,
//             message: "Storage permission denied: Unable to upload group photo",
//           });
//         }
//         throw createError({
//           statusCode: 500,
//           message: `Storage error: ${storageError.message}`,
//         });
//       }
//     }

//     // 创建群组并存储到 Firestore
//     const groupRef = doc(db, "chatroom", Date.now().toString());
//     await setDoc(groupRef, {
//       name,
//       description: description || null, // 如果没有描述，存储为 null
//       chatType,
//       photoUrl,
//       createdAt: new Date().toISOString(),
//       isDisband: false,
//     });

//     // 将创建者信息存储到 chatroom_user 表
//     const chatroomUserRef = doc(
//       db,
//       "chatroom_user",
//       `${groupRef.id}_${userId}`
//     );
//     await setDoc(chatroomUserRef, {
//       chatroomId: groupRef.id, // 群组 ID
//       userId: userId, // 用户 ID
//       role: "admin", // 创建者自动成为管理员
//       joinedAt: new Date().toISOString(), // 加入时间
//       isPinned: false,
//       isMuted: false,
//     });

//     return { groupId: groupRef.id };
//   } catch (error) {
//     console.error("Error creating group:", error);
//     throw new Error("Failed to create group");
//   }
// });
