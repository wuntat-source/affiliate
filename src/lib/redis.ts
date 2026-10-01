import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 3000);
        return delay;
      },
    });

    redisClient.on("error", (err) => {
      // Graceful log without crashing the whole server
      console.warn("[Redis] Connection notice:", err.message);
    });
  }

  return redisClient;
}
