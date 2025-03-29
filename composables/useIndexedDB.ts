import { openDB } from "idb";
import type { IDBPDatabase } from "idb";

interface KeyData {
  deviceId: string;
  identityKey: ArrayBuffer;
  signedPreKey: ArrayBuffer;
  oneTimePreKeys: ArrayBuffer[];
  registrationId: number;
}

interface SessionData {
  deviceId: string;
  sessionState: ArrayBuffer;
  timestamp: number;
}

export const useIndexedDB = () => {
  let db: IDBPDatabase | null = null;

  const initDB = async () => {
    if (db) return db;

    db = await openDB("cloudtalk-e2ee", 1, {
      upgrade(db) {
        // Store for identity and pre-keys
        if (!db.objectStoreNames.contains("keys")) {
          db.createObjectStore("keys", { keyPath: "deviceId" });
        }

        // Store for session states
        if (!db.objectStoreNames.contains("sessions")) {
          db.createObjectStore("sessions", {
            keyPath: ["deviceId", "sessionId"],
          });
        }
      },
    });

    return db;
  };

  const storeKeys = async (keyData: KeyData) => {
    const db = await initDB();
    await db.put("keys", keyData);
  };

  const getKeys = async (deviceId: string): Promise<KeyData | undefined> => {
    const db = await initDB();
    return db.get("keys", deviceId);
  };

  const storeSession = async (sessionId: string, sessionData: SessionData) => {
    const db = await initDB();
    await db.put("sessions", {
      ...sessionData,
      sessionId,
    });
  };

  const getSession = async (
    deviceId: string,
    sessionId: string
  ): Promise<SessionData | undefined> => {
    const db = await initDB();
    return db.get("sessions", [deviceId, sessionId]);
  };

  const deleteSession = async (deviceId: string, sessionId: string) => {
    const db = await initDB();
    await db.delete("sessions", [deviceId, sessionId]);
  };

  const clearAllData = async () => {
    const db = await initDB();
    await Promise.all([db.clear("keys"), db.clear("sessions")]);
  };

  return {
    initDB,
    storeKeys,
    getKeys,
    storeSession,
    getSession,
    deleteSession,
    clearAllData,
  };
};
