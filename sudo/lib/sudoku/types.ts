/**
 * Sudoku Type Definitions
 */

export type GridSize = 4 | 6 | 9 | 12;
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GridConfig {
  size: GridSize;
  boxRows: number;
  boxCols: number;
}

export type SudokuGrid = number[][];

export interface Position {
  row: number;
  col: number;
}

export interface GeneratedPuzzle {
  puzzle: SudokuGrid;
  solution: SudokuGrid;
  difficulty: Difficulty;
  gridSize: GridSize;
}
