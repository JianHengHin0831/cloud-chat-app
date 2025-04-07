// 客户端缓存服务
const memoryCache = new Map();
const memoryCacheExpiry = new Map();

// 消息缓存相关常量
export const MESSAGE_CACHE_PREFIX = "messages_";
const MESSAGE_CACHE_TTL = 36000;
const CACHE_VERSION = "1.0";

// 持久化缓存到 localStorage
const persistCache = () => {
  const cacheData = {
    version: CACHE_VERSION,
    timestamp: Date.now(),
    data: {},
  };
  memoryCache.forEach((value, key) => {
    const expiry = memoryCacheExpiry.get(key);
    if (expiry && expiry > Date.now()) {
      cacheData.data[key] = { value, expiry };
    }
  });
  try {
    localStorage.setItem("cloudtalk_cache", JSON.stringify(cacheData));
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      // 如果存储空间不足，清理过期数据
      cleanExpiredCache();
      try {
        localStorage.setItem("cloudtalk_cache", JSON.stringify(cacheData));
      } catch (retryError) {
        console.warn("Cache persistence failed after cleanup:", retryError);
      }
    } else {
      console.warn("Cache persistence failed:", e);
    }
  }
};

// 清理过期缓存
const cleanExpiredCache = () => {
  const now = Date.now();
  const cached = localStorage.getItem("cloudtalk_cache");
  if (cached) {
    try {
      const cacheData = JSON.parse(cached);
      const newData = {};
      Object.entries(cacheData.data).forEach(([key, entry]) => {
        if (entry.expiry > now) {
          newData[key] = entry;
        }
      });
      cacheData.data = newData;
      localStorage.setItem("cloudtalk_cache", JSON.stringify(cacheData));
    } catch (e) {
      console.warn("Cache cleanup failed:", e);
    }
  }
};

// 从 localStorage 恢复缓存
const restoreCache = () => {
  try {
    const cached = localStorage.getItem("cloudtalk_cache");
    if (cached) {
      const cacheData = JSON.parse(cached);
      // 检查缓存版本
      if (cacheData.version !== CACHE_VERSION) {
        localStorage.removeItem("cloudtalk_cache");
        return;
      }
      Object.entries(cacheData.data).forEach(([key, { value, expiry }]) => {
        if (expiry > Date.now()) {
          memoryCache.set(key, value);
          memoryCacheExpiry.set(key, expiry);
        }
      });
    }
  } catch (e) {
    console.warn("Cache restoration failed:", e);
  }
};

// 初始化时恢复缓存
if (typeof window !== "undefined") {
  restoreCache();
  // 定期持久化缓存和清理
  setInterval(persistCache, 60000); // 每分钟持久化
  setInterval(cleanExpiredCache, 300000); // 每5分钟清理过期缓存
}

/**
 * 从缓存获取数据
 * @param {string} key - 缓存键
 * @returns {Promise<any>} - 缓存的数据或 null
 */
export const getCache = async (key) => {
  try {
    // 先检查内存缓存
    if (memoryCache.has(key)) {
      const expiry = memoryCacheExpiry.get(key) || 0;
      if (expiry > Date.now()) {
        return memoryCache.get(key);
      }
      // 过期了，删除
      memoryCache.delete(key);
      memoryCacheExpiry.delete(key);
    }

    // 从localStorage获取
    const cached = localStorage.getItem("cloudtalk_cache");
    if (cached) {
      const cacheData = JSON.parse(cached);
      if (cacheData.data[key] && cacheData.data[key].expiry > Date.now()) {
        const value = cacheData.data[key].value;
        // 存入内存缓存
        memoryCache.set(key, value);
        memoryCacheExpiry.set(key, cacheData.data[key].expiry);
        return value;
      }
    }

    return null;
  } catch (error) {
    console.error("Cache get error:", error);
    return null;
  }
};

/**
 * 将数据存入缓存
 * @param {string} key - 缓存键
 * @param {any} data - 要缓存的数据
 * @param {number} ttl - 过期时间（秒）
 * @returns {Promise<boolean>} - 是否成功
 */
export const setCache = async (key, data, ttl = 36000) => {
  try {
    // 存入内存缓存，使用更长的默认过期时间
    const effectiveTtl = ttl || 36000; // 默认30分钟
    const expiry = Date.now() + effectiveTtl * 1000;
    memoryCache.set(key, data);
    memoryCacheExpiry.set(key, expiry);
    // 触发缓存持久化
    persistCache();

    return true;
  } catch (error) {
    console.error("Cache set error:", error);
    return false;
  }
};

/**
 * 删除缓存
 * @param {string} pattern - 缓存键模式
 * @returns {Promise<boolean>} - 是否成功
 */
export const deleteCache = async (pattern) => {
  try {
    // 从内存缓存删除
    if (pattern.includes("*")) {
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key);
          memoryCacheExpiry.delete(key);
        }
      }
    } else {
      memoryCache.delete(pattern);
      memoryCacheExpiry.delete(pattern);
    }

    // 触发缓存持久化
    persistCache();

    return true;
  } catch (error) {
    console.error("Cache delete error:", error);
    return false;
  }
};

/**
 * 带缓存的数据获取函数
 * @param {string} key - 缓存键
 * @param {Function} fetchFn - 获取数据的函数
 * @param {number} ttl - 过期时间（秒）
 * @returns {Promise<any>} - 数据
 */
export const getCachedData = async (key, fetchFn, ttl = 300) => {
  // 尝试从缓存获取
  const cachedData = await getCache(key);

  if (cachedData) {
    return cachedData;
  }

  // 缓存未命中，调用获取函数
  const freshData = await fetchFn();

  // 将新数据存入缓存
  if (freshData) {
    await setCache(key, freshData, ttl);
  }

  return freshData;
};

/**
 * 生成消息缓存键
 * @param {string} groupId - 群组ID
 * @returns {string} - 缓存键
 */
export const generateMessagesCacheKey = (groupId) => {
  return `${MESSAGE_CACHE_PREFIX}${groupId}`;
};

/**
 * 缓存处理后的消息数据
 * @param {string} groupId - 群组ID
 * @param {Array} processedMessages - 处理后的消息数据
 */
export const cacheProcessedMessages = async (groupId, processedMessages) => {
  const cacheKey = generateMessagesCacheKey(groupId);
  await setCache(cacheKey, processedMessages, MESSAGE_CACHE_TTL);
};

/**
 * 获取缓存的消息数据
 * @param {string} groupId - 群组ID
 * @returns {Promise<Array|null>} - 缓存的消息数据
 */
export const getCachedMessages = async (groupId) => {
  const cacheKey = generateMessagesCacheKey(groupId);
  return await getCache(cacheKey);
};

/**
 * 更新缓存中的消息数据
 * @param {string} groupId - 群组ID
 * @param {Function} updateFn - 更新函数
 */
export const updateCachedMessages = async (groupId, updateFn) => {
  const cacheKey = generateMessagesCacheKey(groupId);
  const cachedMessages = await getCache(cacheKey);

  if (cachedMessages) {
    const updatedMessages = updateFn(cachedMessages);
    await setCache(cacheKey, updatedMessages, MESSAGE_CACHE_TTL);
  }
};
