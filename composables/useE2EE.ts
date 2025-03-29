import { ref } from "vue";
import { useSignal } from "./useSignal";
import { useKeyBundle } from "./useKeyBundle";

export interface KeyBundle {
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

export interface SessionType {
  encrypt: (plaintext: string) => Promise<ArrayBuffer>;
  decrypt: (ciphertext: ArrayBuffer) => Promise<string>;
}

export interface DecryptedContent<T = any> {
  data: T;
  isJson: boolean;
}

export const useE2EE = () => {
  const {
    initialize: initSignal,
    encryptMessage,
    decryptMessage,
  } = useSignal();
  const { syncKeyBundle, storeKeyBundle } = useKeyBundle();
  const isInitialized = ref(false);
  const signal = useSignal();

  // Initialize E2EE system for a user
  const initialize = async (
    userId: string,
    deviceId: string
  ): Promise<boolean> => {
    if (isInitialized.value) return true;

    // Generate and store key bundle
    const keyBundle = await signal.generateKeyBundle();
    await storeKeyBundle(userId, deviceId, keyBundle);

    // Sync keys across devices
    await syncKeyBundle(userId, deviceId, deviceId);

    isInitialized.value = true;
    return true;
  };

  // Encrypt a message for a recipient
  const encrypt = async (
    recipientId: string,
    deviceId: string,
    content: any
  ): Promise<EncryptedMessage> => {
    if (!isInitialized.value) {
      throw new Error("E2EE not initialized");
    }

    const message =
      typeof content === "string" ? content : JSON.stringify(content);
    return signal.encryptMessage(recipientId, deviceId, message);
  };

  // Decrypt a message from a sender
  const decrypt = async (
    senderId: string,
    deviceId: string,
    encryptedContent: EncryptedMessage // Now properly typed
  ): Promise<any> => {
    if (!isInitialized.value) {
      throw new Error("E2EE not initialized");
    }

    const decrypted = await signal.decryptMessage(
      senderId,
      deviceId,
      encryptedContent // Now matches expected type
    );

    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  };

  // Encrypt a file before upload
  const encryptFile = async (
    recipientId: string,
    deviceId: string,
    file: File
  ): Promise<{
    encryptedFile: Blob;
    metadata: string;
  }> => {
    if (!isInitialized.value) {
      throw new Error("E2EE not initialized");
    }

    // Generate a random key for file encryption
    const key = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    // Export the key to send to recipient
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);
    const keyBuffer = new Uint8Array(exportedKey);

    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the file
    const fileBuffer = await file.arrayBuffer();
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      fileBuffer
    );

    // Encrypt the key and IV for the recipient
    const metadata = await encrypt(recipientId, deviceId, {
      key: Array.from(keyBuffer),
      iv: Array.from(iv),
      filename: file.name,
      type: file.type,
      size: file.size,
    });

    return {
      encryptedFile: new Blob([encryptedBuffer], {
        type: "application/octet-stream",
      }),
      metadata: JSON.stringify(metadata),
    };
  };

  // Decrypt a file after download
  const decryptFile = async (
    senderId: string,
    deviceId: string,
    encryptedBlob: Blob,
    encryptedMetadata: string
  ): Promise<File> => {
    if (!isInitialized.value) {
      throw new Error("E2EE not initialized");
    }

    // Decrypt the metadata
    const metadata = await decrypt(
      senderId,
      deviceId,
      JSON.parse(encryptedMetadata)
    );

    // Import the decrypted key
    const keyBuffer = new Uint8Array(metadata.key);
    const key = await window.crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    // Decrypt the file
    const encryptedBuffer = await encryptedBlob.arrayBuffer();
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(metadata.iv) },
      key,
      encryptedBuffer
    );

    return new File([decryptedBuffer], metadata.filename, {
      type: metadata.type,
    });
  };

  return {
    isInitialized,
    initialize,
    encrypt,
    decrypt,
    encryptFile,
    decryptFile,
  };
};
