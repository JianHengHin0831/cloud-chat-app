import { db } from "~/firebase/firebase.js";
import { ref as dbRef, set, get, remove } from "firebase/database";

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

export const useKeyBundle = () => {
  const storeKeyBundle = async (
    userId: string,
    deviceId: string,
    keyBundle: KeyBundle
  ): Promise<void> => {
    await set(dbRef(db, `keyBundles/${userId}/devices/${deviceId}`), {
      ...keyBundle,
      timestamp: { ".sv": "timestamp" },
    });
  };

  // Retrieve a device's key bundle
  const getKeyBundle = async (
    userId: string,
    deviceId: string
  ): Promise<KeyBundle | null> => {
    const snapshot = await get(
      dbRef(db, `keyBundles/${userId}/devices/${deviceId}`)
    );
    return snapshot.exists() ? snapshot.val() : null;
  };

  // List all key bundles for a user's devices
  const listDeviceKeyBundles = async (userId: string) => {
    const bundlesRef = dbRef(db, `keyBundles/${userId}/devices`);

    const snapshot = await get(bundlesRef);
    if (!snapshot.exists()) return [];

    const bundles = snapshot.val();
    return Object.entries(bundles).map(([deviceId, bundle]) => ({
      deviceId,
      bundle,
    }));
  };

  // Remove a device's key bundle
  const removeKeyBundle = async (userId: string, deviceId: string) => {
    const bundleRef = dbRef(db, `keyBundles/${userId}/devices/${deviceId}`);

    await remove(bundleRef);
  };

  // Sync key bundles between devices
  const syncKeyBundle = async (
    userId: string,
    sourceDeviceId: string,
    targetDeviceId: string
  ) => {
    const sourceBundle = await getKeyBundle(userId, sourceDeviceId);
    if (!sourceBundle) {
      throw new Error("Source device key bundle not found");
    }

    await storeKeyBundle(userId, targetDeviceId, sourceBundle);

    const syncRef = dbRef(db, `keySyncs/${userId}/records/${Date.now()}`);

    await set(syncRef, {
      sourceDeviceId,
      targetDeviceId,
      timestamp: { ".sv": "timestamp" },
      status: "completed",
    });
  };

  const syncCurrentUserKeys = async (userId: string) => {
    const devices = await listDeviceKeyBundles(userId);
    if (devices.length < 2) return; // No need to sync if only one device

    // Get the most recent device as source
    const sourceDevice = devices.sort(
      (a, b) =>
        (b.bundle as { timestamp: number }).timestamp -
        (a.bundle as { timestamp: number }).timestamp
    )[0];

    // Sync to all other devices
    await Promise.all(
      devices
        .filter((d) => d.deviceId !== sourceDevice.deviceId)
        .map(async (targetDevice) => {
          await syncDeviceKeys(
            userId,
            sourceDevice.deviceId,
            targetDevice.deviceId
          );
        })
    );
  };

  return {
    storeKeyBundle,
    getKeyBundle,
    listDeviceKeyBundles,
    removeKeyBundle,
    syncKeyBundle,
    syncCurrentUserKeys,
  };
};
