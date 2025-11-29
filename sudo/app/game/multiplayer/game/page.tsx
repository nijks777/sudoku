'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useMultiplayer } from '@/lib/socket/useMultiplayer';

interface Cell {
  value: number;
  isInitial: boolean;
  isValid: boolean;
  isSelected: boolean;
}

interface PuzzleData {
  id: string;
  difficulty: string;
  gridSize: number;
  puzzle: number[][];
  solution: number[][];
  hints: Array<{ row: number; col: number; value: number }>;
}

function MultiplayerGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('roomCode');
  const playerName = searchParams.get('name');
  const difficulty = searchParams.get('difficulty');
  const puzzleIdFromUrl = searchParams.get('puzzleId');

  const {
    isConnected,
    room,
    error: socketError,
    opponentProgress,
    updateProgress,
    gameComplete,
    leaveRoom,
  } = useMultiplayer();

  const [videoLoaded, setVideoLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [points, setPoints] = useState(0);
  const [saving, setSaving] = useState(false);
  const [myProgress, setMyProgress] = useState(0);
  const [hintMode, setHintMode] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [freezeTimeLeft, setFreezeTimeLeft] = useState(0);
  const [opponentLeft, setOpponentLeft] = useState(false);

  // Fetch puzzle on mount using the puzzleId from URL or room
  useEffect(() => {
    const puzzleId = puzzleIdFromUrl || room?.puzzleId;
    console.log('Puzzle ID from URL:', puzzleIdFromUrl);
    console.log('Puzzle ID from room:', room?.puzzleId);
    console.log('Using puzzle ID:', puzzleId);

    if (puzzleId) {
      fetchPuzzleById(puzzleId);
    }
  }, [puzzleIdFromUrl, room?.puzzleId]);

  // Timer - start when puzzle is loaded or when game status is playing
  useEffect(() => {
    console.log('Timer effect - isPaused:', room?.isPaused, 'isComplete:', isComplete, 'status:', room?.status, 'puzzleData:', !!puzzleData);

    // Start timer if puzzle is loaded and game is not complete and not paused
    if (puzzleData && !isComplete && !room?.isPaused) {
      console.log('Starting timer...');
      const timer = setInterval(() => {
        setTimeSeconds((prev) => prev + 1);
      }, 1000);
      return () => {
        console.log('Clearing timer');
        clearInterval(timer);
      };
    }
  }, [room?.isPaused, isComplete, puzzleData]);

  // Update progress whenever grid changes
  useEffect(() => {
    if (puzzleData && roomCode && playerName) {
      const progress = calculateProgress();
      setMyProgress(progress);
      updateProgress({ roomCode, playerName, progress });
    }
  }, [grid, puzzleData]);

  // Freeze timer countdown
  useEffect(() => {
    if (isFrozen && freezeTimeLeft > 0) {
      const timer = setInterval(() => {
        setFreezeTimeLeft((prev) => {
          if (prev <= 1) {
            setIsFrozen(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isFrozen, freezeTimeLeft]);

  // Listen for socket error (which includes player left)
  useEffect(() => {
    if (socketError && socketError.includes('left')) {
      setOpponentLeft(true);
      // Mark current player as winner by default
      if (!isComplete) {
        setIsComplete(true);
      }
    }
  }, [socketError, isComplete]);

  const fetchPuzzleById = async (puzzleId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/puzzle?id=${puzzleId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch puzzle');
      }

      const data: PuzzleData = await response.json();
      setPuzzleData(data);

      // Initialize grid
      const initialGrid: Cell[][] = data.puzzle.map((row, rowIndex) =>
        row.map((value, colIndex) => ({
          value,
          isInitial: value !== 0,
          isValid: true,
          isSelected: false,
        }))
      );

      setGrid(initialGrid);
      setLoading(false);
    } catch (err) {
      setError('Failed to load puzzle. Please try again.');
      setLoading(false);
    }
  };

  const calculateProgress = (): number => {
    if (!puzzleData) return 0;

    let filledCells = 0;
    let totalEmptyCells = 0;

    puzzleData.puzzle.forEach((row) => {
      row.forEach((cell) => {
        if (cell === 0) {
          totalEmptyCells++;
        }
      });
    });

    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (puzzleData.puzzle[rowIndex][colIndex] === 0 && cell.value !== 0) {
          filledCells++;
        }
      });
    });

    return totalEmptyCells > 0 ? Math.round((filledCells / totalEmptyCells) * 100) : 0;
  };

  const handleCellClick = (row: number, col: number) => {
    // If in hint mode, fill the cell with the correct value
    if (hintMode) {
      if (grid[row][col].isInitial || isComplete || room?.isPaused) {
        setHintMode(false);
        return;
      }

      if (!puzzleData) return;

      // Fill the cell with the correct value from solution
      const newGrid = [...grid];
      newGrid[row][col] = {
        value: puzzleData.solution[row][col],
        isInitial: true, // Mark as initial so it can't be changed
        isValid: true,
        isSelected: false,
      };

      setGrid(newGrid);
      setHintsUsed((prev) => prev + 1);
      setHintMode(false);

      // Activate 8-second freeze
      setIsFrozen(true);
      setFreezeTimeLeft(8);

      checkCompletion(newGrid);
      return;
    }

    if (grid[row][col].isInitial || isComplete || room?.isPaused || isFrozen) return;
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || isComplete || room?.isPaused || isFrozen) return;

    const { row, col } = selectedCell;
    if (grid[row][col].isInitial) return;

    const newGrid = [...grid];
    newGrid[row][col] = {
      ...newGrid[row][col],
      value: num,
    };

    // Validate the move
    if (num !== 0 && puzzleData) {
      const isCorrect = puzzleData.solution[row][col] === num;
      newGrid[row][col].isValid = isCorrect;

      if (!isCorrect) {
        setMistakes((prev) => prev + 1);
      }
    }

    setGrid(newGrid);

    // Check if puzzle is complete
    checkCompletion(newGrid);
  };

  const checkCompletion = async (currentGrid: Cell[][]) => {
    if (!puzzleData || !roomCode || !playerName) return;

    const isComplete = currentGrid.every((row, rowIndex) =>
      row.every(
        (cell, colIndex) =>
          cell.value === puzzleData.solution[rowIndex][colIndex]
      )
    );

    if (isComplete) {
      setIsComplete(true);

      // Prevent going back
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', () => {
        window.history.pushState(null, '', window.location.href);
      });

      // Calculate points
      const basePoints = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 20;

      let timeBonus = 0;
      if (difficulty === 'easy') {
        timeBonus = Math.max(0, 5 - Math.floor(timeSeconds / 30));
      } else if (difficulty === 'medium') {
        timeBonus = Math.max(0, 6 - Math.floor(timeSeconds / 45));
      } else {
        timeBonus = Math.max(0, 10 - Math.floor(timeSeconds / 60));
      }

      const mistakePenalty = mistakes;
      // No hint penalty in multiplayer - freeze is the penalty
      const finalPoints = Math.max(1, basePoints + timeBonus - mistakePenalty);
      setPoints(finalPoints);

      // Notify socket server of completion
      gameComplete({
        roomCode,
        playerName,
        timeSeconds,
        mistakes,
        hintsUsed,
      });

      // Don't save multiplayer results to leaderboard
      // Multiplayer results are saved to rooms collection instead
      setSaving(false);
    }
  };

  const handleHint = () => {
    if (!puzzleData || hintsUsed >= 3 || room?.isPaused || isComplete || isFrozen) return;

    // Enable hint mode - user needs to click on a cell to fill it
    setHintMode(true);
  };

  const handleClear = () => {
    if (!selectedCell || isComplete || room?.isPaused || isFrozen) return;
    handleNumberInput(0);
  };

  const handleLeave = () => {
    if (roomCode && playerName) {
      leaveRoom({ roomCode, playerName });
    }
    router.push('/');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBoxSize = (gridSize: number) => {
    if (gridSize === 4) return 2;
    if (gridSize === 6) return 2;
    if (gridSize === 9) return 3;
    return 3;
  };

  const getOpponentName = () => {
    if (!room) return 'Opponent';
    if (room.host?.playerName === playerName) {
      return room.guest?.playerName || 'Opponent';
    }
    return room.host?.playerName || 'Opponent';
  };

  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-orange-50">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-100"
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="rounded-3xl border-4 border-orange-400/60 bg-linear-to-br from-orange-50/95 via-amber-50/95 to-orange-100/95 p-12 text-center shadow-2xl backdrop-blur-sm">
            <div className="mb-4 text-6xl">🎮</div>
            <p className="text-2xl font-bold text-orange-900">
              Loading puzzle...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !puzzleData) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-orange-50">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-100"
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="rounded-3xl border-4 border-red-400/60 bg-linear-to-br from-red-50/95 via-rose-50/95 to-red-100/95 p-12 text-center shadow-2xl backdrop-blur-sm">
            <div className="mb-4 text-6xl">❌</div>
            <p className="mb-6 text-2xl font-bold text-red-900">{error || socketError}</p>
            <button
              onClick={handleLeave}
              className="cursor-pointer rounded-full bg-red-500 px-8 py-3 font-semibold text-white transition-all hover:bg-red-600"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const gridSize = puzzleData.gridSize;
  const boxRows = gridSize === 6 ? 2 : getBoxSize(gridSize);
  const boxCols = gridSize === 6 ? 3 : getBoxSize(gridSize);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-orange-50">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
          videoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-3 px-4 py-4">
        {/* Top Bar - Compact */}
        <div className="flex w-full max-w-6xl items-center justify-between">
          {!isComplete && (
            <button
              onClick={handleLeave}
              className="cursor-pointer rounded-full border-2 border-orange-500/60 bg-orange-100/90 px-4 py-1.5 text-sm font-semibold text-orange-800 backdrop-blur-sm transition-all hover:border-orange-600 hover:bg-orange-200 hover:shadow-lg"
            >
              ← Exit
            </button>
          )}
          {isComplete && <div></div>}

          <div className="flex gap-2">
            <div className="rounded-full border-2 border-orange-500/60 bg-orange-100/90 px-3 py-1 text-sm font-semibold text-orange-800 backdrop-blur-sm">
              🏠 {roomCode}
            </div>
            <div
              className={`rounded-full border-2 border-orange-500/60 px-3 py-1 text-sm font-semibold backdrop-blur-sm ${
                isConnected ? 'bg-green-100/90 text-green-800' : 'bg-red-100/90 text-red-800'
              }`}
            >
              {isConnected ? '🟢' : '🔴'}
            </div>
          </div>
        </div>

        {/* Players Progress Bar - More Compact */}
        <div className="w-full max-w-6xl rounded-xl border-2 border-purple-400/60 bg-linear-to-br from-purple-50/95 via-pink-50/95 to-purple-100/95 p-3 shadow-xl backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <div className="font-bold text-purple-900">
              👤 {playerName}
            </div>
            <div className="font-bold text-purple-900">
              ⚔️ {getOpponentName()}
            </div>
          </div>
          <div className="flex gap-3">
            {/* Your Progress */}
            <div className="flex-1">
              <div className="mb-1 text-xs font-semibold text-purple-700">
                You: {myProgress}%
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full bg-linear-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${myProgress}%` }}
                ></div>
              </div>
            </div>
            {/* Opponent Progress */}
            <div className="flex-1">
              <div className="mb-1 text-xs font-semibold text-purple-700">
                Opponent: {opponentProgress}%
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full bg-linear-to-r from-red-500 to-red-600 transition-all duration-300"
                  style={{ width: `${opponentProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Container - Grid with side stats */}
        <div className="w-full max-w-6xl rounded-2xl border-3 border-orange-400/60 bg-linear-to-br from-orange-50/95 via-amber-50/95 to-orange-100/95 p-4 shadow-xl backdrop-blur-sm">
          <div className="flex items-start justify-center gap-6">
            {/* Sudoku Grid */}
            <div>
              <div className="inline-block rounded-lg bg-orange-400 p-1 shadow-lg">
                <div
                  className="grid gap-0 bg-white"
                  style={{
                    gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                  }}
                >
                  {grid.map((row, rowIndex) =>
                    row.map((cell, colIndex) => {
                      const isRightBorder = (colIndex + 1) % boxCols === 0;
                      const isBottomBorder = (rowIndex + 1) % boxRows === 0;
                      const isSelected =
                        selectedCell?.row === rowIndex &&
                        selectedCell?.col === colIndex;

                      return (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                          className={`
                            flex aspect-square items-center justify-center font-bold transition-all
                            border-r border-b border-gray-300
                            ${gridSize === 4 ? 'h-16 w-16 text-2xl' : ''}
                            ${gridSize === 6 ? 'h-14 w-14 text-xl' : ''}
                            ${gridSize === 9 ? 'h-12 w-12 text-lg' : ''}
                            ${isRightBorder && colIndex !== gridSize - 1 ? 'border-r-[3px] border-r-orange-500' : ''}
                            ${isBottomBorder && rowIndex !== gridSize - 1 ? 'border-b-[3px] border-b-orange-500' : ''}
                            ${colIndex === gridSize - 1 ? 'border-r-0' : ''}
                            ${rowIndex === gridSize - 1 ? 'border-b-0' : ''}
                            ${cell.isInitial ? 'bg-orange-100 text-orange-900 cursor-not-allowed' : 'bg-white hover:bg-orange-50'}
                            ${isSelected ? 'bg-amber-200 ring-2 ring-inset ring-orange-500' : ''}
                            ${!cell.isValid && cell.value !== 0 ? 'bg-red-100 text-red-600' : ''}
                            ${cell.value === 0 ? 'text-transparent' : ''}
                          `}
                          disabled={cell.isInitial || isComplete || room?.isPaused}
                        >
                          {cell.value === 0 ? '·' : cell.value}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Side Stats */}
            <div className="flex flex-col gap-3">
              {/* Timer */}
              <div className="rounded-xl border-2 border-blue-400/60 bg-linear-to-br from-blue-50/95 to-cyan-50/95 p-4 shadow-lg backdrop-blur-sm">
                <div className="text-xs font-semibold text-blue-700 mb-1">TIME</div>
                <div className="text-2xl font-bold text-blue-900">{formatTime(timeSeconds)}</div>
              </div>

              {/* Mistakes */}
              <div className="rounded-xl border-2 border-red-400/60 bg-linear-to-br from-red-50/95 to-rose-50/95 p-4 shadow-lg backdrop-blur-sm">
                <div className="text-xs font-semibold text-red-700 mb-1">MISTAKES</div>
                <div className="text-2xl font-bold text-red-900">{mistakes}</div>
              </div>

              {/* Pause Indicator */}
              {room?.isPaused && (
                <div className="rounded-xl border-2 border-yellow-400/60 bg-linear-to-br from-yellow-50/95 to-amber-50/95 p-4 shadow-lg backdrop-blur-sm">
                  <div className="text-center">
                    <div className="text-2xl mb-1">⏸️</div>
                    <div className="text-xs font-bold text-yellow-800">PAUSED</div>
                  </div>
                </div>
              )}

              {/* Freeze Indicator */}
              {isFrozen && (
                <div className="rounded-xl border-2 border-blue-400/60 bg-linear-to-br from-blue-50/95 to-cyan-50/95 p-4 shadow-lg backdrop-blur-sm animate-pulse">
                  <div className="text-center">
                    <div className="text-2xl mb-1">❄️</div>
                    <div className="text-xs font-bold text-blue-800">FROZEN</div>
                    <div className="text-lg font-bold text-blue-900">{freezeTimeLeft}s</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Number Input Buttons */}
          <div className="mt-4 mb-2 flex flex-wrap justify-center gap-2">
            {Array.from({ length: gridSize }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => handleNumberInput(num)}
                className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-xl border-2 border-orange-400 bg-linear-to-br from-orange-100 to-amber-100 text-2xl font-bold text-orange-900 shadow-md transition-all hover:scale-110 hover:border-orange-500 hover:from-orange-200 hover:to-amber-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isComplete || room?.isPaused || isFrozen}
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-xl border-2 border-red-400 bg-linear-to-br from-red-100 to-rose-100 text-xl font-bold text-red-900 shadow-md transition-all hover:scale-110 hover:border-red-500 hover:from-red-200 hover:to-rose-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isComplete || room?.isPaused || isFrozen}
            >
              ✕
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handleHint}
              disabled={
                hintsUsed >= 3 || isComplete || room?.isPaused || isFrozen
              }
              className={`cursor-pointer rounded-xl border-2 px-6 py-3 font-bold shadow-md transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${
                hintMode
                  ? 'border-yellow-500 bg-linear-to-br from-yellow-200 to-amber-200 text-yellow-900 animate-pulse'
                  : 'border-green-400 bg-linear-to-br from-green-100 to-emerald-100 text-green-900 hover:border-green-500 hover:from-green-200 hover:to-emerald-200'
              }`}
            >
              💡 {hintMode ? 'Click a cell to fill' : `Hint (${3 - hintsUsed} left)`}
            </button>
          </div>
        </div>

        {/* Completion Modal */}
        {isComplete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="max-w-lg rounded-3xl border-4 border-green-400 bg-linear-to-br from-green-50/95 via-emerald-50/95 to-green-100/95 p-8 text-center shadow-2xl sm:p-12">
              <div className="mb-6 text-8xl">{opponentLeft ? '🎉' : '🏆'}</div>
              <h2 className="mb-2 text-4xl font-bold text-green-900">
                Victory, {playerName}!
              </h2>
              <p className="mb-6 text-lg font-semibold text-green-700">
                {opponentLeft
                  ? `Your opponent left the game. You win by default!`
                  : 'You completed the puzzle first and won!'}
              </p>

              {/* Stats */}
              <div className="mb-6 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-xl bg-green-100 p-4">
                  <div className="text-3xl font-bold text-green-900">⏱️</div>
                  <div className="mt-2 text-sm font-semibold text-green-700">
                    Time
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    {formatTime(timeSeconds)}
                  </div>
                </div>
                <div className="rounded-xl bg-red-100 p-4">
                  <div className="text-3xl font-bold text-red-900">❌</div>
                  <div className="mt-2 text-sm font-semibold text-red-700">
                    Mistakes
                  </div>
                  <div className="text-lg font-bold text-red-900">
                    {mistakes}
                  </div>
                </div>
                <div className="rounded-xl bg-amber-100 p-4">
                  <div className="text-3xl font-bold text-amber-900">💡</div>
                  <div className="mt-2 text-sm font-semibold text-amber-700">
                    Hints
                  </div>
                  <div className="text-lg font-bold text-amber-900">
                    {hintsUsed}
                  </div>
                </div>
              </div>

              {/* Saving Status */}
              {saving && (
                <p className="mb-4 text-sm text-green-700">
                  💾 Saving to leaderboard...
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/game/multiplayer">
                  <button className="w-full cursor-pointer rounded-xl bg-green-500 px-8 py-3 font-bold text-white transition-all hover:bg-green-600 sm:w-auto">
                    New Game
                  </button>
                </Link>
                <Link href="/leaderboard">
                  <button className="w-full cursor-pointer rounded-xl bg-orange-500 px-8 py-3 font-bold text-white transition-all hover:bg-orange-600 sm:w-auto">
                    View Leaderboard
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MultiplayerGamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading game...</p>
        </div>
      }
    >
      <MultiplayerGameContent />
    </Suspense>
  );
}
