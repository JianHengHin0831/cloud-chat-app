// client-side caching service
const memoryCache = new Map();
const memoryCacheExpiry = new Map();

// message cache prefix
export const MESSAGE_CACHE_PREFIX = "messages_";
const MESSAGE_CACHE_TTL = 36000;
const CACHE_VERSION = "1.0";

// persist cache to localStorage
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

// clean expired cache entries from localStorage
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

// restore cache from localStorage
const restoreCache = () => {
  try {
    const cached = localStorage.getItem("cloudtalk_cache");
    if (cached) {
      const cacheData = JSON.parse(cached);
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

if (typeof window !== "undefined") {
  restoreCache();
  setInterval(persistCache, 60000);
  setInterval(cleanExpiredCache, 300000);
}

// get data from cache
export const getCache = async (key) => {
  try {
    if (memoryCache.has(key)) {
      const expiry = memoryCacheExpiry.get(key) || 0;
      if (expiry > Date.now()) {
        return memoryCache.get(key);
      }
      memoryCache.delete(key);
      memoryCacheExpiry.delete(key);
    }

    const cached = localStorage.getItem("cloudtalk_cache");
    if (cached) {
      const cacheData = JSON.parse(cached);
      if (cacheData.data[key] && cacheData.data[key].expiry > Date.now()) {
        const value = cacheData.data[key].value;
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

// set data to cache
export const setCache = async (key, data, ttl = 36000) => {
  try {
    const effectiveTtl = ttl || 36000;
    const expiry = Date.now() + effectiveTtl * 1000;
    memoryCache.set(key, data);
    memoryCacheExpiry.set(key, expiry);
    persistCache();

    return true;
  } catch (error) {
    console.error("Cache set error:", error);
    return false;
  }
};

// delete cache
export const deleteCache = async (pattern) => {
  try {
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

    persistCache();

    return true;
  } catch (error) {
    console.error("Cache delete error:", error);
    return false;
  }
};

// get cached data with caching functionality
export const getCachedData = async (key, fetchFn, ttl = 300) => {
  const cachedData = await getCache(key);

  if (cachedData) {
    return cachedData;
  }

  const freshData = await fetchFn();

  if (freshData) {
    await setCache(key, freshData, ttl);
  }

  return freshData;
};

// generate message cache key
export const generateMessagesCacheKey = (groupId) => {
  return `${MESSAGE_CACHE_PREFIX}${groupId}`;
};

// cache processed messages
export const cacheProcessedMessages = async (groupId, processedMessages) => {
  const cacheKey = generateMessagesCacheKey(groupId);
  await setCache(cacheKey, processedMessages, MESSAGE_CACHE_TTL);
};

// get cached messages
export const getCachedMessages = async (groupId) => {
  const cacheKey = generateMessagesCacheKey(groupId);
  return await getCache(cacheKey);
};

// update cached messages
export const updateCachedMessages = async (groupId, updateFn) => {
  const cacheKey = generateMessagesCacheKey(groupId);
  const cachedMessages = await getCache(cacheKey);

  if (cachedMessages) {
    const updatedMessages = updateFn(cachedMessages);
    await setCache(cacheKey, updatedMessages, MESSAGE_CACHE_TTL);
  }
};
