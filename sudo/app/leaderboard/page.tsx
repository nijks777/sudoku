'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LeaderboardEntry {
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

interface LeaderboardResponse {
  data: LeaderboardEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPlayers: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  cached: boolean;
  cacheAge: number | null;
  cachedAt: number | null;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<LeaderboardEntry[]>([]);

  const fetchLeaderboard = async (page: number, forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const url = `/api/leaderboard?page=${page}${forceRefresh ? '&refresh=true' : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data: LeaderboardResponse = await response.json();
      setLeaderboard(data);
      setFilteredData(data.data);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(1);
  }, []);

  // Filter leaderboard based on search query
  useEffect(() => {
    if (!leaderboard) return;

    if (searchQuery.trim() === '') {
      setFilteredData(leaderboard.data);
    } else {
      const filtered = leaderboard.data.filter((entry) =>
        entry.playerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, leaderboard]);

  const handleRefresh = () => {
    fetchLeaderboard(currentPage, true);
  };

  const handlePageChange = (newPage: number) => {
    setSearchQuery(''); // Clear search when changing pages
    fetchLeaderboard(newPage);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCacheAge = (ageInSeconds: number | null) => {
    if (ageInSeconds === null) return 'Just now';
    if (ageInSeconds < 60) return `${ageInSeconds}s ago`;
    const minutes = Math.floor(ageInSeconds / 60);
    return `${minutes}m ago`;
  };

  if (loading && !leaderboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-600 mx-auto mb-4"></div>
          <p className="text-orange-800 text-lg">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 to-orange-100">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => fetchLeaderboard(1)}
            className="w-full bg-orange-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-orange-700 transition cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 to-orange-100 py-8 px-4">
      {/* Home Button - Top Right */}
      <Link
        href="/"
        className="absolute left-8 top-8 cursor-pointer rounded-full border-2 border-orange-500/60 bg-orange-100/90 px-6 py-2 font-semibold text-orange-800 backdrop-blur-sm transition-all hover:border-orange-600 hover:bg-orange-200 hover:shadow-lg"
      >
        ← Home
      </Link>
      <div className="max-w-4xl mx-auto">


        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-orange-800 mb-4">
            🏆 Leaderboard
          </h1>
          <p className="text-orange-700 text-lg">
            Top {leaderboard?.pagination.totalPlayers || 0} Players
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search player by name..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full py-3 px-4 pr-24 rounded-lg border-2 border-orange-200 focus:border-orange-500 focus:outline-none text-gray-800 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-100 text-orange-600 py-1 px-3 rounded-md hover:bg-orange-200 transition cursor-pointer text-sm font-semibold"
              >
                Clear
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              Found {filteredData.length} player(s) matching "{searchQuery}"
            </p>
          )}
        </div>

        {/* Cache Info & Refresh */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {leaderboard?.cached ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Cached: {formatCacheAge(leaderboard.cacheAge)}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Fresh from database
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              Updates every 10 minutes
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {refreshing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                Refreshing...
              </>
            ) : (
              <>
                🔄 Refresh
              </>
            )}
          </button>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-orange-600 text-white">
                <tr>
                  <th className="py-4 px-6 text-left font-semibold">Rank</th>
                  <th className="py-4 px-6 text-left font-semibold">Player</th>
                  <th className="py-4 px-6 text-right font-semibold">Points</th>
                  <th className="py-4 px-6 text-center font-semibold">Problems Solved</th>
                  <th className="py-4 px-6 text-center font-semibold">Best Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((entry, index) => (
                    <tr
                      key={entry.rank}
                      className={`border-b border-orange-100 hover:bg-orange-50 transition ${
                        index % 2 === 0 ? 'bg-white' : 'bg-orange-50/30'
                      } ${searchQuery && 'bg-yellow-50'}`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {entry.rank === 1 && <span className="text-2xl">🥇</span>}
                          {entry.rank === 2 && <span className="text-2xl">🥈</span>}
                          {entry.rank === 3 && <span className="text-2xl">🥉</span>}
                          <span className="font-bold text-orange-800">
                            #{entry.rank}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-gray-800">
                          {entry.playerName}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-bold text-orange-600 text-lg">
                          {entry.totalPoints.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-gray-700">
                        <div className="text-sm">
                          <div className="font-bold text-gray-800 mb-1">{entry.gamesPlayed} total</div>
                          <div className="text-xs text-gray-600">
                            {entry.easyCount ? `${entry.easyCount} easy` : ''}
                            {entry.easyCount && (entry.mediumCount || entry.hardCount) ? ', ' : ''}
                            {entry.mediumCount ? `${entry.mediumCount} medium` : ''}
                            {entry.mediumCount && entry.hardCount ? ', ' : ''}
                            {entry.hardCount ? `${entry.hardCount} hard` : ''}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-green-600 font-semibold">
                        <div>
                          {formatTime(entry.bestTime)}
                          {entry.bestTimeDifficulty && (
                            <span className="ml-1 text-xs text-gray-500">
                              ({entry.bestTimeDifficulty})
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No players found matching "{searchQuery}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {leaderboard && leaderboard.pagination.totalPages > 1 && !searchQuery && (
            <div className="bg-orange-50 px-6 py-4 flex items-center justify-between border-t border-orange-200">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!leaderboard.pagination.hasPrev || loading}
                className="bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                ← Previous
              </button>
              <div className="text-orange-800 font-semibold">
                Page {leaderboard.pagination.currentPage} of{' '}
                {leaderboard.pagination.totalPages}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!leaderboard.pagination.hasNext || loading}
                className="bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next →
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
