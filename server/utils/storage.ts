import { getStorage } from "firebase-admin/storage";
import { hash } from "./crypto";

const storage = getStorage();

interface EncryptedFile {
  encryptedData: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

// Upload encrypted file
export const uploadEncryptedFile = async (
  userId: string,
  fileId: string,
  encryptedFile: EncryptedFile,
  metadata: any
): Promise<string> => {
  const bucket = storage.bucket();
  const filePath = `encrypted/${userId}/${fileId}`;
  const file = bucket.file(filePath);

  // Combine encrypted data with IV and auth tag
  const combinedBuffer = Buffer.concat([
    encryptedFile.iv,
    encryptedFile.authTag,
    encryptedFile.encryptedData,
  ]);

  // Upload encrypted file
  await file.save(combinedBuffer, {
    metadata: {
      ...metadata,
      contentType: "application/octet-stream",
      encryptionMetadata: {
        iv: encryptedFile.iv.toString("base64"),
        authTag: encryptedFile.authTag.toString("base64"),
      },
    },
  });

  return filePath;
};

// Download encrypted file
export const downloadEncryptedFile = async (
  userId: string,
  fileId: string
): Promise<EncryptedFile> => {
  const bucket = storage.bucket();
  const filePath = `encrypted/${userId}/${fileId}`;
  const file = bucket.file(filePath);

  // Download file
  const [fileContent] = await file.download();

  // Extract IV and auth tag from the beginning of the file
  const iv = fileContent.slice(0, 16);
  const authTag = fileContent.slice(16, 32);
  const encryptedData = fileContent.slice(32);

  return {
    encryptedData,
    iv,
    authTag,
  };
};

// Delete encrypted file
export const deleteEncryptedFile = async (
  userId: string,
  fileId: string
): Promise<void> => {
  const bucket = storage.bucket();
  const filePath = `encrypted/${userId}/${fileId}`;
  const file = bucket.file(filePath);

  await file.delete();
};

// Generate signed URL for file download
export const generateSignedUrl = async (
  userId: string,
  fileId: string,
  expiresIn: number = 3600
): Promise<string> => {
  const bucket = storage.bucket();
  const filePath = `encrypted/${userId}/${fileId}`;
  const file = bucket.file(filePath);

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + expiresIn * 1000,
  });

  return url;
};
