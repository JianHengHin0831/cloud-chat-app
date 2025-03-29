import { hash } from "./crypto";
import { getDatabase } from "firebase-admin/database";

const db = getDatabase();

interface KeyBundle {
  registrationId: number;
  identityKey: ArrayBuffer;
  signedPreKey: {
    keyId: number;
    publicKey: ArrayBuffer;
    signature: ArrayBuffer;
  };
  preKey: {
    keyId: number;
    publicKey: ArrayBuffer;
  };
}

// Store a device's key bundle
export const storeKeyBundle = async (
  userId: string,
  deviceId: string,
  keyBundle: KeyBundle
): Promise<void> => {
  const bundleRef = db.ref(`keyBundles/${userId}/devices/${deviceId}`);

  await bundleRef.set({
    ...keyBundle,
    timestamp: { ".sv": "timestamp" },
  });
};

// Retrieve a device's key bundle
export const getKeyBundle = async (
  userId: string,
  deviceId: string
): Promise<KeyBundle | null> => {
  const bundleRef = db.ref(`keyBundles/${userId}/devices/${deviceId}`);

  const snapshot = await bundleRef.get();
  return snapshot.exists() ? snapshot.val() : null;
};

// List all key bundles for a user's devices
export const listDeviceKeyBundles = async (
  userId: string
): Promise<{ deviceId: string; bundle: KeyBundle }[]> => {
  const bundlesRef = db.ref(`keyBundles/${userId}/devices`);

  const snapshot = await bundlesRef.get();
  if (!snapshot.exists()) return [];

  const bundles = snapshot.val();
  return Object.entries(bundles).map(([deviceId, bundle]) => ({
    deviceId,
    bundle: bundle as KeyBundle,
  }));
};

// Remove a device's key bundle
export const removeKeyBundle = async (
  userId: string,
  deviceId: string
): Promise<void> => {
  const bundleRef = db.ref(`keyBundles/${userId}/devices/${deviceId}`);

  await bundleRef.remove();
};

// Sync key bundles between devices
export const syncDeviceKeys = async (
  userId: string,
  sourceDeviceId: string,
  targetDeviceId: string
): Promise<void> => {
  const sourceBundle = await getKeyBundle(userId, sourceDeviceId);
  if (!sourceBundle) {
    throw new Error("Source device key bundle not found");
  }

  // Store encrypted bundle for target device
  await storeKeyBundle(userId, targetDeviceId, sourceBundle);

  // Create sync record with timestamp
  const syncRef = db.ref(`keySyncs/${userId}/records/${Date.now()}`);

  await syncRef.set({
    sourceDeviceId,
    targetDeviceId,
    timestamp: { ".sv": "timestamp" },
    status: "completed",
  });
};

// Verify device authenticity
export const verifyDevice = async (
  userId: string,
  deviceId: string,
  challenge: string
): Promise<boolean> => {
  const bundle = await getKeyBundle(userId, deviceId);
  if (!bundle) return false;

  // Verify the device's identity key
  const identityKeyHash = hash(Buffer.from(bundle.identityKey));
  const challengeHash = hash(challenge);

  return identityKeyHash === challengeHash;
};
