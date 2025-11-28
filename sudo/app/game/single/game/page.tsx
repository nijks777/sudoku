'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

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

function SudokuGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const difficulty = searchParams.get('difficulty');
  const playerName = searchParams.get('name');

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
  const [isPaused, setIsPaused] = useState(false);
  const [points, setPoints] = useState(0);
  const [saving, setSaving] = useState(false);

  // Fetch puzzle on mount
  useEffect(() => {
    fetchPuzzle();
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (!isPaused && !isComplete) {
      const timer = setInterval(() => {
        setTimeSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPaused, isComplete]);

  const fetchPuzzle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/puzzle?difficulty=${difficulty}`);

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

  const handleCellClick = (row: number, col: number) => {
    if (grid[row][col].isInitial || isComplete || isPaused) return;
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || isComplete || isPaused) return;

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
    if (!puzzleData) return;

    const isComplete = currentGrid.every((row, rowIndex) =>
      row.every(
        (cell, colIndex) =>
          cell.value === puzzleData.solution[rowIndex][colIndex]
      )
    );

    if (isComplete) {
      setIsComplete(true);

      // Prevent going back to the game by replacing history
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', () => {
        window.history.pushState(null, '', window.location.href);
      });

      // Calculate points
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

      const mistakePenalty = mistakes;
      const hintPenalty = hintsUsed * 2;
      const finalPoints = Math.max(1, basePoints + timeBonus - mistakePenalty - hintPenalty);
      setPoints(finalPoints);

      // Save to database
      try {
        setSaving(true);
        const response = await fetch('/api/game/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerName,
            difficulty,
            timeSeconds,
            mistakes,
            hintsUsed,
          }),
        });

        if (!response.ok) {
          console.error('Failed to save game');
        }
      } catch (error) {
        console.error('Error saving game:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleHint = () => {
    if (!puzzleData || hintsUsed >= puzzleData.hints.length || isPaused) return;

    const hint = puzzleData.hints[hintsUsed];
    const newGrid = [...grid];
    newGrid[hint.row][hint.col] = {
      value: hint.value,
      isInitial: true,
      isValid: true,
      isSelected: false,
    };

    setGrid(newGrid);
    setHintsUsed((prev) => prev + 1);
    checkCompletion(newGrid);
  };

  const handleClear = () => {
    if (!selectedCell || isComplete || isPaused) return;
    handleNumberInput(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBoxSize = (gridSize: number) => {
    if (gridSize === 4) return 2;
    if (gridSize === 6) return 2; // 2x3 boxes
    if (gridSize === 9) return 3;
    return 3;
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
            <p className="mb-6 text-2xl font-bold text-red-900">{error}</p>
            <Link href="/game/single">
              <button className="cursor-pointer rounded-full bg-red-500 px-8 py-3 font-semibold text-white transition-all hover:bg-red-600">
                Back to Menu
              </button>
            </Link>
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
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8">
        {/* Top Bar */}
        <div className="flex w-full max-w-6xl items-center justify-between">
          {!isComplete && (
            <Link
              href="/game/single"
              className="cursor-pointer rounded-full border-2 border-orange-500/60 bg-orange-100/90 px-6 py-2 font-semibold text-orange-800 backdrop-blur-sm transition-all hover:border-orange-600 hover:bg-orange-200 hover:shadow-lg"
            >
              ← Exit
            </Link>
          )}
          {isComplete && <div></div>}

          <div className="flex gap-4">
            <div className="rounded-full border-2 border-orange-500/60 bg-orange-100/90 px-6 py-2 font-semibold text-orange-800 backdrop-blur-sm">
              👤 {playerName}
            </div>
            <div className="rounded-full border-2 border-orange-500/60 bg-orange-100/90 px-6 py-2 font-semibold text-orange-800 backdrop-blur-sm">
              ⏱️ {formatTime(timeSeconds)}
            </div>
            <div className="rounded-full border-2 border-orange-500/60 bg-orange-100/90 px-6 py-2 font-semibold text-orange-800 backdrop-blur-sm">
              ❌ {mistakes}
            </div>
          </div>
        </div>

        {/* Game Container */}
        <div className="rounded-3xl border-4 border-orange-400/60 bg-linear-to-br from-orange-50/95 via-amber-50/95 to-orange-100/95 p-8 shadow-2xl backdrop-blur-sm">
          {/* Sudoku Grid */}
          <div className="mb-6 flex justify-center">
            <div className="inline-block rounded-xl bg-orange-400 p-1 shadow-lg">
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
                    disabled={cell.isInitial || isComplete || isPaused}
                  >
                    {cell.value === 0 ? '·' : cell.value}
                  </button>
                );
              })
            )}
            </div>
            </div>
          </div>

          {/* Number Input Buttons */}
          <div className="mb-4 flex flex-wrap justify-center gap-3">
            {Array.from({ length: gridSize }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => handleNumberInput(num)}
                className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-xl border-2 border-orange-400 bg-linear-to-br from-orange-100 to-amber-100 text-2xl font-bold text-orange-900 shadow-md transition-all hover:scale-110 hover:border-orange-500 hover:from-orange-200 hover:to-amber-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isComplete || isPaused}
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-xl border-2 border-red-400 bg-linear-to-br from-red-100 to-rose-100 text-xl font-bold text-red-900 shadow-md transition-all hover:scale-110 hover:border-red-500 hover:from-red-200 hover:to-rose-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isComplete || isPaused}
            >
              ✕
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handleHint}
              disabled={
                hintsUsed >= puzzleData.hints.length || isComplete || isPaused
              }
              className="cursor-pointer rounded-xl border-2 border-green-400 bg-linear-to-br from-green-100 to-emerald-100 px-6 py-3 font-bold text-green-900 shadow-md transition-all hover:scale-105 hover:border-green-500 hover:from-green-200 hover:to-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              💡 Hint ({puzzleData.hints.length - hintsUsed} left)
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="cursor-pointer rounded-xl border-2 border-orange-400 bg-linear-to-br from-orange-100 to-amber-100 px-6 py-3 font-bold text-orange-900 shadow-md transition-all hover:scale-105 hover:border-orange-500 hover:from-orange-200 hover:to-amber-200"
              disabled={isComplete}
            >
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
          </div>
        </div>

        {/* Completion Modal */}
        {isComplete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="max-w-lg rounded-3xl border-4 border-green-400 bg-linear-to-br from-green-50/95 via-emerald-50/95 to-green-100/95 p-8 text-center shadow-2xl sm:p-12">
              <div className="mb-6 text-8xl">🎉</div>
              <h2 className="mb-2 text-4xl font-bold text-green-900">
                Congratulations, {playerName}!
              </h2>
              <p className="mb-6 text-lg font-semibold text-green-700">
                You completed the {difficulty} puzzle!
              </p>

              {/* Points Display */}
              <div className="mb-6 rounded-2xl border-2 border-green-500 bg-white p-6">
                <div className="mb-4 text-6xl font-bold text-green-600">
                  {points} pts
                </div>
                <div className="space-y-2 text-sm text-green-800">
                  <div className="flex justify-between">
                    <span>Base points ({difficulty}):</span>
                    <span className="font-semibold">
                      +{difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 20}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time bonus:</span>
                    <span className="font-semibold">
                      +{Math.max(0, 10 - Math.floor(timeSeconds / 60))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mistakes penalty:</span>
                    <span className="font-semibold text-red-600">-{mistakes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hints penalty:</span>
                    <span className="font-semibold text-red-600">
                      -{hintsUsed * 2}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mb-6 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-xl bg-green-100 p-4">
                  <div className="text-3xl font-bold text-green-900">
                    ⏱️
                  </div>
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
                <Link href="/game/single">
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

export default function SudokuGamePage() {
  return (
    <Suspense fallback={<div>Loading game...</div>}>
      <SudokuGameContent />
    </Suspense>
  );
}
