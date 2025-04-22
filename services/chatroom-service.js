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

let BASE_ENCRYPTION_KEY = null;

const KEY_CACHE = new Map();
const MAX_KEY_VERSIONS = 30;

const userRatchetStates = new Map();

class RatchetState {
  constructor(rootKey) {
    this.rootKey = rootKey;
    this.sendingChainKey = null;
    this.receivingChainKey = null;
    this.messageKeyCache = new Map();
    this.messageCounter = 0;
    this.previousMessageKeys = [];
    this.maxStoredMessageKeys = 100; // store up to 100 previous message keys
    this.lastSyncTime = Date.now(); // add sync timestamp

    // restore state from cache
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

  // serialize state for caching
  serialize() {
    return {
      rootKey: this.rootKey,
      sendingChainKey: this.sendingChainKey,
      receivingChainKey: this.receivingChainKey,
      messageCounter: this.messageCounter,
      lastSyncTime: this.lastSyncTime,
    };
  }

  // deserialize state from cache
  deserialize(state) {
    if (!state) return;
    this.sendingChainKey = state.sendingChainKey;
    this.receivingChainKey = state.receivingChainKey;
    this.messageCounter = state.messageCounter;
    this.lastSyncTime = state.lastSyncTime;
  }

  // check if state needs sync
  needsSync(threshold = 300000) {
    // default 5 minutes, reduce unnecessary syncs
    return Date.now() - this.lastSyncTime > threshold;
  }

  // mark state as synced
  markSynced() {
    this.lastSyncTime = Date.now();
  }

  // reset state
  reset() {
    this.messageKeyCache.clear();
    this.previousMessageKeys = [];
    this.messageCounter = 0;
    this.markSynced();
    // trigger client cache update
    if (typeof window !== "undefined") {
      import("@/utils/client-cache").then(({ setCache }) => {
        const cacheKey = `ratchet_state_${this.rootKey}`;
        setCache(cacheKey, this.serialize(), 36000);
      });
    }
  }
}

const deriveKey = (salt, userId, chatroomId, iterations = 10000) => {
  if (!BASE_ENCRYPTION_KEY) {
    throw new Error("encryption key not initialized");
  }

  const keyMaterial = `${BASE_ENCRYPTION_KEY}-${userId}-${chatroomId}`;

  return CryptoJS.PBKDF2(keyMaterial, salt, {
    keySize: 256 / 32,
    iterations: iterations,
    hasher: CryptoJS.algo.SHA256,
  }).toString();
};

const getCurrentKeyVersion = () => {
  const now = new Date();
  // format: YYYY-MM (e.g. 2023-05)
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

// initialize ratchet state for user and chatroom
const initializeRatchet = async (userId, chatroomId, recipientId = null) => {
  const stateKey = recipientId
    ? `${userId}:${chatroomId}:${recipientId}`
    : `${userId}:${chatroomId}`;

  if (userRatchetStates.has(stateKey)) {
    return userRatchetStates.get(stateKey);
  }

  try {
    const userPrivateKey = await getUserPrivateKey(userId);

    if (!userPrivateKey) {
      throw new Error("unable to get user private key");
    }

    let rootKey;

    if (recipientId) {
      // private chat - use both user IDs and chatroom ID to generate root key
      const salt = CryptoJS.enc.Utf8.parse(
        `${userId}:${recipientId}:${chatroomId}`
      );
      rootKey = CryptoJS.PBKDF2(userPrivateKey, salt, {
        keySize: 256 / 32,
        iterations: 10000,
      }).toString();

      const ratchetRef = dbRef(
        db,
        `users/${userId}/ratchets/${chatroomId}/${recipientId}`
      );
      const snapshot = await get(ratchetRef);

      if (snapshot.exists()) {
        const storedState = snapshot.val();
        const ratchetState = new RatchetState(rootKey);
        ratchetState.sendingChainKey = storedState.sendingChainKey;
        ratchetState.receivingChainKey = storedState.receivingChainKey;
        ratchetState.messageCounter = storedState.messageCounter || 0;

        userRatchetStates.set(stateKey, ratchetState);
        return ratchetState;
      }
    } else {
      const { useRuntimeConfig } = await import("#app");
      const config = useRuntimeConfig();
      const systemKey = config.public.baseEncryptionKey;

      const groupKeyRef = dbRef(
        db,
        `chatrooms/${chatroomId}/encryption/group_key`
      );
      const snapshot = await get(groupKeyRef);

      if (snapshot.exists()) {
        const encryptedGroupKey = snapshot.val();
        rootKey = CryptoJS.AES.decrypt(encryptedGroupKey, systemKey).toString(
          CryptoJS.enc.Utf8
        );

        const userGroupKeyRef = dbRef(
          db,
          `chatrooms/${chatroomId}/encryption/${userId}/privatekey`
        );
        const userGroupKeySnapshot = await get(userGroupKeyRef);

        if (!userGroupKeySnapshot.exists()) {
          // if user has no group encryption key, generate and store using group key and user private key
          const userPrivateKey = await getUserPrivateKey(userId);
          const userGroupEncryptKey = CryptoJS.AES.encrypt(
            rootKey,
            userPrivateKey
          ).toString();

          // store user's group encryption key
          await set(userGroupKeyRef, userGroupEncryptKey);
        }
      } else {
        // if not exists, create new group key
        rootKey = CryptoJS.lib.WordArray.random(32).toString();
        // encrypt group key using system key
        const encryptedGroupKey = CryptoJS.AES.encrypt(
          rootKey,
          systemKey
        ).toString();
        // save encrypted group key
        await set(groupKeyRef, encryptedGroupKey);

        const userGroupKeyRef = dbRef(
          db,
          `chatrooms/${chatroomId}/encryption/${userId}/privatekey`
        );
        const userGroupKeySnapshot = await get(userGroupKeyRef);

        if (!userGroupKeySnapshot.exists()) {
          // if user has no group encryption key, generate and store using group key and user private key
          const userPrivateKey = await getUserPrivateKey(userId);
          const userGroupEncryptKey = CryptoJS.AES.encrypt(
            rootKey,
            userPrivateKey
          ).toString();

          // store user's group encryption key
          await set(userGroupKeyRef, userGroupEncryptKey);
        }
      }

      // check if stored ratchet state exists
      const ratchetRef = dbRef(
        db,
        `users/${userId}/ratchets/${chatroomId}/group`
      );
      const ratchetSnapshot = await get(ratchetRef);

      if (ratchetSnapshot.exists()) {
        // restore stored ratchet state
        const storedState = ratchetSnapshot.val();
        const ratchetState = new RatchetState(rootKey);
        ratchetState.sendingChainKey = storedState.sendingChainKey;
        ratchetState.receivingChainKey = storedState.receivingChainKey;
        ratchetState.messageCounter = storedState.messageCounter || 0;

        userRatchetStates.set(stateKey, ratchetState);
        return ratchetState;
      }
    }

    // if no existing state, create new ratchet state
    const ratchetState = new RatchetState(rootKey);

    // initialize sending chain key
    const sendingSalt = CryptoJS.enc.Utf8.parse(
      `sending:${userId}:${chatroomId}`
    );
    ratchetState.sendingChainKey = CryptoJS.HmacSHA256(
      rootKey,
      sendingSalt
    ).toString();

    // save ratchet state to database
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

    // cache ratchet state
    userRatchetStates.set(stateKey, ratchetState);

    return ratchetState;
  } catch (error) {
    console.error("initialize ratchet state failed:", error);
    return null;
  }
};

// update sending chain with new message key
const updateSendingChain = async (
  ratchetState,
  userId,
  chatroomId,
  recipientId
) => {
  try {
    // increment message counter
    const messageCounter = await incrementMessageCounter(userId);

    // use a simpler, more consistent method to derive message key
    const messageKey = CryptoJS.SHA256(
      `${ratchetState.rootKey}:${messageCounter}:${userId}:${chatroomId}`
    ).toString();

    // update ratchet state
    ratchetState.messageCounter = messageCounter;

    // update ratchet state in database
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
      console.error("update sending chain failed:", error);
    }

    return messageKey;
  } catch (error) {
    console.error("update sending chain error:", error);
    return null;
  }
};

// update receiving chain with new message key
const updateReceivingChain = async (
  ratchetState,
  userId,
  chatroomId,
  messageNumber,
  senderId
) => {
  try {
    // use the same method as sender to derive message key
    const messageKey = CryptoJS.SHA256(
      `${ratchetState.rootKey}:${messageNumber}:${senderId}:${chatroomId}`
    ).toString();

    // update ratchet state
    ratchetState.messageCounter = messageNumber + 1;

    // update ratchet state in database
    try {
      const recipientId = senderId; // in reception, sender is our receiver
      const updatePath = recipientId
        ? `users/${userId}/ratchets/${chatroomId}/${recipientId}`
        : `users/${userId}/ratchets/${chatroomId}/group`;

      await update(dbRef(db, updatePath), {
        messageCounter: ratchetState.messageCounter,
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error("update receiving chain failed:", error);
    }

    return messageKey;
  } catch (error) {
    console.error("update receiving chain error:", error);
    return null;
  }
};

// get user's group encryption key
const getUserGroupEncryptKey = async (userId, chatroomId) => {
  try {
    const userGroupKeyRef = dbRef(
      db,
      `chatrooms/${chatroomId}/encryption/${userId}/privatekey`
    );
    return await get(userGroupKeyRef);
  } catch (error) {
    console.error("get user group encryption key failed:", error);
    throw error;
  }
};

// encrypt message using ratchet protocol
const encryptWithRatchet = async (
  message,
  senderId,
  chatroomId,
  recipientId = null
) => {
  if (!message) return "";

  try {
    // initialize or get ratchet state
    const ratchetState = await initializeRatchet(
      senderId,
      chatroomId,
      recipientId
    );

    if (!ratchetState) {
      throw new Error("unable to initialize ratchet state");
    }

    // update sending chain and get message key
    const messageKey = await updateSendingChain(
      ratchetState,
      senderId,
      chatroomId,
      recipientId
    );

    if (!messageKey) {
      throw new Error("unable to generate message key");
    }

    // get sending group encryption key
    const userGroupEncryptKey = await getUserGroupEncryptKey(
      senderId,
      chatroomId
    );

    // get sending user private key
    const userPrivateKey = await getUserPrivateKey(senderId);
    if (!userPrivateKey) {
      throw new Error("unable to get user private key");
    }

    // decrypt group encryption key using private key
    const groupKey = CryptoJS.AES.decrypt(
      userGroupEncryptKey,
      userPrivateKey
    ).toString(CryptoJS.enc.Utf8);

    // generate random initialization vector (IV)
    const iv = CryptoJS.lib.WordArray.random(16);

    // current timestamp
    const timestamp = Date.now();

    // message object
    const messageObj = {
      content: message,
      timestamp: timestamp,
      sender: senderId,
    };

    // serialize message object
    const messageString = JSON.stringify(messageObj);

    // use group key and message key combination for encryption
    const combinedKey = CryptoJS.SHA256(`${groupKey}:${messageKey}`).toString();

    // use combined key to encrypt message
    const encrypted = CryptoJS.AES.encrypt(messageString, combinedKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // add HMAC for message authentication - use original message content to generate HMAC
    const hmac = CryptoJS.HmacSHA256(messageString, combinedKey).toString(
      CryptoJS.enc.Base64
    );

    // encrypted package
    const encryptedPackage = {
      cipher: encrypted.toString(),
      iv: iv.toString(CryptoJS.enc.Base64),
      mac: hmac,
      version: 3,
      type: recipientId ? "private" : "group",
      messageNumber: ratchetState.messageCounter,
      // use receiver's public key to encrypt message key
      encryptedKey: CryptoJS.AES.encrypt(
        messageKey,
        ratchetState.rootKey
      ).toString(),
    };

    return JSON.stringify(encryptedPackage);
  } catch (error) {
    console.error("encrypt message failed:", error);
    return `[encrypt failed] ${message}`;
  }
};

// decrypt message using ratchet protocol
const decryptWithRatchet = async (
  encryptedMessage,
  senderId,
  chatroomId,
  currentUserId,
  recursionDepth = 0
) => {
  if (!encryptedMessage) return "";

  if (!currentUserId) {
    return "[encrypted message]";
  }

  try {
    // parse encrypted package
    const encryptedPackage = JSON.parse(encryptedMessage);

    // check if it's encrypted message using ratchet protocol
    if (encryptedPackage.version !== 3) {
      return "[non-ratchet encrypted message]";
    }

    // extract encrypted components
    const { cipher, iv, mac, type, messageNumber } = encryptedPackage;

    // determine receiver ID
    const recipientId = type === "private" ? senderId : null;

    // initialize or get ratchet state
    const ratchetState = await initializeRatchet(
      currentUserId,
      chatroomId,
      recipientId
    );

    if (!ratchetState) {
      console.error("ratchet state initialization failed");
      throw new Error("unable to initialize ratchet state");
    }

    // get message key
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
        console.error("decrypt message key failed", e);
      }
    }

    // get current user group encryption key
    const userGroupEncryptKey = await getUserGroupEncryptKey(
      currentUserId,
      chatroomId
    );

    // get current user private key
    const userPrivateKey = await getUserPrivateKey(currentUserId);
    if (!userPrivateKey) {
      throw new Error("unable to get user private key");
    }

    // decrypt group encryption key using private key
    const groupKey = CryptoJS.AES.decrypt(
      userGroupEncryptKey,
      userPrivateKey
    ).toString(CryptoJS.enc.Utf8);

    // use group key and message key combination for decryption
    const combinedKey = CryptoJS.SHA256(`${groupKey}:${messageKey}`).toString();

    // decrypt message
    const decrypted = CryptoJS.AES.decrypt(cipher, combinedKey, {
      iv: CryptoJS.enc.Base64.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // parse decrypted message
    const decryptedMessage = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));

    // verify HMAC
    const computedHmac = CryptoJS.HmacSHA256(
      JSON.stringify(decryptedMessage),
      combinedKey
    ).toString(CryptoJS.enc.Base64);

    if (computedHmac !== mac) {
      throw new Error("message authentication failed");
    }

    return decryptedMessage.content;
  } catch (error) {
    console.error("decrypt message failed:", error);
    return "[decrypt failed]";
  }
};

// encrypt message with fallback to basic encryption
const encryptMessage = async (
  message,
  senderId,
  chatroomId,
  recipientId = null
) => {
  if (!message) return "";

  try {
    // try to use ratchet protocol encryption
    return await encryptWithRatchet(message, senderId, chatroomId, recipientId);
  } catch (error) {
    console.error(
      "ratchet encryption failed, fallback to basic encryption:",
      error
    );

    // fallback to basic encryption method
    try {
      // get current version number (based on month)
      const currentVersion = getCurrentKeyVersion();

      // ensure we have current version key
      //BASE_ENCRYPTION_KEY = await getEncryptionKeyForVersion(currentVersion);

      if (!BASE_ENCRYPTION_KEY) {
        throw new Error("unable to get encryption key");
      }

      // generate random initialization vector (IV)
      const iv = CryptoJS.lib.WordArray.random(16);

      // current timestamp
      const timestamp = Date.now();

      // message object
      const messageObj = {
        content: message,
        timestamp: timestamp,
        sender: senderId,
      };

      // serialize message object
      const messageString = JSON.stringify(messageObj);

      // get encryption key
      let encryptionKey;
      if (recipientId) {
        // private chat message - use receiver specific key
        const salt = CryptoJS.enc.Utf8.parse(recipientId);
        encryptionKey = deriveKey(salt, senderId, chatroomId);
      } else {
        // group chat message - use group key
        const salt = CryptoJS.enc.Utf8.parse(`group:${chatroomId}`);
        encryptionKey = deriveKey(salt, senderId, chatroomId);
      }

      // use AES-CBC mode encryption
      const encrypted = CryptoJS.AES.encrypt(messageString, encryptionKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // add HMAC for message authentication
      const hmac = CryptoJS.HmacSHA256(encrypted.toString(), encryptionKey);

      // include version information in encrypted package
      const encryptedPackage = {
        cipher: encrypted.toString(),
        iv: iv.toString(CryptoJS.enc.Base64),
        mac: hmac.toString(CryptoJS.enc.Base64),
        version: 1, // basic encryption version
        keyVersion: currentVersion, // key version (month format)
        type: recipientId ? "private" : "group",
      };

      return JSON.stringify(encryptedPackage);
    } catch (fallbackError) {
      console.error("basic encryption also failed:", fallbackError);
      return `[encrypt failed] ${message}`;
    }
  }
};

// get chatroom members synchronously
const getChatroomMembersSync = (chatroomId) => {
  const cacheKey = `chatroom:${chatroomId}:members`;
  const cached = getCache(cacheKey);

  // ensure return an array
  if (cached && Array.isArray(cached)) {
    return cached;
  }

  // if cache does not exist or not an array, return empty array
  return [];
};

// process messages and activity logs
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

    // process messages
    if (messagesSnapshot && messagesSnapshot.exists()) {
      const decryptPromises = [];

      messagesSnapshot.forEach((childSnapshot) => {
        try {
          const message = childSnapshot.val();
          const messageTimestamp = message.createdAt || 0;

          // create message object

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

          // check if cached message exists
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

          // process reaction data
          const reactions = message.reactions || {};
          const reactionCounts = {};
          Object.entries(reactions).forEach(([emojiId, users]) => {
            reactionCounts[emojiId] = Object.keys(users).length;
          });
          messageObj.reactionCounts = reactionCounts;
          messageObj.hasReacted = Object.entries(reactions).some(([_, users]) =>
            Object.keys(users).includes(currentUserId)
          );

          // only decrypt text messages
          if (
            (message.messageType === "text" ||
              message.messageType === "file" ||
              !message.messageType) &&
            message.messageContent
          ) {
            // create decrypt promise
            const decryptPromise = (async () => {
              try {
                // try to decrypt message
                const decrypted = await decryptWithRatchet(
                  message.messageContent,
                  message.senderId,
                  groupId,
                  currentUserId
                );
                messageObj.messageContent = decrypted;
              } catch (decryptError) {
                console.error("decrypt message failed:", decryptError);
                messageObj.messageContent = "[encrypted message]";
              }
              return messageObj;
            })();

            decryptPromises.push(decryptPromise);
          } else {
            // non-text messages directly add
            combinedMessages.push(messageObj);
          }
        } catch (messageError) {
          console.error("process single message failed:", messageError);
          // continue processing next message
        }
      });

      // wait for all decrypt operations to complete
      try {
        const decryptedMessages = await Promise.all(decryptPromises);
        combinedMessages.push(...decryptedMessages);
      } catch (decryptError) {
        console.error("batch decrypt messages failed:", decryptError);
        // try decrypting one by one
        for (const promise of decryptPromises) {
          try {
            const result = await promise;
            combinedMessages.push(result);
          } catch (e) {
            console.error("single message decrypt failed:", e);
          }
        }
      }
    }

    // process activity logs
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
          console.error("process activity log failed:", logError);
        }
      });
    }

    // sort by time
    combinedMessages.sort((a, b) => a.createdAt - b.createdAt);

    setCache(cacheKey, combinedMessages);

    return combinedMessages;
  } catch (error) {
    console.error("process messages overall failed:", error);
    return []; // return empty array to avoid UI error
  }
};

// get current logged in user
const getCurrentUser = async () => {
  if (process.client) {
    try {
      // if already logged in user, return directly
      if (auth.currentUser) {
        return auth.currentUser.uid;
      }

      // wait for auth state ready
      return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe(); // cancel listener
          resolve(user ? user.uid : null);
        });
      });
    } catch (error) {
      console.error("get current user failed:", error);
      return null;
    }
  }
  return null;
};

// add reaction to message
export const addReaction = async (chatroomId, messageId, emojiId) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("user not logged in");
    }

    const messageRef = dbRef(
      db,
      `chatrooms/${chatroomId}/messages/${messageId}`
    );

    const messageSnapshot = await get(messageRef);

    if (!messageSnapshot.exists()) {
      throw new Error("message does not exist");
    }

    const message = messageSnapshot.val();
    const reactions = message.reactions || {};

    // if user has already reacted to this emoji, remove reaction
    if (reactions[emojiId] && reactions[emojiId][currentUser]) {
      delete reactions[emojiId][currentUser];
      if (Object.keys(reactions[emojiId]).length === 0) {
        delete reactions[emojiId];
      }
    } else {
      if (!reactions[emojiId]) {
        reactions[emojiId] = {};
      }
      reactions[emojiId][currentUser] = true;
    }

    await update(messageRef, {
      reactions,
      lastUpdated: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("add reaction failed:", error);
    throw error;
  }
};

// setup real-time message listener
export const setupMessagesListener = async (
  groupId,
  callback,
  loadMore = false,
  lastTimestamp = null
) => {
  try {
    // get current user
    const currentUserId = await getCurrentUser();
    if (!currentUserId) {
      throw new Error("user not logged in");
    }

    try {
      await initializeRatchet(currentUserId, groupId);

      // get group members, initialize private chat ratchet state for each member
      const members = await getChatroomMembers(groupId);
      for (const member of members) {
        if (member.id !== currentUserId) {
          try {
            await initializeRatchet(currentUserId, groupId, member.id);
          } catch (memberError) {
            console.warn(
              `initialize with member ${member.id} failed:`,
              memberError
            );
          }
        }
      }
    } catch (ratchetError) {
      console.warn("pre-initialize ratchet state failed:", ratchetError);
      // continue execution, do not prevent message loading
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

    // build message query
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

    // build activity log query
    const activityLogsQuery = query(
      dbRef(db, `chatrooms/${groupId}/activity_logs`),
      orderByChild("timestamp"),
      startAt(joinedAt - 1),
      limitToLast(50)
    );

    // set message listener
    const unsubscribeMessages = onValue(
      messagesQuery,
      async (messagesSnapshot) => {
        try {
          // get activity log snapshot
          const activitySnapshot = await get(activityLogsQuery);

          // process messages and activity logs
          const processedMessages = await processMessages(
            messagesSnapshot,
            activitySnapshot,
            groupId,
            currentUserId
          );

          // callback processed messages
          callback(processedMessages);
        } catch (error) {
          console.error("process messages error:", error);
          callback([]);
        }
      },
      (error) => {
        console.error("message listener error:", error);
        callback([]);
      }
    );

    const unsubscribeActivityLog = onValue(
      activityLogsQuery,
      async (activitySnapshot) => {
        try {
          // get activity log snapshot
          const activitySnapshot = await get(activityLogsQuery);

          const messagesSnapshot = await get(messagesQuery);

          // process messages and activity logs
          const processedMessages = await processMessages(
            messagesSnapshot,
            activitySnapshot,
            groupId,
            currentUserId
          );

          // callback processed messages
          callback(processedMessages);
        } catch (error) {
          console.error("process messages error:", error);
          callback([]);
        }
      },
      (error) => {
        console.error("message listener error:", error);
        callback([]);
      }
    );

    // return unsubscribe function
    return [unsubscribeMessages, unsubscribeActivityLog];
  } catch (error) {
    console.error("setup messages listener failed:", error);
    // return an empty function as unsubscribe function to avoid calling error
    return () => {};
  }
};

// preload messages for 15 groups
export const preload15GroupsMessages = async (
  groupIds // Array of 15 group IDs
) => {
  try {
    const currentUserId = await getCurrentUser();
    if (!currentUserId) {
      throw new Error("user not logged in");
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
                `initialize with member ${member.id} failed:`,
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
        console.error(`preload group ${groupId} messages failed:`, error);
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
    console.error("preload 15 groups messages failed:", error);
    // Trigger empty callbacks for all groups on failure
    groupIds.forEach((groupId) => callback(groupId, []));
  }
};

// send message with encryption
export const sendMessage = async (chatroomId, messageData) => {
  try {
    // create a copy of message data so we can modify it
    const processedMessageData = { ...messageData };

    // get current user
    const currentUserId = await getCurrentUser();

    // verify sender identity
    if (!currentUserId) {
      throw new Error("user not logged in");
    }

    if (processedMessageData.senderId !== currentUserId) {
      throw new Error("no permission to send message as other user");
    }

    // if it's text message, encrypt content
    if (
      processedMessageData.messageType === "text" ||
      processedMessageData.messageType === "file" ||
      !processedMessageData.messageType
    ) {
      try {
        let encryptedContent;

        // pre-initialize ratchet state (if needed)
        if (processedMessageData.recipientId) {
          // private chat message - initialize with receiver's ratchet state
          await initializeRatchet(
            currentUserId,
            chatroomId,
            processedMessageData.recipientId
          );
        } else {
          // group chat message - initialize group ratchet state
          await initializeRatchet(currentUserId, chatroomId);
        }

        // group chat message - use group key
        encryptedContent = await encryptMessage(
          processedMessageData.messageContent,
          processedMessageData.senderId,
          chatroomId
        );

        processedMessageData.messageContent = encryptedContent;
      } catch (encryptError) {
        console.error("encrypt message failed:", encryptError);
        // if encryption failed, send unencrypted message
        processedMessageData.messageContent = `[encrypt failed] ${processedMessageData.messageContent}`;
      }
    }

    const newMessageRef = push(dbRef(db, `chatrooms/${chatroomId}/messages`));

    await set(newMessageRef, {
      createdAt: serverTimestamp(),
      ...processedMessageData,
      timestamp: serverTimestamp(),
    });

    try {
    } catch (cacheError) {
      console.error("clear cache failed:", cacheError);
    }

    return newMessageRef.key;
  } catch (error) {
    console.error("send message failed:", error);
    throw error;
  }
};

// get chatroom info
export const getChatroomInfo = async (chatroomId) => {
  // const cacheKey = `chatroom:${chatroomId}:info`;
  try {
    const snapshot = await get(dbRef(db, `chatrooms/${chatroomId}`));
    const data = snapshot.exists() ? snapshot.val() : null;

    return data;
  } catch (error) {
    console.error("Error in getChatroomInfo:", error);
    // directly get from database
    const snapshot = await get(dbRef(db, `chatrooms/${chatroomId}`));
    return snapshot.exists() ? snapshot.val() : null;
  }
};

// get chatroom members
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
    await setCache(cacheKey, membersData, 36000);
  }
  return membersData;
};

// process member data
const processMembers = async (usersSnapshot) => {
  if (!usersSnapshot.exists()) return [];

  const members = [];

  for (const [userId, userData] of Object.entries(usersSnapshot.val())) {
    // parallel get necessary data
    const [userSnapshot, statusSnapshot, advancedSettingsSnapshot] =
      await Promise.all([
        get(dbRef(db, `users/${userId}`)),
        get(dbRef(db, `users/${userId}/status`)),
        get(dbRef(db, `users/${userId}/advancedSettings`)),
      ]);

    if (!userSnapshot.exists()) continue;

    // basic public fields
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

    // conditional field processing
    const advancedSettings = advancedSettingsSnapshot.exists()
      ? advancedSettingsSnapshot.val()
      : {};

    // 1. email processing
    member.email =
      advancedSettings.showEmail !== false
        ? userSnapshot.child("email").val() || "anonymous"
        : "anonymous";

    // 2. status information processing
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

      // process group information update
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

// increment message counter
const MESSAGE_COUNTER_LIMIT = 1000; // each key can encrypt up to 1000 messages

// increment message counter
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

      // if counter exceeds limit, rotate user private key
      if (counter >= MESSAGE_COUNTER_LIMIT) {
        //await rotateUserPrivateKey(userId);
      }

      return counter;
    } catch (error) {
      console.error("update message counter failed:", error);
      return 0;
    }
  }
  return 0;
};

// rotate user's private key
const rotateUserPrivateKey = async (userId) => {
  if (process.client) {
    try {
      // generate new private key
      const newPrivateKey = CryptoJS.lib.WordArray.random(32).toString();

      // use userUID derived key to encrypt private key
      const derivedKey = CryptoJS.PBKDF2(userId, "user-key-salt", {
        keySize: 256 / 32,
        iterations: 10000,
      });

      const encryptedKey = CryptoJS.AES.encrypt(
        newPrivateKey,
        derivedKey.toString()
      ).toString();

      // store new encrypted private key
      const userKeyRef = dbRef(db, `users/${userId}/keys`);
      await set(userKeyRef, {
        private_key: encryptedKey,
        message_counter: 0,
        last_rotation: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("rotate user private key failed:", error);
      return false;
    }
  }
  return false;
};

// decrypt last message
export const decryptLastMessage = async (
  encryptedMessage,
  senderId,
  chatroomId
) => {
  if (!encryptedMessage) return "";

  try {
    // get current user ID
    const currentUserId = await getCurrentUser();
    if (!currentUserId) {
      return "[encrypted message]";
    }

    // try to parse JSON
    let encryptedPackage;
    try {
      encryptedPackage = JSON.parse(encryptedMessage);
    } catch (parseError) {
      // if not JSON format, possibly old version encrypted message or unencrypted message
      return encryptedMessage;
    }

    // extract encrypted components
    const { cipher, iv, mac, type, messageNumber } = encryptedPackage;

    // determine receiver ID
    const recipientId = type === "private" ? senderId : null;

    // initialize or get ratchet state
    const ratchetState = await initializeRatchet(
      currentUserId,
      chatroomId,
      recipientId
    );

    if (!ratchetState) {
      return "[encrypted message]";
    }

    // get message key
    let messageKey = await updateReceivingChain(
      ratchetState,
      currentUserId,
      chatroomId,
      messageNumber,
      senderId
    );

    // if encrypted package contains encrypted key, try decrypt
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
        console.error("decrypt key failed:", e);
      }
    }

    // get current user group encryption key
    const userGroupEncryptKey = await getUserGroupEncryptKey(
      currentUserId,
      chatroomId
    );

    // get current user private key
    const userPrivateKey = await getUserPrivateKey(currentUserId);
    if (!userPrivateKey) {
      throw new Error("unable to get user private key");
    }

    // decrypt group encryption key using private key
    const groupKey = CryptoJS.AES.decrypt(
      userGroupEncryptKey,
      userPrivateKey
    ).toString(CryptoJS.enc.Utf8);

    // use group key and message key combination for decryption
    const combinedKey = CryptoJS.SHA256(`${groupKey}:${messageKey}`).toString();

    // decrypt message
    try {
      const ivParsed = CryptoJS.enc.Base64.parse(iv);

      const decrypted = CryptoJS.AES.decrypt(cipher, combinedKey, {
        iv: ivParsed,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const messageText = decrypted.toString(CryptoJS.enc.Utf8);
      if (!messageText) {
        return "[encrypted message]";
      }

      if (mac) {
        const computedHmac = CryptoJS.HmacSHA256(
          messageText,
          combinedKey
        ).toString(CryptoJS.enc.Base64);

        if (computedHmac !== mac) {
          console.error("HMAC verification failed", {
            computed: computedHmac,
            received: mac,
            messageText,
            combinedKey,
          });
          return "[encrypted message]";
        }
      }

      // parse JSON
      const messageObj = JSON.parse(messageText);
      if (!messageObj || !messageObj.content) {
        return "[encrypted message]";
      }

      return messageObj.content;
    } catch (decryptError) {
      console.error("decrypt last message failed:", decryptError);
      return "[encrypted message]";
    }
  } catch (error) {
    console.error("process last message failed:", error);
    return "[encrypted message]";
  }
};

// get user's chatrooms
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

          let lastMessage = null;
          if (chatroomData.lastMessage) {
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
          console.error(`get chatroom ${chatroomId} info failed:`, error);
          return null;
        }
      })();

      chatroomPromises.push(chatroomPromise);
    });

    const chatrooms = (await Promise.all(chatroomPromises)).filter(Boolean);
    return chatrooms.sort((a, b) => {
      const timeA = a.lastMessage ? a.lastMessage.createdAt : 0;
      const timeB = b.lastMessage ? b.lastMessage.createdAt : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("get user chatrooms list failed:", error);
    return [];
  }
};

// get group list
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

          let lastMessage = null;
          if (groupData.lastMessage) {
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
          console.error(`get group ${groupId} info failed:`, error);
          return null;
        }
      })();

      groupPromises.push(groupPromise);
    });

    const groups = (await Promise.all(groupPromises)).filter(Boolean);

    // sort by last message time
    return groups.sort((a, b) => {
      const timeA = a.lastMessage ? a.lastMessage.createdAt : 0;
      const timeB = b.lastMessage ? b.lastMessage.createdAt : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("get user group list failed:", error);
    return [];
  }
};

// encrypt file URL
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

// handle file upload response
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
      throw new Error("invalid upload response");
    }

    if (!auth.currentUser) {
      throw new Error("no authenticated");
    }

    // get uploaded file URL
    const fileUrl = uploadResponse.files[0];

    // encrypt file URL
    const encryptedFileUrl = await encryptFileUrl(
      fileUrl,
      senderId,
      chatroomId,
      null // group message
    );

    // create message reference
    const chatroomRef = dbRef(db, `chatrooms/${chatroomId}/messages`);
    const newMessageRef = push(chatroomRef);

    // set message data
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
    console.error("process file upload response failed:", error);
    throw error;
  }
};

// decrypt file URL
export const decryptFileUrl = async (encryptedUrl, senderId, chatroomId) => {
  try {
    // from Realtime Database, it's encrypted message content
    const decryptedContent = await decryptWithRatchet(
      encryptedUrl,
      senderId,
      chatroomId,
      await getCurrentUser()
    );

    return decryptedContent;
  } catch (error) {
    console.error("decrypt file URL failed:", error);
    return encryptedUrl; // if decryption failed, return original URL
  }
};

// fetch and decrypt file
export const fetchAndDecryptFile = async (
  url,
  userId,
  chatroomId,
  mimeType,
  requireBlob = false
) => {
  try {
    // use server-side API proxy to get file content, avoid CORS issues
    const user = auth.currentUser;
    if (!user) {
      throw new Error("user not authenticated");
    }

    // get ID token for server authentication
    const idToken = await user.getIdToken();

    // request server API to get file - server will handle decryption
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

    if (!response.ok) {
      let errorMessage = "get file failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `get file failed: ${response.statusText}`;
      }
      console.error(`File fetch error: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const contentType =
      response.headers.get("Content-Type") ||
      mimeType ||
      "application/octet-stream";

    const fileBlob = new Blob([await response.arrayBuffer()], {
      type: contentType,
    });

    const objectUrl = URL.createObjectURL(fileBlob);

    if (requireBlob) return { fileUrl: objectUrl, decryptedBlob: fileBlob };
    return objectUrl;
  } catch (error) {
    console.error("get and decrypt file failed:", error);
    throw error;
  }
};

export const decryptFile = async (encryptedFileArrayBuffer, chatroomId) => {
  try {
    const encryptedData = new Uint8Array(encryptedFileArrayBuffer);
    const iv = encryptedData.slice(0, 16);
    const encryptedContent = encryptedData.slice(16);

    const groupKeyRef = dbRef(
      db,
      `chatrooms/${chatroomId}/encryption/group_key`
    );
    const groupKeySnapshot = await get(groupKeyRef);

    if (!groupKeySnapshot.exists()) {
      throw new Error("group encryption key does not exist");
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

    const wordArray = CryptoJS.lib.WordArray.create(encryptedContent);
    const ivWordArray = CryptoJS.lib.WordArray.create(iv);

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: wordArray },
      CryptoJS.enc.Hex.parse(groupKey.toString("hex")),
      {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

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
    console.error("decrypt file failed:", error);
    throw error;
  }
};

// filter and normalize reactions
function filterAndNormalizeReactions(reactions) {
  const filteredReactions = Object.entries(reactions).filter(([key, value]) => {
    return value && Object.keys(value).length > 0;
  });

  const normalizedReactions = {};
  filteredReactions.forEach(([emojiId, users]) => {
    normalizedReactions[emojiId] = Object.keys(users);
  });

  return normalizedReactions;
}
