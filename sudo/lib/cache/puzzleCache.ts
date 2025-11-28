import RedisClient from '../db/redis';
import { IPuzzle } from '../db/models';

const PUZZLE_CACHE_KEY_PREFIX = 'puzzles:';
const PUZZLE_POOL_SIZE = 50; // Cache 50 puzzles per difficulty
const PUZZLE_TTL = 86400; // 24 hours

export class PuzzleCache {
  private redis = RedisClient.getInstance();

  /**
   * Get cache key for a difficulty level
   */
  private getKey(difficulty: string): string {
    return `${PUZZLE_CACHE_KEY_PREFIX}${difficulty}`;
  }

  /**
   * Cache puzzles for a specific difficulty
   * Stores puzzles as a JSON array in Redis
   */
  async cachePuzzles(difficulty: string, puzzles: IPuzzle[]): Promise<void> {
    try {
      const key = this.getKey(difficulty);
      const serialized = JSON.stringify(puzzles);
      await this.redis.setex(key, PUZZLE_TTL, serialized);
      console.log(`✅ Cached ${puzzles.length} ${difficulty} puzzles`);
    } catch (error) {
      console.error(`⚠️ Failed to cache puzzles for ${difficulty}:`, error instanceof Error ? error.message : error);
      // Don't throw - allow app to continue without caching
    }
  }

  /**
   * Get a random puzzle from cache
   * Returns null if cache miss
   */
  async getRandomPuzzle(difficulty: string): Promise<IPuzzle | null> {
    try {
      const key = this.getKey(difficulty);
      const cached = await this.redis.get(key);

      if (!cached) {
        console.log(`⚠️ Cache miss for ${difficulty} puzzles`);
        return null;
      }

      const puzzles: IPuzzle[] = JSON.parse(cached);

      if (puzzles.length === 0) {
        return null;
      }

      // Return random puzzle from cache
      const randomIndex = Math.floor(Math.random() * puzzles.length);
      return puzzles[randomIndex];
    } catch (error) {
      console.error(`Error getting puzzle from cache for ${difficulty}:`, error);
      return null;
    }
  }

  /**
   * Check if puzzles are cached for a difficulty
   */
  async isCached(difficulty: string): Promise<boolean> {
    try {
      const key = this.getKey(difficulty);
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error(`Error checking cache for ${difficulty}:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    easy: number;
    medium: number;
    hard: number;
  }> {
    try {
      const stats = {
        easy: 0,
        medium: 0,
        hard: 0,
      };

      for (const difficulty of ['easy', 'medium', 'hard']) {
        const key = this.getKey(difficulty);
        const cached = await this.redis.get(key);
        if (cached) {
          const puzzles: IPuzzle[] = JSON.parse(cached);
          stats[difficulty as keyof typeof stats] = puzzles.length;
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { easy: 0, medium: 0, hard: 0 };
    }
  }

  /**
   * Clear all puzzle caches
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${PUZZLE_CACHE_KEY_PREFIX}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`✅ Cleared ${keys.length} puzzle cache keys`);
      }
    } catch (error) {
      console.error('Error clearing puzzle cache:', error);
      throw error;
    }
  }

  /**
   * Clear cache for specific difficulty
   */
  async clear(difficulty: string): Promise<void> {
    try {
      const key = this.getKey(difficulty);
      await this.redis.del(key);
      console.log(`✅ Cleared cache for ${difficulty} puzzles`);
    } catch (error) {
      console.error(`Error clearing cache for ${difficulty}:`, error);
      throw error;
    }
  }

  /**
   * Warm up cache with puzzles from database
   * Should be called on application startup or when cache is empty
   */
  async warmup(
    difficulty: string,
    fetchPuzzles: () => Promise<IPuzzle[]>
  ): Promise<void> {
    try {
      const isCached = await this.isCached(difficulty);

      if (!isCached) {
        console.log(`🔥 Warming up cache for ${difficulty} puzzles...`);
        const puzzles = await fetchPuzzles();
        await this.cachePuzzles(difficulty, puzzles);
      } else {
        console.log(`✅ Cache already warm for ${difficulty} puzzles`);
      }
    } catch (error) {
      console.error(`Error warming up cache for ${difficulty}:`, error);
      throw error;
    }
  }
}

export const puzzleCache = new PuzzleCache();
