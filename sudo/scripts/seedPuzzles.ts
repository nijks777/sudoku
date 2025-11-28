/**
 * Seed Database with Pre-generated Sudoku Puzzles
 * Generates 25 puzzles per difficulty (75 total)
 */

// Load environment variables BEFORE any other imports
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import connectDB from '../lib/db/mongodb';
import { Puzzle } from '../lib/db/models';
import { GridFactory } from '../lib/game/GridFactory';
import { SudokuGenerator } from '../lib/sudoku/generator';
import { Difficulty } from '../lib/sudoku/types';
import { puzzleCache } from '../lib/cache/puzzleCache';
import RedisClient from '../lib/db/redis';

const PUZZLES_PER_DIFFICULTY = 5; // Generating 5 additional tougher puzzles

interface GenerationStats {
  difficulty: Difficulty;
  gridSize: number;
  count: number;
  totalTime: number;
  avgTime: number;
}

async function generatePuzzlesForDifficulty(
  difficulty: Difficulty
): Promise<GenerationStats> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 Generating ${PUZZLES_PER_DIFFICULTY} puzzles for ${difficulty.toUpperCase()} difficulty`);
  console.log('='.repeat(60));

  // Get grid size for difficulty (easy=4x4, medium=6x6, hard=9x9)
  const gridSize = GridFactory.getGridSizeForDifficulty(difficulty);
  const gridConfig = GridFactory.createGrid(gridSize);
  const generator = new SudokuGenerator(gridConfig.getConfig());

  const startTime = Date.now();
  let successCount = 0;

  for (let i = 0; i < PUZZLES_PER_DIFFICULTY; i++) {
    try {
      // Generate puzzle
      const generatedPuzzle = generator.generate(difficulty);

      // Generate hints
      const hints = generator.generateHints(
        generatedPuzzle.puzzle,
        generatedPuzzle.solution,
        3
      );

      // Save to database
      await Puzzle.create({
        difficulty,
        gridSize,
        puzzle: generatedPuzzle.puzzle,
        solution: generatedPuzzle.solution,
        hints,
      });

      successCount++;

      // Progress indicator
      const progress = Math.floor(((i + 1) / PUZZLES_PER_DIFFICULTY) * 100);
      process.stdout.write(`\r  Progress: [${'█'.repeat(progress / 2)}${' '.repeat(50 - progress / 2)}] ${progress}% (${i + 1}/${PUZZLES_PER_DIFFICULTY})`);
    } catch (error) {
      console.error(`\n  ❌ Error generating puzzle ${i + 1}:`, error);
    }
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / successCount;

  console.log('\n');
  console.log(`  ✅ Successfully generated ${successCount} puzzles`);
  console.log(`  ⏱️  Total time: ${totalTime}ms`);
  console.log(`  📊 Average time per puzzle: ${avgTime.toFixed(2)}ms`);

  return {
    difficulty,
    gridSize,
    count: successCount,
    totalTime,
    avgTime,
  };
}

async function seedDatabase() {
  console.log('\n🎮 SUDOKU PUZZLE DATABASE SEEDING');
  console.log('Generating 15 NEW tougher puzzles (5 per difficulty)\n');

  try {
    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Check existing puzzles (NOT clearing - we're adding to existing)
    const existingCount = await Puzzle.countDocuments();
    console.log(`📊 Current database has ${existingCount} existing puzzles`);
    console.log('➕ Adding 5 new tougher puzzles per difficulty...\n');

    // Generate puzzles for each difficulty
    const stats: GenerationStats[] = [];

    // Easy (4x4)
    stats.push(await generatePuzzlesForDifficulty('easy'));

    // Medium (6x6)
    stats.push(await generatePuzzlesForDifficulty('medium'));

    // Hard (9x9)
    stats.push(await generatePuzzlesForDifficulty('hard'));

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 GENERATION SUMMARY');
    console.log('='.repeat(60));

    console.log('\n  Puzzles Generated:');
    let totalPuzzles = 0;
    let totalTime = 0;

    stats.forEach((stat) => {
      console.log(`    • ${stat.difficulty.toUpperCase()} (${stat.gridSize}×${stat.gridSize}): ${stat.count} puzzles in ${stat.totalTime}ms (avg: ${stat.avgTime.toFixed(2)}ms)`);
      totalPuzzles += stat.count;
      totalTime += stat.totalTime;
    });

    console.log(`\n  Total: ${totalPuzzles} NEW puzzles generated in ${totalTime}ms`);

    // Verify database
    console.log('\n🔍 Verifying database...');
    const easyCount = await Puzzle.countDocuments({ difficulty: 'easy' });
    const mediumCount = await Puzzle.countDocuments({ difficulty: 'medium' });
    const hardCount = await Puzzle.countDocuments({ difficulty: 'hard' });
    const totalCount = await Puzzle.countDocuments();

    console.log(`  • Easy: ${easyCount} puzzles (added ${stats.find(s => s.difficulty === 'easy')?.count || 0} new)`);
    console.log(`  • Medium: ${mediumCount} puzzles (added ${stats.find(s => s.difficulty === 'medium')?.count || 0} new)`);
    console.log(`  • Hard: ${hardCount} puzzles (added ${stats.find(s => s.difficulty === 'hard')?.count || 0} new)`);
    console.log(`  • Total: ${totalCount} puzzles in database`);

    // Verify NO zeros in solutions
    console.log('\n🔍 Verifying solutions have no zeros...');
    const allPuzzles = await Puzzle.find({});
    let invalidCount = 0;

    for (const puzzle of allPuzzles) {
      const hasZeros = puzzle.solution.some((row: number[]) => row.includes(0));
      if (hasZeros) {
        invalidCount++;
        console.log(`  ❌ Invalid solution found in ${puzzle.difficulty} puzzle (ID: ${puzzle._id})`);
      }
    }

    if (invalidCount === 0) {
      console.log(`  ✅ All ${totalCount} solutions are complete (no zeros)!`);
    } else {
      console.log(`  ❌ Found ${invalidCount} invalid solutions with zeros!`);
      throw new Error('Database contains invalid puzzles with zeros in solutions');
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`✅ Added ${totalPuzzles} new tougher puzzles to the database!`);

    // Auto-clear cache so new puzzles are available immediately
    console.log('\n🔄 Clearing puzzle cache...');
    try {
      RedisClient.getInstance();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for Redis connection
      await puzzleCache.clearAll();
      console.log('✅ Puzzle cache cleared - next request will load all 45 puzzles!');
    } catch (cacheError) {
      console.warn('⚠️  Warning: Could not clear cache:', cacheError instanceof Error ? cacheError.message : cacheError);
      console.log('💡 You can manually clear cache with: npm run cache:reload');
    }

    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    // Close database and Redis connections
    await RedisClient.disconnect();
    await mongoose.connection.close();
    console.log('👋 Connections closed\n');
  }
}

// Run seeding
seedDatabase();
