/**
 * Reload Puzzle Cache
 * Clears old cache and reloads all puzzles from database
 */

import dotenv from 'dotenv';
import connectDB from '../lib/db/mongodb';
import { Puzzle } from '../lib/db/models';
import { puzzleCache } from '../lib/cache/puzzleCache';
import RedisClient from '../lib/db/redis';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function reloadPuzzleCache() {
  try {
    console.log('\n🔄 RELOADING PUZZLE CACHE');
    console.log('This will clear old cache and reload all puzzles from database\n');
    console.log('='.repeat(60));

    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Connect to Redis
    console.log('📡 Connecting to Redis...');
    RedisClient.getInstance();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for connection
    console.log('✅ Connected to Redis\n');

    // Step 1: Clear existing puzzle cache
    console.log('🗑️  Step 1: Clearing old puzzle cache...');
    await puzzleCache.clearAll();
    console.log('✅ Old cache cleared\n');

    // Step 2: Reload puzzles from database
    const difficulties = ['easy', 'medium', 'hard'];

    console.log('📦 Step 2: Reloading puzzles from database...\n');

    for (const difficulty of difficulties) {
      console.log(`  ⏳ Loading ${difficulty} puzzles...`);

      // Fetch puzzles for this difficulty (limit 50 for cache)
      const puzzles = await Puzzle.find({ difficulty }).limit(50).lean();

      if (puzzles.length === 0) {
        console.log(`  ⚠️  No puzzles found for ${difficulty}`);
        continue;
      }

      // Cache puzzles
      await puzzleCache.cachePuzzles(difficulty, puzzles);
      console.log(`  ✅ Cached ${puzzles.length} ${difficulty} puzzles\n`);
    }

    // Step 3: Display cache statistics
    console.log('='.repeat(60));
    console.log('📊 CACHE STATISTICS\n');

    const stats = await puzzleCache.getCacheStats();
    console.log(`  • Easy: ${stats.easy} puzzles cached`);
    console.log(`  • Medium: ${stats.medium} puzzles cached`);
    console.log(`  • Hard: ${stats.hard} puzzles cached`);
    console.log(`  • Total: ${stats.easy + stats.medium + stats.hard} puzzles in cache\n`);

    // Step 4: Verify database counts
    console.log('🔍 DATABASE VERIFICATION\n');
    const easyCount = await Puzzle.countDocuments({ difficulty: 'easy' });
    const mediumCount = await Puzzle.countDocuments({ difficulty: 'medium' });
    const hardCount = await Puzzle.countDocuments({ difficulty: 'hard' });
    const totalCount = await Puzzle.countDocuments();

    console.log(`  • Easy: ${easyCount} puzzles in database`);
    console.log(`  • Medium: ${mediumCount} puzzles in database`);
    console.log(`  • Hard: ${hardCount} puzzles in database`);
    console.log(`  • Total: ${totalCount} puzzles in database\n`);

    console.log('='.repeat(60));
    console.log('✅ Cache reload completed successfully!');
    console.log('🎮 Users will now get puzzles from the updated cache\n');

  } catch (error) {
    console.error('\n❌ Error reloading cache:', error);
    process.exit(1);
  } finally {
    // Cleanup connections
    await RedisClient.disconnect();
    process.exit(0);
  }
}

// Run the script
reloadPuzzleCache();
