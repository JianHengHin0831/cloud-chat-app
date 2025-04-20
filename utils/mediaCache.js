// media file caching manager
const mediaCache = new Map();
const mediaCacheExpiry = new Map();
const mediaPreloadQueue = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache duration

// get cached media url if available and not expired
export const getCachedMediaUrl = (key) => {
  if (mediaCache.has(key)) {
    const expiry = mediaCacheExpiry.get(key) || 0;
    if (expiry > Date.now()) {
      return mediaCache.get(key);
    }
    mediaCache.delete(key);
    mediaCacheExpiry.delete(key);
  }
  return null;
};

// cache decrypted media url
export const cacheMediaUrl = (key, decryptedUrl) => {
  mediaCache.set(key, decryptedUrl);
  mediaCacheExpiry.set(key, Date.now() + CACHE_DURATION);
};

// add preload task to queue
export const addToPreloadQueue = (key, decryptFn) => {
  if (!mediaPreloadQueue.has(key) && !mediaCache.has(key)) {
    mediaPreloadQueue.set(key, decryptFn);
  }
};

// process tasks in preload queue
export const processPreloadQueue = async () => {
  for (const [key, decryptFn] of mediaPreloadQueue.entries()) {
    try {
      const decryptedUrl = await decryptFn();
      cacheMediaUrl(key, decryptedUrl);
    } catch (error) {
      console.error("Failed to preload media file:", error);
    } finally {
      mediaPreloadQueue.delete(key);
    }
  }
};

// clean expired entries from media cache
export const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, expiry] of mediaCacheExpiry.entries()) {
    if (expiry <= now) {
      mediaCache.delete(key);
      mediaCacheExpiry.delete(key);
    }
  }
};

// run cache cleanup periodically
if (process.client) {
  setInterval(cleanExpiredCache, 5 * 60 * 1000); // clean every 5 minutes
}
