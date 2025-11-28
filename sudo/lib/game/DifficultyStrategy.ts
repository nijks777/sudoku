/**
 * Difficulty Strategy Pattern
 * Defines different difficulty levels and their characteristics
 */

import { Difficulty, GridSize } from '../sudoku/types';

/**
 * Interface for difficulty strategies
 */
export interface IDifficultyStrategy {
  getName(): Difficulty;
  getCellsToRemove(gridSize: GridSize): number;
  getPoints(): number;
  getDescription(): string;
}

/**
 * Easy Difficulty Strategy
 */
class EasyStrategy implements IDifficultyStrategy {
  getName(): Difficulty {
    return 'easy';
  }

  getCellsToRemove(gridSize: GridSize): number {
    switch (gridSize) {
      case 4:
        return 6; // 16 cells - 6 = 10 filled
      case 6:
        return 18; // 36 cells - 18 = 18 filled
      case 9:
        return 40; // 81 cells - 40 = 41 filled
      case 12:
        return 70; // 144 cells - 70 = 74 filled
      default:
        return Math.floor((gridSize * gridSize) * 0.4);
    }
  }

  getPoints(): number {
    return 5;
  }

  getDescription(): string {
    return 'Easy difficulty - More cells filled, perfect for beginners';
  }
}

/**
 * Medium Difficulty Strategy
 */
class MediumStrategy implements IDifficultyStrategy {
  getName(): Difficulty {
    return 'medium';
  }

  getCellsToRemove(gridSize: GridSize): number {
    switch (gridSize) {
      case 4:
        return 8; // 16 cells - 8 = 8 filled
      case 6:
        return 22; // 36 cells - 22 = 14 filled
      case 9:
        return 50; // 81 cells - 50 = 31 filled
      case 12:
        return 90; // 144 cells - 90 = 54 filled
      default:
        return Math.floor((gridSize * gridSize) * 0.55);
    }
  }

  getPoints(): number {
    return 10;
  }

  getDescription(): string {
    return 'Medium difficulty - Balanced challenge for regular players';
  }
}

/**
 * Hard Difficulty Strategy
 */
class HardStrategy implements IDifficultyStrategy {
  getName(): Difficulty {
    return 'hard';
  }

  getCellsToRemove(gridSize: GridSize): number {
    switch (gridSize) {
      case 4:
        return 10; // 16 cells - 10 = 6 filled
      case 6:
        return 26; // 36 cells - 26 = 10 filled
      case 9:
        return 60; // 81 cells - 60 = 21 filled
      case 12:
        return 110; // 144 cells - 110 = 34 filled
      default:
        return Math.floor((gridSize * gridSize) * 0.7);
    }
  }

  getPoints(): number {
    return 20;
  }

  getDescription(): string {
    return 'Hard difficulty - Minimal cells filled, for expert solvers';
  }
}

/**
 * Difficulty Strategy Context
 * Manages difficulty strategy selection and execution
 */
export class DifficultyContext {
  private strategy: IDifficultyStrategy;

  constructor(difficulty: Difficulty) {
    this.strategy = this.createStrategy(difficulty);
  }

  /**
   * Factory method to create appropriate strategy
   */
  private createStrategy(difficulty: Difficulty): IDifficultyStrategy {
    switch (difficulty) {
      case 'easy':
        return new EasyStrategy();
      case 'medium':
        return new MediumStrategy();
      case 'hard':
        return new HardStrategy();
      default:
        return new MediumStrategy();
    }
  }

  /**
   * Get cells to remove for current difficulty and grid size
   */
  getCellsToRemove(gridSize: GridSize): number {
    return this.strategy.getCellsToRemove(gridSize);
  }

  /**
   * Get base points for current difficulty
   */
  getPoints(): number {
    return this.strategy.getPoints();
  }

  /**
   * Get difficulty name
   */
  getName(): Difficulty {
    return this.strategy.getName();
  }

  /**
   * Get difficulty description
   */
  getDescription(): string {
    return this.strategy.getDescription();
  }

  /**
   * Get all available difficulties
   */
  static getAvailableDifficulties(): Difficulty[] {
    return ['easy', 'medium', 'hard'];
  }
}
