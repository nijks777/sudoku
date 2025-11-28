import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Game } from '@/lib/db/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerName, difficulty, timeSeconds, mistakes, hintsUsed, mode } = body;

    // Validate required fields
    if (!playerName || !difficulty || timeSeconds === undefined || mistakes === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty' },
        { status: 400 }
      );
    }

    // Determine grid size based on difficulty
    const gridSize = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 9;

    // Calculate points based on difficulty
    const basePoints = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 20;

    // Time bonus calculation based on difficulty
    let timeBonus = 0;
    if (difficulty === 'easy') {
      // Easy: Start with 5, reduce by 1 every 30 seconds
      timeBonus = Math.max(0, 5 - Math.floor(timeSeconds / 30));
    } else if (difficulty === 'medium') {
      // Medium: Start with 6, reduce by 1 every 45 seconds
      timeBonus = Math.max(0, 6 - Math.floor(timeSeconds / 45));
    } else {
      // Hard: Start with 10, reduce by 1 every 60 seconds
      timeBonus = Math.max(0, 10 - Math.floor(timeSeconds / 60));
    }

    // Penalty for mistakes (lose 1 point per mistake, min 0)
    const mistakePenalty = mistakes;

    // Penalty for hints (lose 2 points per hint)
    const hintPenalty = (hintsUsed || 0) * 2;

    // Calculate final points (minimum 1 point)
    const points = Math.max(1, basePoints + timeBonus - mistakePenalty - hintPenalty);

    // Connect to database
    await connectDB();

    // Save game to database
    const game = await Game.create({
      playerName,
      difficulty,
      gridSize,
      mode: mode || 'single',
      timeSeconds,
      mistakes,
      hintsUsed: hintsUsed || 0,
      points,
      completedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      game: {
        id: game._id,
        playerName: game.playerName,
        difficulty: game.difficulty,
        timeSeconds: game.timeSeconds,
        mistakes: game.mistakes,
        points: game.points,
        completedAt: game.completedAt,
      },
    });
  } catch (error) {
    console.error('Error saving game:', error);
    return NextResponse.json(
      { error: 'Failed to save game' },
      { status: 500 }
    );
  }
}
