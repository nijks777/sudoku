import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Game } from '@/lib/db/models';
import { leaderboardCache, LeaderboardEntry } from '@/lib/cache/leaderboardCache';

/**
 * Fetch leaderboard from MongoDB with aggregation
 * Groups by playerName and sums points
 */
async function fetchLeaderboardFromDB(): Promise<LeaderboardEntry[]> {
  await connectDB();

  const leaderboard = await Game.aggregate([
    {
      $group: {
        _id: '$playerName',
        totalPoints: { $sum: '$points' },
        gamesPlayed: { $sum: 1 },
        easyCount: {
          $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] }
        },
        mediumCount: {
          $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] }
        },
        hardCount: {
          $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] }
        },
        games: { $push: { time: '$timeSeconds', difficulty: '$difficulty' } },
      },
    },
    {
      $sort: { totalPoints: -1 }, // Sort by total points descending
    },
    {
      $limit: 100, // Top 100 players
    },
    {
      $project: {
        _id: 0,
        playerName: '$_id',
        totalPoints: 1,
        gamesPlayed: 1,
        easyCount: 1,
        mediumCount: 1,
        hardCount: 1,
        games: 1,
      },
    },
  ]);

  // Add ranks and process best time with difficulty
  return leaderboard.map((entry, index) => {
    // Find the game with minimum time
    const bestGame = entry.games.reduce((min: any, game: any) =>
      game.time < min.time ? game : min
    );

    return {
      rank: index + 1,
      playerName: entry.playerName,
      totalPoints: Math.round(entry.totalPoints * 100) / 100, // Round to 2 decimals
      gamesPlayed: entry.gamesPlayed,
      easyCount: entry.easyCount,
      mediumCount: entry.mediumCount,
      hardCount: entry.hardCount,
      bestTime: bestGame.time,
      bestTimeDifficulty: bestGame.difficulty,
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Validate page number
    if (page < 1) {
      return NextResponse.json(
        { error: 'Page must be greater than 0' },
        { status: 400 }
      );
    }

    let leaderboard: LeaderboardEntry[];
    let cached = false;
    let cachedAt: number | null = null;

    // Force refresh if requested
    if (forceRefresh) {
      console.log('🔄 Force refresh requested');
      leaderboard = await fetchLeaderboardFromDB();
      await leaderboardCache.cache(leaderboard);
      cachedAt = Date.now();
    } else {
      // Try to get from cache first
      const cachedData = await leaderboardCache.get();

      if (cachedData) {
        console.log('✅ Leaderboard cache hit');
        leaderboard = cachedData.data;
        cachedAt = cachedData.cachedAt;
        cached = true;
      } else {
        // Cache miss - fetch from database
        console.log('⚠️ Leaderboard cache miss - fetching from DB');
        leaderboard = await fetchLeaderboardFromDB();
        await leaderboardCache.cache(leaderboard);
        cachedAt = Date.now();
      }
    }

    // Pagination
    const itemsPerPage = 10;
    const totalPlayers = leaderboard.length;
    const totalPages = Math.ceil(totalPlayers / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = leaderboard.slice(startIndex, endIndex);

    // Calculate cache age in seconds
    const cacheAge = cachedAt ? Math.floor((Date.now() - cachedAt) / 1000) : null;

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        currentPage: page,
        totalPages,
        totalPlayers,
        itemsPerPage,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      cached,
      cacheAge, // Age in seconds
      cachedAt,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
