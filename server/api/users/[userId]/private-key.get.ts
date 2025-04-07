import { adminDb } from "~/server/utils/firebase-admin";
import CryptoJS from "crypto-js";
import { verifyAuth } from "~/server/utils/auth";
import { LRUCache } from "lru-cache";

const privateKeyCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 120,
});

export default defineEventHandler(async (event) => {
  const params = event.context.params;

  if (!params?.userId) {
    console.error("[private-key.get] Missing userId parameter");
    throw createError({
      statusCode: 400,
      message: "Missing user ID parameter",
    });
  }
  const { userId } = params;

  const authUser = await verifyAuth(event);

  if (authUser.uid !== userId) {
    console.error(
      "[private-key.get] Forbidden: auth user does not match requested userId"
    );
    throw createError({ statusCode: 403, message: "Forbidden" });
  }

  const userKeyRef = adminDb.ref(`users/${userId}/keys/private_key`);
  const snapshot = await userKeyRef.get();
  if (snapshot.exists()) {
    const encryptedKey = snapshot.val();
    const derivedKey = CryptoJS.PBKDF2(userId, "user-key-salt", {
      keySize: 256 / 32,
      iterations: 10000,
    });
    const privateKey = CryptoJS.AES.decrypt(
      encryptedKey,
      derivedKey.toString()
    ).toString(CryptoJS.enc.Utf8);
    return {
      success: true,
      data: { key: privateKey },
      error: null,
    };
  } else {
    const newPrivateKey = CryptoJS.lib.WordArray.random(32).toString();
    const derivedKey = CryptoJS.PBKDF2(userId, "user-key-salt", {
      keySize: 256 / 32,
      iterations: 10000,
    });
    const encryptedKey = CryptoJS.AES.encrypt(
      newPrivateKey,
      derivedKey.toString()
    ).toString();

    await userKeyRef.set(encryptedKey);
    privateKeyCache.set(userId, newPrivateKey);

    return {
      success: true,
      data: { key: newPrivateKey },
      error: null,
    };
  }
});
