import { logger } from "./logger";

type CacheEntry<T> = {
    value: T;
    expiry: number;
};

class InMemoryCache {
    private cache: Map<string, CacheEntry<any>> = new Map();

    /**
     * Set a value in the cache
     * @param key Unique key
     * @param value Value to store
     * @param ttlSeconds Time to live in seconds (default 60)
     */
    set<T>(key: string, value: T, ttlSeconds: number = 60): void {
        const expiry = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, { value, expiry });
        logger.debug(`Cache set: ${key}`, { ttl: ttlSeconds });
    }

    /**
     * Get a value from the cache
     * @param key Unique key
     * @returns The value or null if expired/not found
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            logger.debug(`Cache expired: ${key}`);
            return null;
        }

        logger.debug(`Cache hit: ${key}`);
        return entry.value;
    }

    /**
     * Delete a specific key
     */
    del(key: string): void {
        this.cache.delete(key);
        logger.debug(`Cache deleted: ${key}`);
    }

    /**
     * Clear the entire cache
     */
    clear(): void {
        this.cache.clear();
        logger.debug('Cache cleared');
    }
}

export const cache = new InMemoryCache();
