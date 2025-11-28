/**
 * Sudoku Puzzle Generator
 * Generates playable Sudoku puzzles with unique solutions
 */

import { SudokuGrid, GridConfig, Difficulty, GeneratedPuzzle } from './types';
import { SudokuSolver } from './solver';
import { SudokuValidator } from './validator';

export class SudokuGenerator {
  private solver: SudokuSolver;
  private validator: SudokuValidator;
  private config: GridConfig;

  constructor(config: GridConfig) {
    this.config = config;
    this.solver = new SudokuSolver(config);
    this.validator = new SudokuValidator(config);
  }

  /**
   * Generate a complete Sudoku puzzle
   */
  generate(difficulty: Difficulty): GeneratedPuzzle {
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      // Create empty grid
      const solution = this.createEmptyGrid();

      // Fill diagonal boxes first (optimization)
      this.solver.fillDiagonalBoxes(solution);

      // Complete the grid using backtracking
      const success = this.solver.generateCompletedGrid(solution);

      if (success) {
        // Verify solution has no zeros
        const hasZeros = solution.some(row => row.includes(0));

        if (!hasZeros) {
          // Success! Create puzzle by removing numbers
          const puzzle = this.createPuzzle(solution, difficulty);

          return {
            puzzle,
            solution,
            difficulty,
            gridSize: this.config.size,
          };
        }
      }

      attempts++;
    }

    throw new Error(
      `Failed to generate valid ${difficulty} Sudoku (${this.config.size}x${this.config.size}) after ${maxAttempts} attempts`
    );
  }

  /**
   * Create an empty grid filled with zeros
   */
  private createEmptyGrid(): SudokuGrid {
    return Array.from({ length: this.config.size }, () =>
      Array(this.config.size).fill(0)
    );
  }

  /**
   * Create puzzle by removing numbers from solved grid
   * Ensures unique solution
   */
  private createPuzzle(solution: SudokuGrid, difficulty: Difficulty): SudokuGrid {
    const puzzle = this.solver.copyGrid(solution);
    const cellsToRemove = this.getCellsToRemove(difficulty);

    // Get all cell positions
    const positions: Array<{ row: number; col: number }> = [];
    for (let row = 0; row < this.config.size; row++) {
      for (let col = 0; col < this.config.size; col++) {
        positions.push({ row, col });
      }
    }

    // Shuffle positions
    this.shuffleArray(positions);

    let removed = 0;
    for (const { row, col } of positions) {
      if (removed >= cellsToRemove) break;

      const backup = puzzle[row][col];
      puzzle[row][col] = 0;

      // Check if puzzle still has unique solution
      const solutionCount = this.solver.countSolutions(puzzle, 2);

      if (solutionCount === 1) {
        removed++;
      } else {
        // Restore the number if removing it creates multiple solutions
        puzzle[row][col] = backup;
      }
    }

    return puzzle;
  }

  /**
   * Determine how many cells to remove based on difficulty
   * Updated to make puzzles tougher while ensuring unique solutions
   */
  private getCellsToRemove(difficulty: Difficulty): number {
    const totalCells = this.config.size * this.config.size;

    switch (this.config.size) {
      case 4:
        // 4x4 grid (16 cells) - Increased difficulty
        return difficulty === 'easy'
          ? 7  // Was 6, now 7 (leaves 9 filled)
          : difficulty === 'medium'
          ? 8
          : 10;

      case 6:
        // 6x6 grid (36 cells) - Increased difficulty
        return difficulty === 'easy'
          ? 18
          : difficulty === 'medium'
          ? 24  // Was 22, now 24 (leaves 12 filled)
          : 26;

      case 9:
        // 9x9 grid (81 cells) - Increased difficulty (safe above 17-cell minimum)
        return difficulty === 'easy'
          ? 40
          : difficulty === 'medium'
          ? 50
          : 62;  // Was 60, now 62 (leaves 19 filled - safe for unique solution)

      case 12:
        // 12x12 grid (144 cells)
        return difficulty === 'easy'
          ? 70
          : difficulty === 'medium'
          ? 90
          : 110;

      default:
        return Math.floor(totalCells * 0.5);
    }
  }

  /**
   * Generate hints for a puzzle
   * Returns positions that can be revealed as hints
   */
  generateHints(
    puzzle: SudokuGrid,
    solution: SudokuGrid,
    count = 3
  ): Array<{ row: number; col: number; value: number }> {
    const hints: Array<{ row: number; col: number; value: number }> = [];
    const emptyCells: Array<{ row: number; col: number }> = [];

    // Find all empty cells
    for (let row = 0; row < this.config.size; row++) {
      for (let col = 0; col < this.config.size; col++) {
        if (puzzle[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }

    // Shuffle and pick random cells for hints
    this.shuffleArray(emptyCells);

    for (let i = 0; i < Math.min(count, emptyCells.length); i++) {
      const { row, col } = emptyCells[i];
      hints.push({
        row,
        col,
        value: solution[row][col],
      });
    }

    return hints;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
