// import { createClient } from "redis";
// import { promisify } from "util";

// // 创建 Redis 客户端（带错误处理）
// let client = null;
// let redisEnabled = false;

// try {
//   const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

//   // 只有在设置了 REDIS_ENABLED 环境变量时才启用 Redis
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
//             return false; // 停止重连
//           }
//           return Math.min(attempts * 100, 3000);
//         },
//         connectTimeout: 5000, // 5秒连接超时
//       },
//     });

//     client.on("error", (err) => {
//       console.warn("Redis error, falling back to memory cache:", err.message);
//       redisEnabled = false;
//     });

//     client.on("connect", () => {
//       redisEnabled = true;
//     });

//     // 尝试连接
//     client.connect().catch((err) => {
//       console.warn("Redis connection failed:", err.message);
//       redisEnabled = false;
//     });
//   } else {
//   }
// } catch (err) {
//   console.warn("Redis initialization error:", err.message);
// }

// // 内存缓存作为后备
// const memoryCache = new Map();
// const memoryCacheExpiry = new Map();

// // 缓存 TTL 配置（秒）
// const DEFAULT_TTL = 300; // 5分钟

// // 缓存键前缀
// const KEY_PREFIX = "cloudtalk:";

// /**
//  * 从缓存获取数据
//  * @param {string} key - 缓存键
//  * @returns {Promise<any>} - 缓存的数据或 null
//  */
// export const getCache = async (key) => {
//   const fullKey = `${KEY_PREFIX}${key}`;

//   try {
//     // 如果 Redis 可用，尝试从 Redis 获取
//     if (redisEnabled && client?.isOpen) {
//       const data = await client.get(fullKey);
//       return data ? JSON.parse(data) : null;
//     }

//     // 后备：从内存缓存获取
//     if (memoryCache.has(fullKey)) {
//       const expiry = memoryCacheExpiry.get(fullKey) || 0;
//       if (expiry > Date.now()) {
//         return memoryCache.get(fullKey);
//       } else {
//         // 过期了，删除
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

// /**
//  * 将数据存入缓存
//  * @param {string} key - 缓存键
//  * @param {any} data - 要缓存的数据
//  * @param {number} ttl - 过期时间（秒）
//  * @returns {Promise<boolean>} - 是否成功
//  */
// export const setCache = async (key, data, ttl = DEFAULT_TTL) => {
//   const fullKey = `${KEY_PREFIX}${key}`;

//   try {
//     // 如果 Redis 可用，尝试存入 Redis
//     if (redisEnabled && client?.isOpen) {
//       const serialized = JSON.stringify(data);
//       await client.set(fullKey, serialized, { EX: ttl });
//     }

//     // 同时存入内存缓存（作为后备）
//     memoryCache.set(fullKey, data);
//     memoryCacheExpiry.set(fullKey, Date.now() + ttl * 1000);

//     return true;
//   } catch (error) {
//     console.error("Cache set error:", error);

//     // 即使 Redis 失败，也尝试存入内存缓存
//     memoryCache.set(fullKey, data);
//     memoryCacheExpiry.set(fullKey, Date.now() + ttl * 1000);

//     return false;
//   }
// };

// /**
//  * 删除缓存
//  * @param {string} pattern - 缓存键模式
//  * @returns {Promise<boolean>} - 是否成功
//  */
// export const deleteCache = async (pattern) => {
//   const fullPattern = `${KEY_PREFIX}${pattern}`;

//   try {
//     // 如果 Redis 可用，尝试从 Redis 删除
//     if (redisEnabled && client?.isOpen) {
//       if (pattern.includes("*")) {
//         const keys = await client.keys(fullPattern);
//         if (keys.length > 0) await client.del(keys);
//       } else {
//         await client.del(fullPattern);
//       }
//     }

//     // 同时从内存缓存删除
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

// /**
//  * 带缓存的数据获取函数
//  * @param {string} key - 缓存键
//  * @param {Function} fetchFn - 获取数据的函数
//  * @param {number} ttl - 过期时间（秒）
//  * @returns {Promise<any>} - 数据
//  */
// export const getCachedData = async (key, fetchFn, ttl = DEFAULT_TTL) => {
//   // 尝试从缓存获取
//   const cachedData = await getCache(key);

//   if (cachedData) {
//     return cachedData;
//   }

//   // 缓存未命中，调用获取函数
//   const freshData = await fetchFn();

//   // 将新数据存入缓存
//   if (freshData) {
//     await setCache(key, freshData, ttl);
//   }

//   return freshData;
// };

// // 导出 Redis 客户端

// // export const redisClient = client;
// // helm install metrics-adapter prometheus-community/prometheus-adapter \
// //   --set prometheus.url=http://prometheus-server
// //   紧急优先：
// //   kubectl apply -f redis-ha.yaml  # 先部署高可用Redis
// // kubectl rollout restart deployment/cloudtalk-app  # 重启应用加载新配置
// // 后续优化
// // # 安装监控组件
// // helm install prometheus prometheus-community/kube-prometheus-stack

// // # 更新HPA
// // kubectl apply -f hpa-with-custom-metrics.yaml

// // 验证命令
// // # 检查Redis集群状态
// // kubectl exec -it redis-ha-0 -- redis-cli cluster info

// // # 监控HPA决策
// // watch kubectl get hpa

// // 资源预算
// // # 设置Redis资源上限防止OOM
// // kubectl patch statefulset redis-ha \
// //   --patch '{"spec":{"template":{"spec":{"containers":[{"name":"redis","resources":{"limits":{"memory":"1Gi"}}}]}}}}'

// //   熔断机制
// //   // chatroom-service.js
// // export const getChatroomInfo = async (chatroomId) => {
// //     if (await isCircuitBreakerOpen('firebase')) {
// //       throw new Error('Service unavailable')
// //     }
// //     // ...原有逻辑
// //   }
