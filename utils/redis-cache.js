// import { createClient } from "redis";
// import { promisify } from "util";

// // create redis client with error handling
// let client = null;
// let redisEnabled = false;

// try {
//   const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

//   // only enable redis if REDIS_ENABLED environment variable is set
//   if (process.env.REDIS_ENABLED === "true") {
//     client = createClient({
//       url: redisUrl,
//       socket: {
//         reconnectStrategy: (attempts) => {
//           if (attempts > 5) {
//             console.warn(
//               "Redis connection failed after 5 attempts, disabling Redis"
//             );
//             redisEnabled = false;
//             return false; // stop reconnecting
//           }
//           return Math.min(attempts * 100, 3000);
//         },
//         connectTimeout: 5000, // 5 second connection timeout
//       },
//     });

//     client.on("error", (err) => {
//       console.warn("Redis error, falling back to memory cache:", err.message);
//       redisEnabled = false;
//     });

//     client.on("connect", () => {
//       redisEnabled = true;
//     });

//     // try to connect
//     client.connect().catch((err) => {
//       console.warn("Redis connection failed:", err.message);
//       redisEnabled = false;
//     });
//   } else {
//   }
// } catch (err) {
//   console.warn("Redis initialization error:", err.message);
// }

// // memory cache as fallback
// const memoryCache = new Map();
// const memoryCacheExpiry = new Map();

// // cache ttl configuration (seconds)
// const DEFAULT_TTL = 300; // 5 minutes

// // cache key prefix
// const KEY_PREFIX = "cloudtalk:";

// // get data from cache
// export const getCache = async (key) => {
//   const fullKey = `${KEY_PREFIX}${key}`;

//   try {
//     // if redis is available, try to get from redis
//     if (redisEnabled && client?.isOpen) {
//       const data = await client.get(fullKey);
//       return data ? JSON.parse(data) : null;
//     }

//     // fallback: get from memory cache
//     if (memoryCache.has(fullKey)) {
//       const expiry = memoryCacheExpiry.get(fullKey) || 0;
//       if (expiry > Date.now()) {
//         return memoryCache.get(fullKey);
//       } else {
//         // expired, delete
//         memoryCache.delete(fullKey);
//         memoryCacheExpiry.delete(fullKey);
//       }
//     }

//     return null;
//   } catch (error) {
//     console.error("Cache get error:", error);
//     return null;
//   }
// };

// // set data in cache
// export const setCache = async (key, data, ttl = DEFAULT_TTL) => {
//   const fullKey = `${KEY_PREFIX}${key}`;

//   try {
//     // if redis is available, try to store in redis
//     if (redisEnabled && client?.isOpen) {
//       const serialized = JSON.stringify(data);
//       await client.set(fullKey, serialized, { EX: ttl });
//     }

//     // also store in memory cache as backup
//     memoryCache.set(fullKey, data);
//     memoryCacheExpiry.set(fullKey, Date.now() + ttl * 1000);

//     return true;
//   } catch (error) {
//     console.error("Cache set error:", error);

//     // even if redis fails, try to store in memory cache
//     memoryCache.set(fullKey, data);
//     memoryCacheExpiry.set(fullKey, Date.now() + ttl * 1000);

//     return false;
//   }
// };

// // delete data from cache
// export const deleteCache = async (pattern) => {
//   const fullPattern = `${KEY_PREFIX}${pattern}`;

//   try {
//     if (redisEnabled && client?.isOpen) {
//       if (pattern.includes("*")) {
//         const keys = await client.keys(fullPattern);
//         if (keys.length > 0) await client.del(keys);
//       } else {
//         await client.del(fullPattern);
//       }
//     }

//     if (pattern.includes("*")) {
//       const regex = new RegExp(fullPattern.replace(/\*/g, ".*"));
//       for (const key of memoryCache.keys()) {
//         if (regex.test(key)) {
//           memoryCache.delete(key);
//           memoryCacheExpiry.delete(key);
//         }
//       }
//     } else {
//       memoryCache.delete(fullPattern);
//       memoryCacheExpiry.delete(fullPattern);
//     }

//     return true;
//   } catch (err) {
//     console.error("Cache delete error:", err);
//     return false;
//   }
// };

// // get data with cache
// export const getCachedData = async (key, fetchFn, ttl = DEFAULT_TTL) => {
//   // try to get from cache
//   const cachedData = await getCache(key);

//   if (cachedData) {
//     return cachedData;
//   }

//   // cache miss, call fetch function
//   const freshData = await fetchFn();

//   // store new data in cache
//   if (freshData) {
//     await setCache(key, freshData, ttl);
//   }

//   return freshData;
// };

// // export redis client
