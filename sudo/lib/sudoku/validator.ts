/**
 * Sudoku Validator
 * Validates number placements and complete grids
 */

import { SudokuGrid, GridConfig } from './types';

export class SudokuValidator {
  private config: GridConfig;

  constructor(config: GridConfig) {
    this.config = config;
  }

  /**
   * Check if a number can be placed at a specific position
   * Rule-based validation: checks row, column, and box for duplicates
   */
  isValidPlacement(
    grid: SudokuGrid,
    row: number,
    col: number,
    num: number
  ): boolean {
    // Check row for duplicates
    if (this.hasNumberInRow(grid, row, num)) {
      return false;
    }

    // Check column for duplicates
    if (this.hasNumberInColumn(grid, col, num)) {
      return false;
    }

    // Check box for duplicates
    if (this.hasNumberInBox(grid, row, col, num)) {
      return false;
    }

    return true;
  }

  /**
   * Check if number exists in row
   */
  private hasNumberInRow(grid: SudokuGrid, row: number, num: number): boolean {
    for (let col = 0; col < this.config.size; col++) {
      if (grid[row][col] === num) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if number exists in column
   */
  private hasNumberInColumn(
    grid: SudokuGrid,
    col: number,
    num: number
  ): boolean {
    for (let row = 0; row < this.config.size; row++) {
      if (grid[row][col] === num) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if number exists in box
   */
  private hasNumberInBox(
    grid: SudokuGrid,
    row: number,
    col: number,
    num: number
  ): boolean {
    const boxStartRow = Math.floor(row / this.config.boxRows) * this.config.boxRows;
    const boxStartCol = Math.floor(col / this.config.boxCols) * this.config.boxCols;

    for (let r = boxStartRow; r < boxStartRow + this.config.boxRows; r++) {
      for (let c = boxStartCol; c < boxStartCol + this.config.boxCols; c++) {
        if (grid[r][c] === num) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Find the next empty cell (0 = empty)
   */
  findEmptyCell(grid: SudokuGrid): { row: number; col: number } | null {
    for (let row = 0; row < this.config.size; row++) {
      for (let col = 0; col < this.config.size; col++) {
        if (grid[row][col] === 0) {
          return { row, col };
        }
      }
    }
    return null;
  }

  /**
   * Validate complete grid (all cells filled and valid)
   */
  isValidGrid(grid: SudokuGrid): boolean {
    for (let row = 0; row < this.config.size; row++) {
      for (let col = 0; col < this.config.size; col++) {
        const num = grid[row][col];

        if (num === 0) {
          return false; // Grid not complete
        }

        // Temporarily remove number to check if placement is valid
        grid[row][col] = 0;
        const isValid = this.isValidPlacement(grid, row, col, num);
        grid[row][col] = num;

        if (!isValid) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Count empty cells in grid
   */
  countEmptyCells(grid: SudokuGrid): number {
    let count = 0;
    for (let row = 0; row < this.config.size; row++) {
      for (let col = 0; col < this.config.size; col++) {
        if (grid[row][col] === 0) {
          count++;
        }
      }
    }
    return count;
  }
}
