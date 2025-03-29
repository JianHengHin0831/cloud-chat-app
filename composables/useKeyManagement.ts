import { ref } from "vue";
import { useIndexedDB } from "./useIndexedDB";
import { useKeyBundle } from "./useKeyBundle";
import * as libsignal from "@privacyresearch/libsignal-protocol-typescript";

export const useKeyManagement = () => {
  const { storeKeys, getKeys } = useIndexedDB();
  const { storeKeyBundle, getKeyBundle } = useKeyBundle();

  const generateDeviceKeys = async () => {
    // Generate identity key pair
    const identityKeyPair = await libsignal.KeyHelper.generateIdentityKeyPair();
    const registrationId = await libsignal.KeyHelper.generateRegistrationId();

    // Generate signed pre-key
    const signedPreKey = await libsignal.KeyHelper.generateSignedPreKey(
      identityKeyPair,
      0
    );

    // Generate one-time pre-keys
    const preKeys = await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        libsignal.KeyHelper.generatePreKey(i + 1)
      )
    );

    return {
      identityKeyPair,
      registrationId,
      signedPreKey,
      preKeys,
    };
  };

  const initializeDevice = async (userId: string, deviceId: string) => {
    const keys = await generateDeviceKeys();

    // Store keys locally
    await storeKeys({
      deviceId,
      identityKey: keys.identityKeyPair.pubKey,
      signedPreKey: keys.signedPreKey.keyPair.pubKey,
      oneTimePreKeys: keys.preKeys.map((pk) => pk.keyPair.pubKey),
      registrationId: keys.registrationId,
    });

    // Upload key bundle to server
    await storeKeyBundle(userId, deviceId, {
      identityKey: keys.identityKeyPair.pubKey,
      signedPreKey: {
        keyId: keys.signedPreKey.keyId,
        publicKey: keys.signedPreKey.keyPair.pubKey,
        signature: keys.signedPreKey.signature,
      },
      oneTimePreKeys: keys.preKeys.map((pk) => ({
        keyId: pk.keyId,
        publicKey: pk.keyPair.pubKey,
      })),
    });

    return keys;
  };

  const getDeviceKeys = async (deviceId: string) => {
    return await getKeys(deviceId);
  };

  const fetchRecipientBundle = async (userId: string, deviceId: string) => {
    const bundle = await getKeyBundle(userId, deviceId);
    if (!bundle) {
      throw new Error("Recipient key bundle not found");
    }
    return bundle;
  };

  return {
    generateDeviceKeys,
    initializeDevice,
    getDeviceKeys,
    fetchRecipientBundle,
  };
};
