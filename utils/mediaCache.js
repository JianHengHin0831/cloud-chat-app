// 媒体文件缓存管理器
const mediaCache = new Map();
const mediaCacheExpiry = new Map();
const mediaPreloadQueue = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存时间

/**
 * 从缓存获取媒体URL
 * @param {string} key - 原始媒体URL
 * @returns {string|null} - 缓存的解密URL或null
 */
export const getCachedMediaUrl = (key) => {
  if (mediaCache.has(key)) {
    const expiry = mediaCacheExpiry.get(key) || 0;
    if (expiry > Date.now()) {
      return mediaCache.get(key);
    }
    // 过期了，删除缓存
    mediaCache.delete(key);
    mediaCacheExpiry.delete(key);
  }
  return null;
};

/**
 * 将解密后的媒体URL存入缓存
 * @param {string} key - 原始媒体URL
 * @param {string} decryptedUrl - 解密后的URL
 */
export const cacheMediaUrl = (key, decryptedUrl) => {
  mediaCache.set(key, decryptedUrl);
  mediaCacheExpiry.set(key, Date.now() + CACHE_DURATION);
};

/**
 * 添加预加载任务
 * @param {string} key - 原始媒体URL
 * @param {Function} decryptFn - 解密函数
 */
export const addToPreloadQueue = (key, decryptFn) => {
  if (!mediaPreloadQueue.has(key) && !mediaCache.has(key)) {
    mediaPreloadQueue.set(key, decryptFn);
  }
};

/**
 * 执行预加载队列中的任务
 */
export const processPreloadQueue = async () => {
  for (const [key, decryptFn] of mediaPreloadQueue.entries()) {
    try {
      const decryptedUrl = await decryptFn();
      cacheMediaUrl(key, decryptedUrl);
    } catch (error) {
      console.error("预加载媒体文件失败:", error);
    } finally {
      mediaPreloadQueue.delete(key);
    }
  }
};

/**
 * 清理过期的缓存
 */
export const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, expiry] of mediaCacheExpiry.entries()) {
    if (expiry <= now) {
      mediaCache.delete(key);
      mediaCacheExpiry.delete(key);
    }
  }
};

// 定期清理过期缓存
if (process.client) {
  setInterval(cleanExpiredCache, 5 * 60 * 1000); // 每5分钟清理一次
}
