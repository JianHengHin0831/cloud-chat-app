import {
  ref as dbRef,
  get,
  set,
  push,
  onValue,
  query,
  orderByChild,
  limitToLast,
  startAt,
  serverTimestamp,
  increment,
  update,
} from "firebase/database";
import { db, auth } from "@/firebase/firebase";
import { getCache, setCache, deleteCache } from "@/utils/client-cache";
import CryptoJS from "crypto-js";

// 基础加密密钥 - 将在函数内部获取
let BASE_ENCRYPTION_KEY = null;

// 密钥缓存 - 存储最近的几个密钥版本
const KEY_CACHE = new Map();
const MAX_KEY_VERSIONS = 30; // 保存最近30天的密钥

// 存储用户的棘轮状态
const userRatchetStates = new Map();

// 棘轮状态结构
class RatchetState {
  constructor(rootKey) {
    this.rootKey = rootKey;
    this.sendingChainKey = null;
    this.receivingChainKey = null;
    this.messageKeyCache = new Map(); // 缓存消息密钥，用于处理乱序消息
    this.messageCounter = 0;
    this.previousMessageKeys = []; // 存储之前的消息密钥，用于处理乱序消息
    this.maxStoredMessageKeys = 100; // 最多存储100个之前的消息密钥
    this.lastSyncTime = Date.now(); // 添加同步时间戳

    // 从缓存恢复状态
    if (typeof window !== "undefined") {
      import("@/utils/client-cache").then(({ getCache }) => {
        const cacheKey = `ratchet_state_${rootKey}`;
        getCache(cacheKey).then((cachedState) => {
          if (cachedState) {
            this.deserialize(cachedState);
          }
        });
      });
    }
  }

  // 序列化状态用于缓存
  serialize() {
    return {
      rootKey: this.rootKey,
      sendingChainKey: this.sendingChainKey,
      receivingChainKey: this.receivingChainKey,
      messageCounter: this.messageCounter,
      lastSyncTime: this.lastSyncTime,
    };
  }

  // 从缓存反序列化状态
  deserialize(state) {
    if (!state) return;
    this.sendingChainKey = state.sendingChainKey;
    this.receivingChainKey = state.receivingChainKey;
    this.messageCounter = state.messageCounter;
    this.lastSyncTime = state.lastSyncTime;
  }

  // 添加一个方法来检查状态是否需要同步
  needsSync(threshold = 300000) {
    // 默认5分钟，减少不必要的同步
    return Date.now() - this.lastSyncTime > threshold;
  }

  // 添加一个方法来标记已同步
  markSynced() {
    this.lastSyncTime = Date.now();
  }

  // 添加一个方法来重置状态
  reset() {
    this.messageKeyCache.clear();
    this.previousMessageKeys = [];
    this.messageCounter = 0;
    this.markSynced();
    // 触发客户端缓存更新
    if (typeof window !== "undefined") {
      import("@/utils/client-cache").then(({ setCache }) => {
        const cacheKey = `ratchet_state_${this.rootKey}`;
        setCache(cacheKey, this.serialize(), 36000);
      });
    }
  }
}

// 密钥派生函数 - 使用 PBKDF2 增强安全性
const deriveKey = (salt, userId, chatroomId, iterations = 10000) => {
  if (!BASE_ENCRYPTION_KEY) {
    throw new Error("加密密钥未初始化");
  }

  // 组合密钥材料
  const keyMaterial = `${BASE_ENCRYPTION_KEY}-${userId}-${chatroomId}`;

  // 使用 PBKDF2 派生密钥 (更安全的密钥派生)
  return CryptoJS.PBKDF2(keyMaterial, salt, {
    keySize: 256 / 32, // 256 位密钥
    iterations: iterations, // 迭代次数
    hasher: CryptoJS.algo.SHA256, // 使用 SHA-256
  }).toString();
};

// 密钥版本计算 - 基于月份而不是天数
const getCurrentKeyVersion = () => {
  const now = new Date();
  // 格式: YYYY-MM (例如 2023-05)
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

import { useUserApi } from "~/composables/useUserApi";
const { getPrivateKey } = useUserApi();
const getUserPrivateKey = async (userId) => {
  const cachedKey = await getCache("privateKey");
  if (cachedKey) {
    return cachedKey;
  }
  const { data } = await getPrivateKey(userId);
  if (data?.key) {
    await setCache("privateKey", data.key, 18000);
    return data.key;
  }
  return null;
};

// 初始化用户与聊天室的棘轮状态
const initializeRatchet = async (userId, chatroomId, recipientId = null) => {
  const stateKey = recipientId
    ? `${userId}:${chatroomId}:${recipientId}`
    : `${userId}:${chatroomId}`;

  // 如果已经初始化，直接返回
  if (userRatchetStates.has(stateKey)) {
    return userRatchetStates.get(stateKey);
  }

  try {
    // 获取用户私钥

    const userPrivateKey = await getUserPrivateKey(userId);

    if (!userPrivateKey) {
      throw new Error("无法获取用户私钥");
    }

    // 生成根密钥
    let rootKey;

    if (recipientId) {
      // 私聊 - 使用两个用户ID和聊天室ID生成根密钥
      const salt = CryptoJS.enc.Utf8.parse(
        `${userId}:${recipientId}:${chatroomId}`
      );
      rootKey = CryptoJS.PBKDF2(userPrivateKey, salt, {
        keySize: 256 / 32,
        iterations: 10000,
      }).toString();

      // 检查是否已有存储的棘轮状态
      const ratchetRef = dbRef(
        db,
        `users/${userId}/ratchets/${chatroomId}/${recipientId}`
      );
      const snapshot = await get(ratchetRef);

      if (snapshot.exists()) {
        // 恢复存储的棘轮状态
        const storedState = snapshot.val();
        const ratchetState = new RatchetState(rootKey);
        ratchetState.sendingChainKey = storedState.sendingChainKey;
        ratchetState.receivingChainKey = storedState.receivingChainKey;
        ratchetState.messageCounter = storedState.messageCounter || 0;

        userRatchetStates.set(stateKey, ratchetState);
        return ratchetState;
      }
    } else {
      // 群聊 - 使用群组密钥作为根密钥
      const { useRuntimeConfig } = await import("#app");
      const config = useRuntimeConfig();
      const systemKey = config.public.baseEncryptionKey;

      // 检查群组密钥是否存在
      const groupKeyRef = dbRef(
        db,
        `chatrooms/${chatroomId}/encryption/group_key`
      );
      const snapshot = await get(groupKeyRef);

      if (snapshot.exists()) {
        // 如果存在，使用存储的群组密钥
        const encryptedGroupKey = snapshot.val();
        // 使用系统密钥解密群组密钥
        rootKey = CryptoJS.AES.decrypt(encryptedGroupKey, systemKey).toString(
          CryptoJS.enc.Utf8
        );

        const userGroupKeyRef = dbRef(
          db,
          `chatrooms/${chatroomId}/encryption/${userId}/privatekey`
        );
        const userGroupKeySnapshot = await get(userGroupKeyRef);

        if (!userGroupKeySnapshot.exists()) {
          // 如果用户没有群组加密密钥，使用群组密钥和用户私钥生成并存储
          const userPrivateKey = await getUserPrivateKey(userId);
          const userGroupEncryptKey = CryptoJS.AES.encrypt(
            rootKey,
            userPrivateKey
          ).toString();

          // 存储用户的群组加密密钥
          await set(userGroupKeyRef, userGroupEncryptKey);
        }
      } else {
        // 如果不存在，创建新的群组密钥
        rootKey = CryptoJS.lib.WordArray.random(32).toString();
        // 使用系统密钥加密群组密钥
        const encryptedGroupKey = CryptoJS.AES.encrypt(
          rootKey,
          systemKey
        ).toString();
        // 保存加密的群组密钥
        await set(groupKeyRef, encryptedGroupKey);

        const userGroupKeyRef = dbRef(
          db,
          `chatrooms/${chatroomId}/encryption/${userId}/privatekey`
        );
        const userGroupKeySnapshot = await get(userGroupKeyRef);

        if (!userGroupKeySnapshot.exists()) {
          // 如果用户没有群组加密密钥，使用群组密钥和用户私钥生成并存储
          const userPrivateKey = await getUserPrivateKey(userId);
          const userGroupEncryptKey = CryptoJS.AES.encrypt(
            rootKey,
            userPrivateKey
          ).toString();

          // 存储用户的群组加密密钥
          await set(userGroupKeyRef, userGroupEncryptKey);
        }
      }

      // 检查是否已有存储的棘轮状态
      const ratchetRef = dbRef(
        db,
        `users/${userId}/ratchets/${chatroomId}/group`
      );
      const ratchetSnapshot = await get(ratchetRef);

      if (ratchetSnapshot.exists()) {
        // 恢复存储的棘轮状态
        const storedState = ratchetSnapshot.val();
        const ratchetState = new RatchetState(rootKey);
        ratchetState.sendingChainKey = storedState.sendingChainKey;
        ratchetState.receivingChainKey = storedState.receivingChainKey;
        ratchetState.messageCounter = storedState.messageCounter || 0;

        userRatchetStates.set(stateKey, ratchetState);
        return ratchetState;
      }
    }

    // 如果没有现有状态，创建新的棘轮状态
    const ratchetState = new RatchetState(rootKey);

    // 初始化发送链密钥
    const sendingSalt = CryptoJS.enc.Utf8.parse(
      `sending:${userId}:${chatroomId}`
    );
    ratchetState.sendingChainKey = CryptoJS.HmacSHA256(
      rootKey,
      sendingSalt
    ).toString();

    // 接收链密钥将在第一次接收消息时初始化

    // 将棘轮状态保存到数据库
    if (recipientId) {
      await set(
        dbRef(db, `users/${userId}/ratchets/${chatroomId}/${recipientId}`),
        {
          sendingChainKey: ratchetState.sendingChainKey,
          messageCounter: 0,
          lastUpdated: serverTimestamp(),
        }
      );
    } else {
      await set(dbRef(db, `users/${userId}/ratchets/${chatroomId}/group`), {
        sendingChainKey: ratchetState.sendingChainKey,
        messageCounter: 0,
        lastUpdated: serverTimestamp(),
      });
    }

    // 缓存棘轮状态
    userRatchetStates.set(stateKey, ratchetState);

    return ratchetState;
  } catch (error) {
    console.error("初始化棘轮状态失败:", error);
    return null;
  }
};

// 修改 updateSendingChain 函数，确保密钥派生一致
const updateSendingChain = async (
  ratchetState,
  userId,
  chatroomId,
  recipientId
) => {
  try {
    // 增加消息计数器
    const messageCounter = await incrementMessageCounter(userId);

    // 使用一个更简单、更一致的方法派生消息密钥
    const messageKey = CryptoJS.SHA256(
      `${ratchetState.rootKey}:${messageCounter}:${userId}:${chatroomId}`
    ).toString();

    // 更新棘轮状态
    ratchetState.messageCounter = messageCounter;

    // 更新数据库中的棘轮状态
    try {
      if (recipientId) {
        await update(
          dbRef(db, `users/${userId}/ratchets/${chatroomId}/${recipientId}`),
          {
            messageCounter: ratchetState.messageCounter,
            lastUpdated: serverTimestamp(),
          }
        );
      } else {
        await update(
          dbRef(db, `users/${userId}/ratchets/${chatroomId}/group`),
          {
            messageCounter: ratchetState.messageCounter,
            lastUpdated: serverTimestamp(),
          }
        );
      }
    } catch (error) {
      console.error("更新发送链失败:", error);
    }

    return messageKey;
  } catch (error) {
    console.error("更新发送链出错:", error);
    return null;
  }
};

// 宽松模式 - 在 HMAC 验证失败时仍然尝试解密
const LENIENT_MODE = true;

// 修改 updateReceivingChain 函数，使用相同的密钥派生方法
const updateReceivingChain = async (
  ratchetState,
  userId,
  chatroomId,
  messageNumber,
  senderId
) => {
  try {
    // 使用与发送方相同的方法派生消息密钥
    const messageKey = CryptoJS.SHA256(
      `${ratchetState.rootKey}:${messageNumber}:${senderId}:${chatroomId}`
    ).toString();

    // 更新棘轮状态
    ratchetState.messageCounter = messageNumber + 1;

    // 更新数据库中的棘轮状态
    try {
      const recipientId = senderId; // 在接收时，发送者就是我们的接收者
      const updatePath = recipientId
        ? `users/${userId}/ratchets/${chatroomId}/${recipientId}`
        : `users/${userId}/ratchets/${chatroomId}/group`;

      await update(dbRef(db, updatePath), {
        messageCounter: ratchetState.messageCounter,
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error("更新接收链失败:", error);
    }

    return messageKey;
  } catch (error) {
    console.error("更新接收链出错:", error);
    return null;
  }
};

// 获取用户的群组加密密钥
const getUserGroupEncryptKey = async (userId, chatroomId) => {
  try {
    const userGroupKeyRef = dbRef(
      db,
      `chatrooms/${chatroomId}/encryption/${userId}/privatekey`
    );
    return await get(userGroupKeyRef);
  } catch (error) {
    console.error("获取用户群组加密密钥失败:", error);
    throw error;
  }
};

// 修改加密消息函数，结合群组密钥和双重棘轮
const encryptWithRatchet = async (
  message,
  senderId,
  chatroomId,
  recipientId = null
) => {
  if (!message) return "";

  try {
    // 初始化或获取棘轮状态
    const ratchetState = await initializeRatchet(
      senderId,
      chatroomId,
      recipientId
    );

    if (!ratchetState) {
      throw new Error("无法初始化棘轮状态");
    }

    // 更新发送链并获取消息密钥
    const messageKey = await updateSendingChain(
      ratchetState,
      senderId,
      chatroomId,
      recipientId
    );

    if (!messageKey) {
      throw new Error("无法生成消息密钥");
    }

    // 获取发送者的群组加密密钥
    const userGroupEncryptKey = await getUserGroupEncryptKey(
      senderId,
      chatroomId
    );

    // 获取发送者的私钥
    const userPrivateKey = await getUserPrivateKey(senderId);
    if (!userPrivateKey) {
      throw new Error("无法获取用户私钥");
    }

    // 使用私钥解密群组加密密钥
    const groupKey = CryptoJS.AES.decrypt(
      userGroupEncryptKey,
      userPrivateKey
    ).toString(CryptoJS.enc.Utf8);

    // 生成随机初始化向量(IV)
    const iv = CryptoJS.lib.WordArray.random(16);

    // 当前时间戳
    const timestamp = Date.now();

    // 消息对象
    const messageObj = {
      content: message,
      timestamp: timestamp,
      sender: senderId,
    };

    // 序列化消息对象
    const messageString = JSON.stringify(messageObj);

    // 使用群组密钥和消息密钥的组合进行加密
    const combinedKey = CryptoJS.SHA256(`${groupKey}:${messageKey}`).toString();

    // 使用组合密钥加密消息
    const encrypted = CryptoJS.AES.encrypt(messageString, combinedKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // 添加 HMAC 用于消息认证 - 使用原始消息内容生成 HMAC
    const hmac = CryptoJS.HmacSHA256(messageString, combinedKey).toString(
      CryptoJS.enc.Base64
    );

    // 加密包
    const encryptedPackage = {
      cipher: encrypted.toString(),
      iv: iv.toString(CryptoJS.enc.Base64),
      mac: hmac,
      version: 3,
      type: recipientId ? "private" : "group",
      messageNumber: ratchetState.messageCounter,
      // 使用接收者的公钥加密消息密钥
      encryptedKey: CryptoJS.AES.encrypt(
        messageKey,
        ratchetState.rootKey
      ).toString(),
    };

    return JSON.stringify(encryptedPackage);
  } catch (error) {
    console.error("加密消息失败:", error);
    return `[加密失败] ${message}`;
  }
};

// 最大递归深度
const MAX_DECRYPT_RECURSION = 2;
// 修改解密消息函数，结合群组密钥和双重棘轮
const decryptWithRatchet = async (
  encryptedMessage,
  senderId,
  chatroomId,
  currentUserId,
  recursionDepth = 0
) => {
  if (!encryptedMessage) return "";

  if (!currentUserId) {
    return "[加密消息]";
  }

  try {
    // 解析加密包
    const encryptedPackage = JSON.parse(encryptedMessage);

    // 检查是否是棘轮协议加密的消息
    if (encryptedPackage.version !== 3) {
      return "[非棘轮加密消息]";
    }

    // 提取加密组件
    const { cipher, iv, mac, type, messageNumber } = encryptedPackage;

    // 确定接收者ID
    const recipientId = type === "private" ? senderId : null;

    // 初始化或获取棘轮状态
    const ratchetState = await initializeRatchet(
      currentUserId,
      chatroomId,
      recipientId
    );

    if (!ratchetState) {
      console.error("棘轮状态初始化失败");
      throw new Error("无法初始化棘轮状态");
    }

    // 获取消息密钥
    let messageKey = await updateReceivingChain(
      ratchetState,
      currentUserId,
      chatroomId,
      messageNumber,
      senderId
    );

    if (encryptedPackage.encryptedKey) {
      try {
        const decryptedKey = CryptoJS.AES.decrypt(
          encryptedPackage.encryptedKey,
          ratchetState.rootKey
        ).toString(CryptoJS.enc.Utf8);

        if (decryptedKey) {
          messageKey = decryptedKey;
        }
      } catch (e) {
        console.error("解密消息密钥失败", e);
      }
    }

    // 获取当前用户的群组加密密钥
    const userGroupEncryptKey = await getUserGroupEncryptKey(
      currentUserId,
      chatroomId
    );

    // 获取当前用户的私钥
    const userPrivateKey = await getUserPrivateKey(currentUserId);
    if (!userPrivateKey) {
      throw new Error("无法获取用户私钥");
    }

    // 使用私钥解密群组加密密钥
    const groupKey = CryptoJS.AES.decrypt(
      userGroupEncryptKey,
      userPrivateKey
    ).toString(CryptoJS.enc.Utf8);

    // 使用群组密钥和消息密钥的组合进行解密
    const combinedKey = CryptoJS.SHA256(`${groupKey}:${messageKey}`).toString();

    // 解密消息
    const decrypted = CryptoJS.AES.decrypt(cipher, combinedKey, {
      iv: CryptoJS.enc.Base64.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // 解析解密后的消息
    const decryptedMessage = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));

    // 验证 HMAC
    const computedHmac = CryptoJS.HmacSHA256(
      JSON.stringify(decryptedMessage),
      combinedKey
    ).toString(CryptoJS.enc.Base64);

    if (computedHmac !== mac && !LENIENT_MODE) {
      throw new Error("消息认证失败");
    }

    return decryptedMessage.content;
  } catch (error) {
    console.error("解密消息失败:", error);
    return "[解密失败]";
  }
};

// 消息加密函数 - 使用双重棘轮协议
const encryptMessage = async (
  message,
  senderId,
  chatroomId,
  recipientId = null
) => {
  if (!message) return "";

  try {
    // 尝试使用棘轮协议加密
    return await encryptWithRatchet(message, senderId, chatroomId, recipientId);
  } catch (error) {
    console.error("棘轮加密失败，回退到基本加密:", error);

    // 回退到基本加密方法
    try {
      // 获取当前版本号（基于月份）
      const currentVersion = getCurrentKeyVersion();

      // 确保我们有当前版本的密钥
      //BASE_ENCRYPTION_KEY = await getEncryptionKeyForVersion(currentVersion);

      if (!BASE_ENCRYPTION_KEY) {
        throw new Error("无法获取加密密钥");
      }

      // 生成随机初始化向量(IV)
      const iv = CryptoJS.lib.WordArray.random(16);

      // 当前时间戳
      const timestamp = Date.now();

      // 消息对象
      const messageObj = {
        content: message,
        timestamp: timestamp,
        sender: senderId,
      };

      // 序列化消息对象
      const messageString = JSON.stringify(messageObj);

      // 获取加密密钥
      let encryptionKey;
      if (recipientId) {
        // 私聊消息 - 使用接收者特定密钥
        const salt = CryptoJS.enc.Utf8.parse(recipientId);
        encryptionKey = deriveKey(salt, senderId, chatroomId);
      } else {
        // 群聊消息 - 使用群组密钥
        const salt = CryptoJS.enc.Utf8.parse(`group:${chatroomId}`);
        encryptionKey = deriveKey(salt, senderId, chatroomId);
      }

      // 使用 AES-CBC 模式加密
      const encrypted = CryptoJS.AES.encrypt(messageString, encryptionKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // 添加 HMAC 用于消息认证
      const hmac = CryptoJS.HmacSHA256(encrypted.toString(), encryptionKey);

      // 在加密包中包含版本信息
      const encryptedPackage = {
        cipher: encrypted.toString(),
        iv: iv.toString(CryptoJS.enc.Base64),
        mac: hmac.toString(CryptoJS.enc.Base64),
        version: 1, // 基本加密版本
        keyVersion: currentVersion, // 密钥版本 (月份格式)
        type: recipientId ? "private" : "group",
      };

      return JSON.stringify(encryptedPackage);
    } catch (fallbackError) {
      console.error("基本加密也失败:", fallbackError);
      return `[加密失败] ${message}`;
    }
  }
};

// 同步获取聊天室成员（用于解密）
const getChatroomMembersSync = (chatroomId) => {
  // 这里使用缓存或同步方法获取聊天室成员
  // 简化实现，实际应用中可能需要更复杂的逻辑
  const cacheKey = `chatroom:${chatroomId}:members`;
  const cached = getCache(cacheKey);

  // 确保返回一个数组
  if (cached && Array.isArray(cached)) {
    return cached;
  }

  // 如果缓存不存在或不是数组，返回空数组
  return [];
};

// 处理消息和活动日志
const processMessages = async (
  messagesSnapshot,
  activitySnapshot,
  groupId,
  currentUserId
) => {
  try {
    const combinedMessages = [];
    const cacheKey = `messages_${groupId}`;
    const cachedMessages = await getCache(cacheKey);
    const lastCachedTimestamp = cachedMessages
      ? Math.max(...cachedMessages.map((msg) => msg.createdAt))
      : 0;

    // 处理消息
    if (messagesSnapshot && messagesSnapshot.exists()) {
      const decryptPromises = [];

      messagesSnapshot.forEach((childSnapshot) => {
        try {
          const message = childSnapshot.val();
          const messageTimestamp = message.createdAt || 0;

          // 创建消息对象

          const messageObj = {
            id: childSnapshot.key,
            messageContent: message.messageContent || "",
            senderId: message.senderId || "",
            createdAt: messageTimestamp,
            messageType: message.messageType || "text",
            recipientId: message.recipientId || null,
            reactions: message.reactions || {},
            isPinned: message.isPinned || null,
            isDeleted: message.isDeleted || null,
          };

          if (message.isDeleted) {
            messageObj.messageContent = "";
            messageObj.messageType = "deleted message";
          }

          // 检查是否在缓存中已存在
          const cachedMessage = cachedMessages?.find(
            (msg) => msg.id === messageObj.id
          );
          if (cachedMessage && messageTimestamp <= lastCachedTimestamp) {
            const cachedMessageObj = {
              ...cachedMessage,
              messageContent: messageObj.isDeleted
                ? messageObj.messageContent
                : cachedMessage.messageContent,
              messageType: messageObj.isDeleted
                ? "deleted message"
                : cachedMessage.messageType,
              reactions: messageObj.reactions,
              isPinned: messageObj.isPinned,
              isDeleted: messageObj.isDeleted,
            };
            combinedMessages.push(cachedMessageObj);
            return;
          }

          // 处理反应数据
          const reactions = message.reactions || {};
          const reactionCounts = {};
          Object.entries(reactions).forEach(([emojiId, users]) => {
            reactionCounts[emojiId] = Object.keys(users).length;
          });
          messageObj.reactionCounts = reactionCounts;
          messageObj.hasReacted = Object.entries(reactions).some(([_, users]) =>
            Object.keys(users).includes(currentUserId)
          );

          // 只解密文本消息
          if (
            (message.messageType === "text" || !message.messageType) &&
            message.messageContent
          ) {
            // 创建解密Promise
            const decryptPromise = (async () => {
              try {
                // 尝试解密消息
                const decrypted = await decryptWithRatchet(
                  message.messageContent,
                  message.senderId,
                  groupId,
                  currentUserId
                );
                messageObj.messageContent = decrypted;
              } catch (decryptError) {
                console.error("解密消息失败:", decryptError);
                messageObj.messageContent = "[加密消息]";
              }
              return messageObj;
            })();

            decryptPromises.push(decryptPromise);
          } else {
            // 非文本消息直接添加
            combinedMessages.push(messageObj);
          }
        } catch (messageError) {
          console.error("处理单条消息失败:", messageError);
          // 继续处理下一条消息
        }
      });

      // 等待所有解密操作完成
      try {
        const decryptedMessages = await Promise.all(decryptPromises);
        combinedMessages.push(...decryptedMessages);
      } catch (decryptError) {
        console.error("批量解密消息失败:", decryptError);
        // 尝试逐个解密
        for (const promise of decryptPromises) {
          try {
            const result = await promise;
            combinedMessages.push(result);
          } catch (e) {
            console.error("单条消息解密失败:", e);
          }
        }
      }
    }

    // 处理活动日志
    if (activitySnapshot && activitySnapshot.exists()) {
      activitySnapshot.forEach((logSnapshot) => {
        try {
          combinedMessages.push({
            id: `system_${logSnapshot.key}`,
            messageContent: logSnapshot.val().details || "",
            senderId: logSnapshot.val().userId || "system",
            createdAt: logSnapshot.val().timestamp || 0,
            messageType: "system",
            reactions: {},
            isActivityLog: true,
          });
        } catch (logError) {
          console.error("处理活动日志失败:", logError);
          // 继续处理下一条日志
        }
      });
    }

    // 按时间排序
    combinedMessages.sort((a, b) => a.createdAt - b.createdAt);

    setCache(cacheKey, combinedMessages);

    return combinedMessages;
  } catch (error) {
    console.error("处理消息总体失败:", error);
    return []; // 返回空数组避免UI错误
  }
};

// 获取当前登录用户
const getCurrentUser = async () => {
  if (process.client) {
    try {
      // 如果已经有用户登录，直接返回
      if (auth.currentUser) {
        return auth.currentUser.uid;
      }

      // 等待 auth 状态就绪
      return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe(); // 取消监听
          resolve(user ? user.uid : null);
        });
      });
    } catch (error) {
      console.error("获取当前用户失败:", error);
      return null;
    }
  }
  return null;
};

// 添加反应到消息
export const addReaction = async (chatroomId, messageId, emojiId) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("用户未登录");
    }

    const messageRef = dbRef(
      db,
      `chatrooms/${chatroomId}/messages/${messageId}`
    );
    const messageSnapshot = await get(
      dbRef(db, `chatrooms/${chatroomId}/messages`)
    );

    if (!messageSnapshot.exists()) {
      throw new Error("消息不存在");
    }

    const message = messageSnapshot.val();
    const reactions = message.reactions || {};

    // 如果用户已经对这个表情反应过，则移除反应
    if (reactions[emojiId] && reactions[emojiId][currentUser]) {
      delete reactions[emojiId][currentUser];
      // 如果表情下没有用户了，删除整个表情对象
      if (Object.keys(reactions[emojiId]).length === 0) {
        delete reactions[emojiId];
      }
    } else {
      // 添加新的反应
      if (!reactions[emojiId]) {
        reactions[emojiId] = {};
      }

      reactions[emojiId][currentUser] = true;
    }

    // 更新消息
    await update(messageRef, {
      reactions,
      lastUpdated: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("添加反应失败:", error);
    throw error;
  }
};

// 实时监听封装函数
export const setupMessagesListener = async (
  groupId,
  callback,
  loadMore = false,
  lastTimestamp = null
) => {
  try {
    // 获取当前用户
    const currentUserId = await getCurrentUser();
    if (!currentUserId) {
      throw new Error("用户未登录");
    }

    try {
      await initializeRatchet(currentUserId, groupId);

      // 获取群组成员，为每个成员初始化私聊棘轮状态
      const members = await getChatroomMembers(groupId);
      for (const member of members) {
        if (member.id !== currentUserId) {
          try {
            await initializeRatchet(currentUserId, groupId, member.id);
          } catch (memberError) {
            console.warn(
              `初始化与成员 ${member.id} 的棘轮状态失败:`,
              memberError
            );
          }
        }
      }
    } catch (ratchetError) {
      console.warn("预初始化棘轮状态失败:", ratchetError);
      // 继续执行，不阻止消息加载
    }
    let joinedAt = 0;
    const userJoinedRef = dbRef(
      db,
      `chatroom_users/${groupId}/${currentUserId}/joinedAt`
    );
    const joinedAtSnapshot = await get(userJoinedRef);
    if (joinedAtSnapshot.exists()) {
      // Check snapshot, not the ref
      joinedAt = joinedAtSnapshot.val();
    }

    // 构建消息查询
    let messagesQuery;
    if (loadMore && lastTimestamp) {
      const startTimestamp = Math.max(lastTimestamp, joinedAt - 1);
      messagesQuery = query(
        dbRef(db, `chatrooms/${groupId}/messages`),
        orderByChild("createdAt"),
        startAt(startTimestamp),
        limitToLast(100)
      );
    } else {
      messagesQuery = query(
        dbRef(db, `chatrooms/${groupId}/messages`),
        orderByChild("createdAt"),
        startAt(joinedAt - 1),
        limitToLast(100)
      );
    }

    // 构建活动日志查询
    const activityLogsQuery = query(
      dbRef(db, `chatrooms/${groupId}/activity_logs`),
      orderByChild("timestamp"),
      startAt(joinedAt - 1),
      limitToLast(50)
    );

    // 设置消息监听
    const unsubscribeMessages = onValue(
      messagesQuery,
      async (messagesSnapshot) => {
        try {
          // 获取活动日志快照
          const activitySnapshot = await get(activityLogsQuery);

          // 处理消息和活动日志
          const processedMessages = await processMessages(
            messagesSnapshot,
            activitySnapshot,
            groupId,
            currentUserId
          );

          // 回调处理后的消息
          callback(processedMessages);
        } catch (error) {
          console.error("处理消息时出错:", error);
          callback([]); // 返回空数组避免UI错误
        }
      },
      (error) => {
        console.error("消息监听错误:", error);
        callback([]); // 返回空数组避免UI错误
      }
    );

    const unsubscribeActivityLog = onValue(
      activityLogsQuery,
      async (activitySnapshot) => {
        try {
          // 获取活动日志快照
          const activitySnapshot = await get(activityLogsQuery);

          const messagesSnapshot = await get(messagesQuery);

          // 处理消息和活动日志
          const processedMessages = await processMessages(
            messagesSnapshot,
            activitySnapshot,
            groupId,
            currentUserId
          );

          // 回调处理后的消息
          callback(processedMessages);
        } catch (error) {
          console.error("处理消息时出错:", error);
          callback([]); // 返回空数组避免UI错误
        }
      },
      (error) => {
        console.error("消息监听错误:", error);
        callback([]); // 返回空数组避免UI错误
      }
    );

    // 返回取消订阅函数
    return [unsubscribeMessages, unsubscribeActivityLog];
  } catch (error) {
    console.error("设置消息监听失败:", error);
    // 返回一个空函数作为取消订阅函数，避免调用时出错
    return () => {};
  }
};

// preload 15 groups messages
// preload 15 groups messages (fetch without listening)
export const preload15GroupsMessages = async (
  groupIds // Array of 15 group IDs
) => {
  try {
    const currentUserId = await getCurrentUser();
    if (!currentUserId) {
      throw new Error("用户未登录");
    }

    // Process all groups in parallel
    const fetchPromises = groupIds.map(async (groupId) => {
      try {
        // Initialize ratchet for the group
        await initializeRatchet(currentUserId, groupId);

        // Get group members (optional - remove if not needed for preload)
        const members = await getChatroomMembers(groupId);
        for (const member of members) {
          if (member.id !== currentUserId) {
            try {
              await initializeRatchet(currentUserId, groupId, member.id);
            } catch (memberError) {
              console.warn(
                `初始化与成员 ${member.id} 的棘轮状态失败:`,
                memberError
              );
            }
          }
        }

        // Get joinedAt timestamp
        const userJoinedRef = dbRef(
          db,
          `chatroom_users/${groupId}/${currentUserId}/joinedAt`
        );
        const joinedAtSnapshot = await get(userJoinedRef);
        const joinedAt = joinedAtSnapshot.exists() ? joinedAtSnapshot.val() : 0;

        // Build queries (no pagination for preload)
        const messagesQuery = query(
          dbRef(db, `chatrooms/${groupId}/messages`),
          orderByChild("createdAt"),
          startAt(joinedAt),
          limitToLast(100)
        );

        const activityLogsQuery = query(
          dbRef(db, `chatrooms/${groupId}/activity_logs`),
          orderByChild("timestamp"),
          startAt(joinedAt),
          limitToLast(50)
        );

        // Fetch data (no listeners)
        const [messagesSnapshot, activitySnapshot] = await Promise.all([
          get(messagesQuery),
          get(activityLogsQuery),
        ]);

        // Process messages
        const processedMessages = await processMessages(
          messagesSnapshot,
          activitySnapshot,
          groupId,
          currentUserId
        );

        // Return results for this group
        return { groupId, messages: processedMessages };
      } catch (error) {
        console.error(`预加载群组 ${groupId} 消息失败:`, error);
        return { groupId, messages: [] };
      }
    });

    // Wait for all groups to complete
    //const results = await Promise.all(fetchPromises);

    // Trigger callbacks for each group
    // results.forEach(({ groupId, messages }) => {
    //   callback(groupId, messages);
    // });
  } catch (error) {
    console.error("预加载15个群组消息失败:", error);
    // Trigger empty callbacks for all groups on failure
    groupIds.forEach((groupId) => callback(groupId, []));
  }
};

// 发送消息（带缓存清除和加密）
export const sendMessage = async (chatroomId, messageData) => {
  try {
    // 创建消息数据的副本，以便我们可以修改它
    const processedMessageData = { ...messageData };

    // 获取当前用户
    const currentUserId = await getCurrentUser();

    // 验证发送者身份
    if (!currentUserId) {
      throw new Error("用户未登录");
    }

    if (processedMessageData.senderId !== currentUserId) {
      throw new Error("无权以其他用户身份发送消息");
    }

    // 如果是文本消息，则加密内容
    if (
      processedMessageData.messageType === "text" ||
      !processedMessageData.messageType
    ) {
      try {
        let encryptedContent;

        // 预初始化棘轮状态（如果需要）
        if (processedMessageData.recipientId) {
          // 私聊消息 - 初始化与接收者的棘轮状态
          await initializeRatchet(
            currentUserId,
            chatroomId,
            processedMessageData.recipientId
          );
        } else {
          // 群聊消息 - 初始化群组棘轮状态
          await initializeRatchet(currentUserId, chatroomId);
        }

        // 群聊消息 - 使用群组密钥
        encryptedContent = await encryptMessage(
          processedMessageData.messageContent,
          processedMessageData.senderId,
          chatroomId
        );

        processedMessageData.messageContent = encryptedContent;
      } catch (encryptError) {
        console.error("加密消息失败:", encryptError);
        // 如果加密失败，发送未加密消息
        processedMessageData.messageContent = `[加密失败] ${processedMessageData.messageContent}`;
      }
    }

    const newMessageRef = push(dbRef(db, `chatrooms/${chatroomId}/messages`));
    await set(newMessageRef, {
      ...processedMessageData,
      createdAt: serverTimestamp(),
    });

    try {
    } catch (cacheError) {
      console.error("清除缓存失败:", cacheError);
    }

    return newMessageRef.key;
  } catch (error) {
    console.error("发送消息失败:", error);
    throw error;
  }
};

// 带缓存的聊天室信息获取
export const getChatroomInfo = async (chatroomId) => {
  // const cacheKey = `chatroom:${chatroomId}:info`;
  try {
    const snapshot = await get(dbRef(db, `chatrooms/${chatroomId}`));
    const data = snapshot.exists() ? snapshot.val() : null;

    return data;
  } catch (error) {
    console.error("Error in getChatroomInfo:", error);
    // 直接从数据库获取
    const snapshot = await get(dbRef(db, `chatrooms/${chatroomId}`));
    return snapshot.exists() ? snapshot.val() : null;
  }
};

// 带缓存的成员数据获取
export const getChatroomMembers = async (groupId) => {
  const cacheKey = `chatroom:${groupId}:members`;
  // const cached = await getCache(cacheKey);
  // if (cached) return cached;

  const [chatroomSnapshot, usersSnapshot] = await Promise.all([
    get(dbRef(db, `chatrooms/${groupId}`)),
    get(dbRef(db, `chatroom_users/${groupId}`)),
  ]);

  const membersData = await processMembers(usersSnapshot);

  if (membersData.length > 0) {
    await setCache(cacheKey, membersData, 36000); // 10分钟缓存
  }
  return membersData;
};

// 成员处理逻辑
const processMembers = async (usersSnapshot) => {
  if (!usersSnapshot.exists()) return [];

  const members = [];

  for (const [userId, userData] of Object.entries(usersSnapshot.val())) {
    // 并行获取必要数据
    const [userSnapshot, statusSnapshot, advancedSettingsSnapshot] =
      await Promise.all([
        get(dbRef(db, `users/${userId}`)),
        get(dbRef(db, `users/${userId}/status`)),
        get(dbRef(db, `users/${userId}/advancedSettings`)),
      ]);

    if (!userSnapshot.exists()) continue;

    // 基础公开字段
    const member = {
      id: userId,
      username: userSnapshot.child("username").val() || "",
      isDisband: userData.isDisband || false,
      avatarUrl:
        userSnapshot.child("avatarUrl").val() || "/images/user_avatar.png",
      createdAt: userData.createdAt || null,
      role: userData.role || "user",
      isBanned: userData.isBanned || false,
    };

    // 条件性字段处理
    const advancedSettings = advancedSettingsSnapshot.exists()
      ? advancedSettingsSnapshot.val()
      : {};

    // 1. 邮箱处理
    member.email =
      advancedSettings.showEmail !== false
        ? userSnapshot.child("email").val() || "anonymous"
        : "anonymous";

    // 2. 状态信息处理
    if (
      !Object.keys(advancedSettings).includes("isOnline") ||
      advancedSettings.isOnline
    ) {
      member.status = statusSnapshot.child("state").val() || "offline";
      member.lastActive =
        advancedSettings.showLastActive !== false
          ? statusSnapshot.child("lastActive").val() || null
          : "hidden";
    } else {
      member.status = "hidden";
      member.lastActive = "hidden";
    }

    members.push(member);
  }

  return members;
};

export const setupGroupDataListener = (groupId) => {
  const chatroomInfoRef = dbRef(db, `chatrooms/${groupId}`);
  const chatroomMembersRef = dbRef(db, `chatroom_users/${groupId}`);

  const unsubscribeChatroomInfo = onValue(chatroomInfoRef, async (snapshot) => {
    try {
      const chatroomInfo = snapshot.val();
      if (!chatroomInfo) return null;

      // 处理群组信息更新
      const processedInfo = {
        id: groupId,
        ...chatroomInfo,
      };

      return processedInfo;
    } catch (error) {
      console.error("Error processing chatroom info:", error);
    }
  });

  const unsubscribeChatroomMembers = onValue(
    chatroomMembersRef,
    async (snapshot) => {
      try {
        const members = [];
        snapshot.forEach((childSnapshot) => {
          const member = childSnapshot.val();
          if (member) {
            members.push({
              id: childSnapshot.key,
              ...member,
            });
          }
        });

        return members;
      } catch (error) {
        console.error("Error processing chatroom members:", error);
      }
    }
  );

  return () => {
    unsubscribeChatroomInfo();
    unsubscribeChatroomMembers();
  };
};

//   const members = [];
//   for (const [userId, userData] of Object.entries(usersSnapshot.val())) {
//     const [userSnapshot, statusSnapshot] = await Promise.all([
//       get(dbRef(db, `users/${userId}`)),
//       get(dbRef(db, `users/${userId}/status`)),
//     ]);
//     if (userSnapshot.exists()) {
//       members.push({
//         id: userId,
//         ...userData,
//         avatarUrl: userSnapshot.val().avatarUrl,
//         username: userSnapshot.val().username,
//         status: statusSnapshot.exists()
//           ? statusSnapshot.val().state
//           : "offline",
//         lastActive: statusSnapshot.exists()
//           ? statusSnapshot.val().lastActive
//           : null,
//       });
//     }
//   }

//   return members;
// };

// 消息计数器和密钥轮换
const MESSAGE_COUNTER_LIMIT = 1000; // 每个密钥最多加密1000条消息

// 增加并获取消息计数器
const incrementMessageCounter = async (userId) => {
  if (process.client) {
    try {
      const counterRef = dbRef(db, `users/${userId}/keys/message_counter`);
      const snapshot = await get(counterRef);

      let counter = 1;
      if (snapshot.exists()) {
        counter = snapshot.val() + 1;
      }

      await set(counterRef, counter);

      // 如果计数器超过限制，轮换密钥
      if (counter >= MESSAGE_COUNTER_LIMIT) {
        //await rotateUserPrivateKey(userId);
      }

      return counter;
    } catch (error) {
      console.error("更新消息计数器失败:", error);
      return 0;
    }
  }
  return 0;
};

// 轮换用户私钥
const rotateUserPrivateKey = async (userId) => {
  if (process.client) {
    try {
      // 生成新的私钥
      const newPrivateKey = CryptoJS.lib.WordArray.random(32).toString();

      // 使用用户UID派生的密钥加密私钥
      const derivedKey = CryptoJS.PBKDF2(userId, "user-key-salt", {
        keySize: 256 / 32,
        iterations: 10000,
      });

      const encryptedKey = CryptoJS.AES.encrypt(
        newPrivateKey,
        derivedKey.toString()
      ).toString();

      // 存储新的加密私钥
      const userKeyRef = dbRef(db, `users/${userId}/keys`);
      await set(userKeyRef, {
        private_key: encryptedKey,
        message_counter: 0,
        last_rotation: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("轮换用户私钥失败:", error);
      return false;
    }
  }
  return false;
};

// 添加一个函数来解密最后一条消息
export const decryptLastMessage = async (
  encryptedMessage,
  senderId,
  chatroomId
) => {
  if (!encryptedMessage) return "";

  try {
    // 获取当前用户ID
    const currentUserId = await getCurrentUser();
    if (!currentUserId) {
      return "[加密消息]";
    }

    // 尝试解析JSON
    let encryptedPackage;
    try {
      encryptedPackage = JSON.parse(encryptedMessage);
    } catch (parseError) {
      // 如果不是JSON格式，可能是旧版本的加密消息或未加密消息
      return encryptedMessage;
    }

    // 提取加密组件
    const { cipher, iv, mac, type, messageNumber } = encryptedPackage;

    // 确定接收者ID
    const recipientId = type === "private" ? senderId : null;

    // 初始化或获取棘轮状态
    const ratchetState = await initializeRatchet(
      currentUserId,
      chatroomId,
      recipientId
    );

    if (!ratchetState) {
      return "[加密消息]";
    }

    // 获取消息密钥
    let messageKey = await updateReceivingChain(
      ratchetState,
      currentUserId,
      chatroomId,
      messageNumber,
      senderId
    );

    // 如果加密包中包含加密的密钥，尝试解密
    if (encryptedPackage.encryptedKey) {
      try {
        const decryptedKey = CryptoJS.AES.decrypt(
          encryptedPackage.encryptedKey,
          ratchetState.rootKey
        ).toString(CryptoJS.enc.Utf8);

        if (decryptedKey) {
          messageKey = decryptedKey;
        }
      } catch (e) {
        console.error("解密密钥失败:", e);
      }
    }

    // 获取当前用户的群组加密密钥
    const userGroupEncryptKey = await getUserGroupEncryptKey(
      currentUserId,
      chatroomId
    );

    // 获取当前用户的私钥
    const userPrivateKey = await getUserPrivateKey(currentUserId);
    if (!userPrivateKey) {
      throw new Error("无法获取用户私钥");
    }

    // 使用私钥解密群组加密密钥
    const groupKey = CryptoJS.AES.decrypt(
      userGroupEncryptKey,
      userPrivateKey
    ).toString(CryptoJS.enc.Utf8);

    // 使用群组密钥和消息密钥的组合进行解密
    const combinedKey = CryptoJS.SHA256(`${groupKey}:${messageKey}`).toString();

    // 解密消息
    try {
      // 解析 IV
      const ivParsed = CryptoJS.enc.Base64.parse(iv);

      // 使用组合密钥解密
      const decrypted = CryptoJS.AES.decrypt(cipher, combinedKey, {
        iv: ivParsed,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // 转换为字符串
      const messageText = decrypted.toString(CryptoJS.enc.Utf8);
      if (!messageText) {
        return "[加密消息]";
      }

      // 验证 HMAC - 使用解密后的原始消息内容
      if (mac) {
        const computedHmac = CryptoJS.HmacSHA256(
          messageText,
          combinedKey
        ).toString(CryptoJS.enc.Base64);

        if (computedHmac !== mac) {
          console.error("HMAC 验证失败", {
            computed: computedHmac,
            received: mac,
            messageText,
            combinedKey,
          });
          return "[加密消息]";
        }
      }

      // 解析 JSON
      const messageObj = JSON.parse(messageText);
      if (!messageObj || !messageObj.content) {
        return "[加密消息]";
      }

      return messageObj.content;
    } catch (decryptError) {
      console.error("解密最后一条消息失败:", decryptError);
      return "[加密消息]";
    }
  } catch (error) {
    console.error("处理最后一条消息失败:", error);
    return "[加密消息]";
  }
};

// 修改 getUserChatrooms 函数，自动解密最后一条消息
export const getUserChatrooms = async (userId) => {
  try {
    const userChatroomsRef = dbRef(db, `user_chatrooms/${userId}`);
    const snapshot = await get(userChatroomsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const chatroomPromises = [];

    snapshot.forEach((childSnapshot) => {
      const chatroomId = childSnapshot.key;
      const chatroomPromise = (async () => {
        try {
          const chatroomSnapshot = await get(
            dbRef(db, `chatrooms/${chatroomId}`)
          );

          if (!chatroomSnapshot.exists()) {
            return null;
          }

          const chatroomData = chatroomSnapshot.val();

          // 获取最后一条消息
          let lastMessage = null;
          if (chatroomData.lastMessage) {
            // 解密最后一条消息
            const decryptedContent = await decryptLastMessage(
              chatroomData.lastMessage.messageContent,
              chatroomData.lastMessage.senderId,
              chatroomId
            );

            lastMessage = {
              ...chatroomData.lastMessage,
              messageContent: decryptedContent,
            };
          }

          return {
            id: chatroomId,
            name: chatroomData.name,
            photoUrl: chatroomData.photoUrl,
            type: chatroomData.type,
            lastMessage: lastMessage,
            unreadCount: childSnapshot.val().unreadCount || 0,
            timestamp: lastMessage ? lastMessage.createdAt : 0,
          };
        } catch (error) {
          console.error(`获取聊天室 ${chatroomId} 信息失败:`, error);
          return null;
        }
      })();

      chatroomPromises.push(chatroomPromise);
    });

    const chatrooms = (await Promise.all(chatroomPromises)).filter(Boolean);

    // 按最后消息时间排序
    return chatrooms.sort((a, b) => {
      const timeA = a.lastMessage ? a.lastMessage.createdAt : 0;
      const timeB = b.lastMessage ? b.lastMessage.createdAt : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("获取用户聊天室列表失败:", error);
    return [];
  }
};

// 修改 getGroupList 函数，自动解密最后一条消息
export const getGroupList = async (userId) => {
  try {
    const userGroupsRef = dbRef(db, `user_groups/${userId}`);
    const snapshot = await get(userGroupsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const groupPromises = [];

    snapshot.forEach((childSnapshot) => {
      const groupId = childSnapshot.key;
      const groupPromise = (async () => {
        try {
          const groupSnapshot = await get(dbRef(db, `groups/${groupId}`));

          if (!groupSnapshot.exists()) {
            return null;
          }

          const groupData = groupSnapshot.val();

          // 获取最后一条消息
          let lastMessage = null;
          if (groupData.lastMessage) {
            // 解密最后一条消息
            const decryptedContent = await decryptLastMessage(
              groupData.lastMessage.messageContent,
              groupData.lastMessage.senderId,
              groupId
            );

            lastMessage = {
              ...groupData.lastMessage,
              messageContent: decryptedContent,
            };
          }

          return {
            id: groupId,
            name: groupData.name,
            photoUrl: groupData.photoUrl,
            description: groupData.description,
            memberCount: groupData.memberCount || 0,
            lastMessage: lastMessage,
            unreadCount: childSnapshot.val().unreadCount || 0,
            timestamp: lastMessage ? lastMessage.createdAt : 0,
          };
        } catch (error) {
          console.error(`获取群组 ${groupId} 信息失败:`, error);
          return null;
        }
      })();

      groupPromises.push(groupPromise);
    });

    const groups = (await Promise.all(groupPromises)).filter(Boolean);

    // 按最后消息时间排序
    return groups.sort((a, b) => {
      const timeA = a.lastMessage ? a.lastMessage.createdAt : 0;
      const timeB = b.lastMessage ? b.lastMessage.createdAt : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("获取用户群组列表失败:", error);
    return [];
  }
};

// Add this new function to encrypt file URLs
export const encryptFileUrl = async (
  fileUrl,
  senderId,
  chatroomId,
  recipientId = null
) => {
  try {
    // Use the existing encryptWithRatchet function
    return await encryptWithRatchet(
      // Create a JSON object with the file URL as content
      JSON.stringify({ content: fileUrl }),
      senderId,
      chatroomId,
      recipientId
    );
  } catch (error) {
    console.error("Error encrypting file URL:", error);
    throw new Error("Failed to encrypt file URL");
  }
};

// 新增函数：处理文件上传后的加密和保存
export const handleFileUploadResponse = async (
  uploadResponse,
  chatroomId,
  senderId,
  messageType = "file"
) => {
  try {
    if (
      !uploadResponse ||
      !uploadResponse.files ||
      !uploadResponse.files.length
    ) {
      throw new Error("无效的上传响应");
    }

    if (!auth.currentUser) {
      throw new Error("no authenticated");
    }

    // 获取上传后的文件 URL
    const fileUrl = uploadResponse.files[0];

    // 加密文件 URL
    const encryptedFileUrl = await encryptFileUrl(
      fileUrl,
      senderId,
      chatroomId,
      null // 群组消息
    );

    // 创建消息引用
    const chatroomRef = dbRef(db, `chatrooms/${chatroomId}/messages`);
    const newMessageRef = push(chatroomRef);

    // 设置消息数据
    await set(newMessageRef, {
      senderId,
      messageContent: encryptedFileUrl,
      messageType,
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      messageId: newMessageRef.key,
      originalUrl: fileUrl,
    };
  } catch (error) {
    console.error("处理文件上传响应失败:", error);
    throw error;
  }
};

// 添加文件 URL 解密函数
export const decryptFileUrl = async (encryptedUrl, senderId, chatroomId) => {
  try {
    // 从 Realtime Database 中获取的是加密后的消息内容
    const decryptedContent = await decryptWithRatchet(
      encryptedUrl,
      senderId,
      chatroomId,
      await getCurrentUser()
    );

    return decryptedContent;
  } catch (error) {
    console.error("解密文件URL失败:", error);
    return encryptedUrl; // 如果解密失败，返回原始URL
  }
};

// 修改 fetchAndDecryptFile 函数，使用服务器端解密
export const fetchAndDecryptFile = async (
  url,
  userId,
  chatroomId,
  mimeType,
  requireBlob = false
) => {
  try {
    // 使用服务器端API代理来获取文件内容，避免CORS问题
    const user = auth.currentUser;
    if (!user) {
      throw new Error("用户未认证");
    }

    // 获取 ID token 用于服务器认证
    const idToken = await user.getIdToken();

    // 请求服务器API获取文件 - 服务器会处理解密
    const response = await fetch("/api/fetchFile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        url,
        userId,
        chatroomId,
        mimeType,
      }),
    });

    // 检查响应状态
    if (!response.ok) {
      // 尝试从响应中解析详细错误
      let errorMessage = "获取文件失败";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // 如果响应不是JSON，使用状态文本
        errorMessage = `获取文件失败: ${response.statusText}`;
      }
      console.error(`File fetch error: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // 获取Content-Type
    const contentType =
      response.headers.get("Content-Type") ||
      mimeType ||
      "application/octet-stream";

    // 获取解密后的文件数据作为 Blob
    const fileBlob = new Blob([await response.arrayBuffer()], {
      type: contentType,
    });

    // 创建临时 URL
    const objectUrl = URL.createObjectURL(fileBlob);

    // 返回临时URL用于预览或下载
    if (requireBlob) return { fileUrl: objectUrl, decryptedBlob: fileBlob };
    return objectUrl;
  } catch (error) {
    console.error("获取并解密文件失败:", error);
    throw error;
  }
};

export const decryptFile = async (encryptedFileArrayBuffer, chatroomId) => {
  try {
    // 文件的前16字节是 IV
    const encryptedData = new Uint8Array(encryptedFileArrayBuffer);
    const iv = encryptedData.slice(0, 16);
    const encryptedContent = encryptedData.slice(16);

    // 直接获取群组密钥（不再需要用户特定的密钥）
    const groupKeyRef = dbRef(
      db,
      `chatrooms/${chatroomId}/encryption/group_key`
    );
    const groupKeySnapshot = await get(groupKeyRef);

    if (!groupKeySnapshot.exists()) {
      throw new Error("群组加密密钥不存在");
    }

    const rawGroupKey = groupKeySnapshot.val();

    // 处理密钥格式，与加密逻辑保持一致
    const keyBufferUtf8 = Buffer.from(
      CryptoJS.enc.Utf8.parse(rawGroupKey).toString(CryptoJS.enc.Hex),
      "hex"
    );

    // 如果密钥长度不是32字节，使用SHA-256生成32字节密钥
    const groupKey =
      keyBufferUtf8.length !== 32
        ? Buffer.from(
            CryptoJS.SHA256(rawGroupKey).toString(CryptoJS.enc.Hex),
            "hex"
          ).slice(0, 32)
        : keyBufferUtf8;

    // 使用 crypto-js 进行解密
    const wordArray = CryptoJS.lib.WordArray.create(encryptedContent);
    const ivWordArray = CryptoJS.lib.WordArray.create(iv);

    // 使用相同的密钥格式和编码方式
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: wordArray },
      CryptoJS.enc.Hex.parse(groupKey.toString("hex")),
      {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    // 转换回 ArrayBuffer
    const decryptedLength = decrypted.sigBytes;
    const decryptedBuffer = new ArrayBuffer(decryptedLength);
    const decryptedView = new DataView(decryptedBuffer);

    const words = decrypted.words;
    for (let i = 0; i < decryptedLength; i += 4) {
      const word = words[i / 4];
      for (let j = 0; j < 4 && i + j < decryptedLength; j++) {
        decryptedView.setUint8(i + j, (word >> (24 - j * 8)) & 0xff);
      }
    }

    return decryptedBuffer;
  } catch (error) {
    console.error("解密文件失败:", error);
    throw error;
  }
};

// 过滤掉空的反应并统一类型
function filterAndNormalizeReactions(reactions) {
  // 过滤掉空的反应
  const filteredReactions = Object.entries(reactions).filter(([key, value]) => {
    return value && Object.keys(value).length > 0; // 只保留非空的反应
  });

  // 统一反应类型
  const normalizedReactions = {};
  filteredReactions.forEach(([emojiId, users]) => {
    normalizedReactions[emojiId] = Object.keys(users); // 统计每个反应的数量
  });

  return normalizedReactions;
}
