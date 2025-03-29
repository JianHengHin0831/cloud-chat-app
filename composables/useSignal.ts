import { ref } from "vue";
import {
  KeyHelper,
  SignalProtocolAddress,
  SessionBuilder,
  SessionCipher,
} from "@privacyresearch/libsignal-protocol-typescript";
import { useKeyBundle } from "./useKeyBundle";
import { SignalProtocolStore } from "./useSignalStore";

export interface EncryptedMessage {
  type: number;
  body: string; // Base64 encoded encrypted data
}

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

export const useSignal = () => {
  const { storeKeyBundle, getKeyBundle } = useKeyBundle();
  const sessions = ref(new Map<string, SessionCipher>());

  // Helper functions
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  };

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const stringToArrayBuffer = (str: string): ArrayBuffer => {
    const encoder = new TextEncoder();
    return encoder.encode(str).buffer;
  };

  const arrayBufferToString = (buffer: ArrayBuffer): string => {
    const decoder = new TextDecoder();
    return decoder.decode(buffer);
  };

  const generateKeyBundle = async (): Promise<KeyBundle> => {
    const registrationId = Math.floor(Math.random() * 16384);
    const identityKeyPair = await KeyHelper.generateIdentityKeyPair();
    const preKeyId = Math.floor(Math.random() * 16384);
    const preKey = await KeyHelper.generatePreKey(preKeyId);
    const signedPreKeyId = Math.floor(Math.random() * 16384);
    const signedPreKey = await KeyHelper.generateSignedPreKey(
      identityKeyPair,
      signedPreKeyId
    );

    return {
      registrationId,
      identityKey: identityKeyPair.pubKey,
      signedPreKey: {
        keyId: signedPreKeyId,
        publicKey: signedPreKey.keyPair.pubKey,
        signature: signedPreKey.signature,
      },
      preKey: {
        keyId: preKeyId,
        publicKey: preKey.keyPair.pubKey,
      },
    };
  };

  const initialize = async (userId: string, deviceId: string) => {
    const keyBundle = await generateKeyBundle();
    await storeKeyBundle(userId, deviceId, keyBundle);
  };

  const initializeSession = async (
    userId: string,
    deviceId: string
  ): Promise<SessionCipher> => {
    const theirBundle = await getKeyBundle(userId, deviceId);
    if (!theirBundle) throw new Error("Key bundle not found");

    const store = new SignalProtocolStore();
    const address = new SignalProtocolAddress(userId, Number(deviceId));
    const sessionBuilder = new SessionBuilder(store, address);

    await sessionBuilder.processPreKey(theirBundle);

    const sessionCipher = new SessionCipher(store, address);
    sessions.value.set(`${userId}:${deviceId}`, sessionCipher);
    return sessionCipher;
  };

  const encryptMessage = async (
    recipientId: string,
    deviceId: string,
    message: string
  ): Promise<EncryptedMessage> => {
    let session = sessions.value.get(`${recipientId}:${deviceId}`);
    if (!session) {
      session = await initializeSession(recipientId, deviceId);
    }

    // Convert string message to ArrayBuffer
    const messageBuffer = stringToArrayBuffer(message);
    const ciphertext = await session.encrypt(messageBuffer);
    return {
      type: 1,
      body: arrayBufferToBase64(ciphertext),
    };
  };

  const decryptMessage = async (
    senderId: string,
    deviceId: string,
    encryptedMessage: EncryptedMessage
  ): Promise<string> => {
    let session = sessions.value.get(`${senderId}:${deviceId}`);
    if (!session) {
      session = await initializeSession(senderId, deviceId);
    }

    const ciphertext = base64ToArrayBuffer(encryptedMessage.body);
    const plaintextBuffer = await session.decryptPreKeyWhisperMessage(
      ciphertext
    );

    // Convert ArrayBuffer back to string
    return arrayBufferToString(plaintextBuffer);
  };

  // File encryption helpers
  const encryptFile = async (
    recipientId: string,
    deviceId: string,
    file: File
  ): Promise<EncryptedMessage> => {
    const fileBuffer = await file.arrayBuffer();
    let session = sessions.value.get(`${recipientId}:${deviceId}`);
    if (!session) {
      session = await initializeSession(recipientId, deviceId);
    }

    const ciphertext = await session.encrypt(fileBuffer);
    return {
      type: 2, // Different type for files
      body: arrayBufferToBase64(ciphertext),
    };
  };

  return {
    initialize,
    generateKeyBundle,
    initializeSession,
    encryptMessage,
    decryptMessage,
    encryptFile,
  };
};
