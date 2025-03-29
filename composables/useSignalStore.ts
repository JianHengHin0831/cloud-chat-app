import { useIndexedDB } from "./useIndexedDB";
import * as libsignal from "@privacyresearch/libsignal-protocol-typescript";

interface DBSession {
  deviceId: string;
  sessionState: ArrayBuffer;
  timestamp: number;
}

export class SignalProtocolStore implements libsignal.StorageType {
  private db: ReturnType<typeof useIndexedDB>;
  private identityKeyPair: libsignal.KeyPairType | null = null;
  private registrationId: number | null = null;

  constructor() {
    this.db = useIndexedDB();
  }

  async getIdentityKeyPair(): Promise<libsignal.KeyPairType> {
    if (this.identityKeyPair) return this.identityKeyPair;
    throw new Error("Identity key pair not set");
  }

  async getLocalRegistrationId(): Promise<number> {
    if (this.registrationId) return this.registrationId;
    throw new Error("Registration ID not set");
  }

  async isTrustedIdentity(
    identifier: string,
    identityKey: ArrayBuffer,
    direction: libsignal.Direction
  ): Promise<boolean> {
    return true;
  }

  async loadIdentityKey(identifier: string): Promise<ArrayBuffer | undefined> {
    const deviceId = identifier.split(":")[1];
    const keys = await this.db.getKeys(deviceId);
    return keys?.identityKey;
  }

  async saveIdentity(
    identifier: string,
    identityKey: ArrayBuffer
  ): Promise<boolean> {
    const deviceId = identifier.split(":")[1];
    await this.db.storeKeys({
      deviceId,
      identityKey,
      signedPreKey: new ArrayBuffer(0),
      oneTimePreKeys: [],
      registrationId: 0,
    });
    return true;
  }

  async loadPreKey(
    keyId: string | number
  ): Promise<libsignal.KeyPairType | undefined> {
    const numericKeyId = typeof keyId === "string" ? parseInt(keyId) : keyId;
    return undefined;
  }

  async storePreKey(
    keyId: string | number,
    keyPair: libsignal.KeyPairType
  ): Promise<void> {
    const numericKeyId = typeof keyId === "string" ? parseInt(keyId) : keyId;
  }

  async removePreKey(keyId: string | number): Promise<void> {
    const numericKeyId = typeof keyId === "string" ? parseInt(keyId) : keyId;
  }

  async loadSignedPreKey(
    keyId: string | number
  ): Promise<libsignal.KeyPairType | undefined> {
    const numericKeyId = typeof keyId === "string" ? parseInt(keyId) : keyId;
    return undefined;
  }

  async storeSignedPreKey(
    keyId: string | number,
    keyPair: libsignal.KeyPairType
  ): Promise<void> {
    const numericKeyId = typeof keyId === "string" ? parseInt(keyId) : keyId;
  }

  async removeSignedPreKey(keyId: string | number): Promise<void> {
    const numericKeyId = typeof keyId === "string" ? parseInt(keyId) : keyId;
  }

  async loadSession(identifier: string): Promise<string | undefined> {
    const [userId, deviceId] = identifier.split(":");
    const session = await this.db.getSession(deviceId, identifier);
    return session?.sessionState
      ? this.arrayBufferToString(session.sessionState)
      : undefined;
  }

  async storeSession(
    identifier: string,
    serializedSession: string
  ): Promise<void> {
    const [userId, deviceId] = identifier.split(":");
    const sessionBuffer = this.stringToArrayBuffer(serializedSession);
    await this.db.storeSession(identifier, {
      deviceId,
      sessionState: sessionBuffer,
      timestamp: Date.now(),
    });
  }

  private arrayBufferToString(buffer: ArrayBuffer): string {
    return String.fromCharCode.apply(
      null,
      new Uint8Array(buffer) as unknown as number[]
    );
  }

  private stringToArrayBuffer(str: string): ArrayBuffer {
    const buffer = new ArrayBuffer(str.length);
    const bufferView = new Uint8Array(buffer);
    for (let i = 0; i < str.length; i++) {
      bufferView[i] = str.charCodeAt(i);
    }
    return buffer;
  }

  async removeSession(identifier: string): Promise<void> {
    const [userId, deviceId] = identifier.split(":");
    await this.db.deleteSession(deviceId, identifier);
  }

  async removeAllSessions(identifier: string): Promise<void> {
    await this.removeSession(identifier);
  }
}
