import { createClient } from "redis";

const redisEnabled = process.env.REDIS_ENABLED === "true";
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let client = null;
if (redisEnabled) {
  try {
    client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (attempts) => {
          if (attempts > 5) return false;
          return Math.min(attempts * 100, 3000);
        },
      },
    });

    client.connect().catch((err) => {
      console.error("Redis connection error:", err);
    });
  } catch (err) {
    console.error("Redis initialization error:", err);
  }
}

const memoryCache = new Map();
const memoryCacheExpiry = new Map();
const KEY_PREFIX = "cloudtalk:";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { action, key, data, ttl } = body;
    const fullKey = `${KEY_PREFIX}${key}`;

    switch (action) {
      case "get":
        if (client?.isReady) {
          try {
            const value = await client.get(fullKey);
            if (value) return { data: JSON.parse(value) };
          } catch (err) {
            console.error("Redis get error:", err);
          }
        }

        if (memoryCache.has(fullKey)) {
          const expiry = memoryCacheExpiry.get(fullKey) || 0;
          if (expiry > Date.now()) {
            return { data: memoryCache.get(fullKey) };
          }
          memoryCache.delete(fullKey);
          memoryCacheExpiry.delete(fullKey);
        }

        return { data: null };

      case "set":
        if (client?.isReady) {
          try {
            await client.set(fullKey, JSON.stringify(data), { EX: ttl || 300 });
          } catch (err) {
            console.error("Redis set error:", err);
          }
        }

        memoryCache.set(fullKey, data);
        memoryCacheExpiry.set(fullKey, Date.now() + (ttl || 300) * 1000);

        return { success: true };

      case "delete":
        if (client?.isReady) {
          try {
            if (key.includes("*")) {
              const keys = await client.keys(`${KEY_PREFIX}${key}`);
              if (keys.length > 0) await client.del(keys);
            } else {
              await client.del(fullKey);
            }
          } catch (err) {
            console.error("Redis delete error:", err);
          }
        }

        if (key.includes("*")) {
          const regex = new RegExp(fullKey.replace(/\*/g, ".*"));
          for (const k of memoryCache.keys()) {
            if (regex.test(k)) {
              memoryCache.delete(k);
              memoryCacheExpiry.delete(k);
            }
          }
        } else {
          memoryCache.delete(fullKey);
          memoryCacheExpiry.delete(fullKey);
        }

        return { success: true };

      default:
        return { error: "Invalid action" };
    }
  } catch (error) {
    console.error("Cache API error:", error);
    return { error: "Server error", message: error.message };
  }
});
