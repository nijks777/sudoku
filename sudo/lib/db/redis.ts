import Redis from 'ioredis';

class RedisClient {
  private static instance: Redis | null = null;

  private constructor() {}

  static getInstance(): Redis {
    if (!this.instance) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.instance = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        lazyConnect: true,
      });

      this.instance.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      this.instance.on('error', (err) => {
        console.error('❌ Redis connection error:', err);
      });

      this.instance.on('close', () => {
        console.log('⚠️ Redis connection closed');
      });

      // Connect immediately
      this.instance.connect().catch((err) => {
        console.error('Failed to connect to Redis:', err);
      });
    }

    return this.instance;
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.quit();
      this.instance = null;
    }
  }

  static isConnected(): boolean {
    return this.instance?.status === 'ready';
  }
}

export default RedisClient;
