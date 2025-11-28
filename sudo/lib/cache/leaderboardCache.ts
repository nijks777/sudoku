import RedisClient from '../db/redis';

const LEADERBOARD_CACHE_KEY = 'leaderboard:global';
const LEADERBOARD_TTL = 600; // 10 minutes

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  totalPoints: number;
  gamesPlayed: number;
  easyCount?: number;
  mediumCount?: number;
  hardCount?: number;
  bestTime?: number;
  bestTimeDifficulty?: string;
}

export class LeaderboardCache {
  private redis = RedisClient.getInstance();

  /**
   * Cache leaderboard data with timestamp
   */
  async cache(leaderboard: LeaderboardEntry[]): Promise<void> {
    try {
      const cacheData = {
        data: leaderboard,
        cachedAt: Date.now(),
      };
      const serialized = JSON.stringify(cacheData);
      await this.redis.setex(LEADERBOARD_CACHE_KEY, LEADERBOARD_TTL, serialized);
      console.log(`✅ Cached leaderboard with ${leaderboard.length} entries`);
    } catch (error) {
      console.error('⚠️ Failed to cache leaderboard:', error instanceof Error ? error.message : error);
      // Don't throw - allow app to continue without caching
    }
  }

  /**
   * Get leaderboard from cache with metadata
   * Returns null if cache miss
   */
  async get(): Promise<{ data: LeaderboardEntry[]; cachedAt: number } | null> {
    try {
      const cached = await this.redis.get(LEADERBOARD_CACHE_KEY);

      if (!cached) {
        console.log('⚠️ Leaderboard cache miss');
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      console.error('Error getting leaderboard from cache:', error);
      return null;
    }
  }

  /**
   * Check if leaderboard is cached
   */
  async isCached(): Promise<boolean> {
    try {
      const exists = await this.redis.exists(LEADERBOARD_CACHE_KEY);
      return exists === 1;
    } catch (error) {
      console.error('Error checking leaderboard cache:', error);
      return false;
    }
  }

  /**
   * Get TTL (time to live) for cached leaderboard
   */
  async getTTL(): Promise<number> {
    try {
      return await this.redis.ttl(LEADERBOARD_CACHE_KEY);
    } catch (error) {
      console.error('Error getting leaderboard TTL:', error);
      return -1;
    }
  }

  /**
   * Invalidate (clear) leaderboard cache
   * Should be called when a new game is completed
   */
  async invalidate(): Promise<void> {
    try {
      await this.redis.del(LEADERBOARD_CACHE_KEY);
      console.log('✅ Leaderboard cache invalidated');
    } catch (error) {
      console.error('Error invalidating leaderboard cache:', error);
      throw error;
    }
  }

  /**
   * Get cache info (exists, TTL, size)
   */
  async getCacheInfo(): Promise<{
    exists: boolean;
    ttl: number;
    entries: number;
  }> {
    try {
      const exists = await this.isCached();
      const ttl = await this.getTTL();
      let entries = 0;

      if (exists) {
        const leaderboard = await this.get();
        entries = leaderboard?.data.length || 0;
      }

      return { exists, ttl, entries };
    } catch (error) {
      console.error('Error getting cache info:', error);
      return { exists: false, ttl: -1, entries: 0 };
    }
  }

  /**
   * Warm up cache with leaderboard data
   */
  async warmup(fetchLeaderboard: () => Promise<LeaderboardEntry[]>): Promise<void> {
    try {
      const isCached = await this.isCached();

      if (!isCached) {
        console.log('🔥 Warming up leaderboard cache...');
        const leaderboard = await fetchLeaderboard();
        await this.cache(leaderboard);
      } else {
        console.log('✅ Leaderboard cache already warm');
      }
    } catch (error) {
      console.error('Error warming up leaderboard cache:', error);
      throw error;
    }
  }

  /**
   * Refresh cache (force update)
   */
  async refresh(fetchLeaderboard: () => Promise<LeaderboardEntry[]>): Promise<void> {
    try {
      console.log('🔄 Refreshing leaderboard cache...');
      const leaderboard = await fetchLeaderboard();
      await this.cache(leaderboard);
    } catch (error) {
      console.error('Error refreshing leaderboard cache:', error);
      throw error;
    }
  }
}

export const leaderboardCache = new LeaderboardCache();
