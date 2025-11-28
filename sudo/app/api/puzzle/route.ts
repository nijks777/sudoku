import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Puzzle } from '@/lib/db/models';
import { puzzleCache } from '@/lib/cache/puzzleCache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty');
    const id = searchParams.get('id');

    // If ID is provided, fetch specific puzzle
    if (id) {
      await connectDB();
      const puzzle = await Puzzle.findById(id).lean();

      if (!puzzle) {
        return NextResponse.json(
          { error: 'Puzzle not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: puzzle._id,
        difficulty: puzzle.difficulty,
        gridSize: puzzle.gridSize,
        puzzle: puzzle.puzzle,
        solution: puzzle.solution,
        hints: puzzle.hints,
      });
    }

    // Otherwise, fetch by difficulty
    if (!difficulty) {
      return NextResponse.json(
        { error: 'Either difficulty or id parameter is required' },
        { status: 400 }
      );
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty. Must be easy, medium, or hard' },
        { status: 400 }
      );
    }

    // Try to get puzzle from Redis cache first
    let puzzle = await puzzleCache.getRandomPuzzle(difficulty);

    if (puzzle) {
      console.log(`✅ Cache hit for ${difficulty} puzzle`);
      return NextResponse.json({
        id: puzzle._id,
        difficulty: puzzle.difficulty,
        gridSize: puzzle.gridSize,
        puzzle: puzzle.puzzle,
        solution: puzzle.solution,
        hints: puzzle.hints,
        cached: true,
      });
    }

    // Cache miss - fetch from database
    console.log(`⚠️ Cache miss for ${difficulty} puzzle - fetching from DB`);
    await connectDB();

    // Get puzzles for this difficulty
    const puzzles = await Puzzle.find({ difficulty }).limit(50).lean();

    if (puzzles.length === 0) {
      return NextResponse.json(
        { error: `No puzzles found for difficulty: ${difficulty}` },
        { status: 404 }
      );
    }

    // Cache puzzles in background (non-blocking - fire and forget)
    puzzleCache.cachePuzzles(difficulty, puzzles).catch(err =>
      console.error('Background cache failed:', err)
    );

    // Select random puzzle
    const randomIndex = Math.floor(Math.random() * puzzles.length);
    puzzle = puzzles[randomIndex];

    return NextResponse.json({
      id: puzzle._id,
      difficulty: puzzle.difficulty,
      gridSize: puzzle.gridSize,
      puzzle: puzzle.puzzle,
      solution: puzzle.solution,
      hints: puzzle.hints,
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch puzzle' },
      { status: 500 }
    );
  }
}
