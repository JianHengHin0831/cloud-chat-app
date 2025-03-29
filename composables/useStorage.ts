import { ref } from "vue";
import { useAuth } from "./useAuth";
import { useSignal } from "./useSignal";

export const useStorage = () => {
  const { currentUser, currentDevice } = useAuth();
  const { encryptMessage, decryptMessage } = useSignal();

  // Encrypt file data
  const encryptFile = async (
    fileData: ArrayBuffer
  ): Promise<{
    encryptedData: Buffer;
    iv: Buffer;
    authTag: Buffer;
  }> => {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
        tagLength: 128,
      },
      key,
      fileData
    );

    // Split encrypted data and auth tag
    const encryptedBuffer = Buffer.from(encryptedData);
    const authTag = encryptedBuffer.slice(-16);
    const data = encryptedBuffer.slice(0, -16);

    return {
      encryptedData: data,
      iv: Buffer.from(iv),
      authTag,
    };
  };

  // Decrypt file data
  const decryptFile = async (
    encryptedData: Buffer,
    iv: Buffer,
    authTag: Buffer
  ): Promise<ArrayBuffer> => {
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    // Combine encrypted data and auth tag
    const encryptedBuffer = Buffer.concat([encryptedData, authTag]);

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
        tagLength: 128,
      },
      key,
      encryptedBuffer
    );

    return decryptedData;
  };

  // Upload encrypted file
  const uploadFile = async (file: File): Promise<string> => {
    if (!currentUser.value || !currentDevice.value) {
      throw new Error("User not authenticated");
    }

    const fileData = await file.arrayBuffer();
    const encrypted = await encryptFile(fileData);

    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const metadata = {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
    };

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: currentUser.value.uid,
        fileId,
        encryptedFile: encrypted,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    return fileId;
  };

  // Download and decrypt file
  const downloadFile = async (fileId: string): Promise<Blob> => {
    if (!currentUser.value || !currentDevice.value) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(`/api/download?fileId=${fileId}`);
    if (!response.ok) {
      throw new Error("Failed to download file");
    }

    const { encryptedData, iv, authTag, metadata } = await response.json();
    const decryptedData = await decryptFile(
      Buffer.from(encryptedData),
      Buffer.from(iv),
      Buffer.from(authTag)
    );

    return new Blob([decryptedData], { type: metadata.type });
  };

  return {
    uploadFile,
    downloadFile,
  };
};
