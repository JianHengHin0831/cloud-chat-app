import {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";

// Key derivation function using PBKDF2
const deriveKey = (password: string, salt: Buffer): Buffer => {
  return createHash("sha256").update(password).update(salt).digest();
};

// Generate a random salt
export const generateSalt = (): Buffer => {
  return randomBytes(16);
};

// Encrypt data using AES-256-GCM
export const encrypt = (
  data: string | Buffer,
  password: string,
  salt: Buffer = generateSalt()
): { encrypted: Buffer; iv: Buffer; salt: Buffer; authTag: Buffer } => {
  const key = deriveKey(password, salt);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

  return {
    encrypted,
    iv,
    salt,
    authTag: cipher.getAuthTag(),
  };
};

// Decrypt data using AES-256-GCM
export const decrypt = (
  encrypted: Buffer,
  password: string,
  salt: Buffer,
  iv: Buffer,
  authTag: Buffer
): Buffer => {
  const key = deriveKey(password, salt);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};

// Hash a value using SHA-256
export const hash = (value: string | Buffer): string => {
  return createHash("sha256").update(value).digest("hex");
};

// Generate a random key
export const generateKey = (length: number = 32): Buffer => {
  return randomBytes(length);
};

// Encrypt data with a public key
export const encryptWithPublicKey = async (
  data: Buffer,
  publicKey: JsonWebKey
): Promise<Buffer> => {
  const key = await window.crypto.subtle.importKey(
    "jwk",
    publicKey,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    key,
    data
  );

  return Buffer.from(encrypted);
};

// Decrypt data with a private key
export const decryptWithPrivateKey = async (
  data: Buffer,
  privateKey: JsonWebKey
): Promise<Buffer> => {
  const key = await window.crypto.subtle.importKey(
    "jwk",
    privateKey,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    key,
    data
  );

  return Buffer.from(decrypted);
};
