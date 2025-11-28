/**
 * Sudoku Solver
 * Uses backtracking algorithm to solve Sudoku puzzles
 */

import { SudokuGrid, GridConfig } from './types';
import { SudokuValidator } from './validator';

export class SudokuSolver {
  private validator: SudokuValidator;
  private config: GridConfig;

  constructor(config: GridConfig) {
    this.config = config;
    this.validator = new SudokuValidator(config);
  }

  /**
   * Solve a Sudoku grid using backtracking
   * Returns true if solved, false if unsolvable
   */
  solve(grid: SudokuGrid): boolean {
    const emptyCell = this.validator.findEmptyCell(grid);

    // Base case: no empty cells, puzzle is solved
    if (!emptyCell) {
      return true;
    }

    const { row, col } = emptyCell;

    // Try numbers 1 to grid size
    for (let num = 1; num <= this.config.size; num++) {
      if (this.validator.isValidPlacement(grid, row, col, num)) {
        // Place number
        grid[row][col] = num;

        // Recursively try to solve
        if (this.solve(grid)) {
          return true;
        }

        // Backtrack: remove number and try next
        grid[row][col] = 0;
      }
    }

    // No valid number found, trigger backtracking
    return false;
  }

  /**
   * Generate a complete valid Sudoku grid
   * Fills grid randomly for variety
   */
  generateCompletedGrid(grid: SudokuGrid): boolean {
    const emptyCell = this.validator.findEmptyCell(grid);

    // Base case: no empty cells, grid is complete
    if (!emptyCell) {
      return true;
    }

    const { row, col } = emptyCell;

    // Create shuffled array of numbers to try
    const numbers = this.shuffleArray(
      Array.from({ length: this.config.size }, (_, i) => i + 1)
    );

    // Try numbers in random order for variety
    for (const num of numbers) {
      if (this.validator.isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num;

        if (this.generateCompletedGrid(grid)) {
          return true;
        }

        grid[row][col] = 0;
      }
    }

    return false;
  }

  /**
   * Fill diagonal boxes first (they are independent)
   * This speeds up generation significantly
   */
  fillDiagonalBoxes(grid: SudokuGrid): void {
    const { boxRows, boxCols } = this.config;

    for (let box = 0; box < this.config.size; box += boxCols) {
      this.fillBox(grid, box, box);
    }
  }

  /**
   * Fill a single box with random numbers
   */
  private fillBox(grid: SudokuGrid, startRow: number, startCol: number): void {
    const numbers = this.shuffleArray(
      Array.from({ length: this.config.size }, (_, i) => i + 1)
    );

    let idx = 0;
    for (let row = 0; row < this.config.boxRows; row++) {
      for (let col = 0; col < this.config.boxCols; col++) {
        grid[startRow + row][startCol + col] = numbers[idx++];
      }
    }
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Count number of solutions (used to ensure unique solution)
   * Stops counting after finding 2 solutions (for efficiency)
   */
  countSolutions(grid: SudokuGrid, limit = 2): number {
    const gridCopy = grid.map(row => [...row]);
    return this.countSolutionsHelper(gridCopy, limit);
  }

  private countSolutionsHelper(grid: SudokuGrid, limit: number): number {
    const emptyCell = this.validator.findEmptyCell(grid);

    if (!emptyCell) {
      return 1; // Found a solution
    }

    const { row, col } = emptyCell;
    let count = 0;

    for (let num = 1; num <= this.config.size; num++) {
      if (this.validator.isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num;

        count += this.countSolutionsHelper(grid, limit);

        if (count >= limit) {
          grid[row][col] = 0;
          return count; // Early exit if we found enough solutions
        }

        grid[row][col] = 0;
      }
    }

    return count;
  }

  /**
   * Create a deep copy of the grid
   */
  copyGrid(grid: SudokuGrid): SudokuGrid {
    return grid.map(row => [...row]);
  }
}
