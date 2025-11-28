import dotenv from 'dotenv';
import connectDB from '../lib/db/mongodb';
import { Puzzle } from '../lib/db/models';
import { puzzleCache } from '../lib/cache/puzzleCache';
import RedisClient from '../lib/db/redis';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function warmPuzzleCache() {
  try {
    console.log('🔥 Starting cache warming process...\n');

    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Connect to Redis
    const redis = RedisClient.getInstance();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for connection
    console.log('✅ Connected to Redis\n');

    const difficulties = ['easy', 'medium', 'hard'];

    for (const difficulty of difficulties) {
      console.log(`\n📦 Warming cache for ${difficulty} puzzles...`);

      // Fetch puzzles from MongoDB
      const puzzles = await Puzzle.find({ difficulty }).limit(50).lean();

      if (puzzles.length === 0) {
        console.log(`⚠️ No puzzles found for ${difficulty}`);
        continue;
      }

      // Cache puzzles
      await puzzleCache.cachePuzzles(difficulty, puzzles);
      console.log(`✅ Cached ${puzzles.length} ${difficulty} puzzles`);
    }

    // Display cache statistics
    console.log('\n📊 Cache Statistics:');
    const stats = await puzzleCache.getCacheStats();
    console.log(`  - Easy: ${stats.easy} puzzles`);
    console.log(`  - Medium: ${stats.medium} puzzles`);
    console.log(`  - Hard: ${stats.hard} puzzles`);

    console.log('\n✅ Cache warming completed successfully!');
  } catch (error) {
    console.error('❌ Error warming cache:', error);
    process.exit(1);
  } finally {
    // Cleanup connections
    await RedisClient.disconnect();
    process.exit(0);
  }
}

// Run the script
warmPuzzleCache();
