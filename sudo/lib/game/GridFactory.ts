/**
 * Grid Factory Pattern
 * Creates different Sudoku grid configurations
 */

import { GridConfig, GridSize } from '../sudoku/types';

/**
 * Interface for Sudoku Grid configurations
 */
export interface ISudokuGrid {
  getConfig(): GridConfig;
  getSize(): GridSize;
  getBoxRows(): number;
  getBoxCols(): number;
  getDescription(): string;
}

/**
 * 4x4 Sudoku Grid (2x2 boxes)
 */
class Grid4x4 implements ISudokuGrid {
  getConfig(): GridConfig {
    return {
      size: 4,
      boxRows: 2,
      boxCols: 2,
    };
  }

  getSize(): GridSize {
    return 4;
  }

  getBoxRows(): number {
    return 2;
  }

  getBoxCols(): number {
    return 2;
  }

  getDescription(): string {
    return '4x4 Sudoku (2x2 boxes) - Easy';
  }
}

/**
 * 6x6 Sudoku Grid (2x3 boxes)
 */
class Grid6x6 implements ISudokuGrid {
  getConfig(): GridConfig {
    return {
      size: 6,
      boxRows: 2,
      boxCols: 3,
    };
  }

  getSize(): GridSize {
    return 6;
  }

  getBoxRows(): number {
    return 2;
  }

  getBoxCols(): number {
    return 3;
  }

  getDescription(): string {
    return '6x6 Sudoku (2x3 boxes) - Medium';
  }
}

/**
 * 9x9 Sudoku Grid (3x3 boxes) - Standard
 */
class Grid9x9 implements ISudokuGrid {
  getConfig(): GridConfig {
    return {
      size: 9,
      boxRows: 3,
      boxCols: 3,
    };
  }

  getSize(): GridSize {
    return 9;
  }

  getBoxRows(): number {
    return 3;
  }

  getBoxCols(): number {
    return 3;
  }

  getDescription(): string {
    return '9x9 Sudoku (3x3 boxes) - Hard';
  }
}

/**
 * 12x12 Sudoku Grid (3x4 boxes) - Expert (Future)
 */
class Grid12x12 implements ISudokuGrid {
  getConfig(): GridConfig {
    return {
      size: 12,
      boxRows: 3,
      boxCols: 4,
    };
  }

  getSize(): GridSize {
    return 12;
  }

  getBoxRows(): number {
    return 3;
  }

  getBoxCols(): number {
    return 4;
  }

  getDescription(): string {
    return '12x12 Sudoku (3x4 boxes) - Super Hard';
  }
}

/**
 * Grid Factory
 * Creates appropriate grid based on size
 */
export class GridFactory {
  /**
   * Create a grid configuration based on size
   */
  static createGrid(size: GridSize): ISudokuGrid {
    switch (size) {
      case 4:
        return new Grid4x4();
      case 6:
        return new Grid6x6();
      case 9:
        return new Grid9x9();
      case 12:
        return new Grid12x12();
      default:
        throw new Error(`Unsupported grid size: ${size}`);
    }
  }

  /**
   * Get all available grid sizes
   */
  static getAvailableSizes(): GridSize[] {
    return [4, 6, 9]; // 12 will be added later
  }

  /**
   * Map difficulty to grid size (according to plan)
   */
  static getGridSizeForDifficulty(difficulty: string): GridSize {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 4;
      case 'medium':
        return 6;
      case 'hard':
        return 9;
      default:
        return 9;
    }
  }
}
