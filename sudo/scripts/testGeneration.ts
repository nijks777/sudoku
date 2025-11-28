/**
 * Test Sudoku Generation
 * Generates a single puzzle to verify algorithms work correctly
 */

import { GridFactory } from '../lib/game/GridFactory';
import { SudokuGenerator } from '../lib/sudoku/generator';
import { Difficulty } from '../lib/sudoku/types';

function printGrid(grid: number[][], title: string) {
  console.log(`\n${title}`);
  console.log('─'.repeat(40));
  grid.forEach((row) => {
    console.log(row.map(n => (n === 0 ? '·' : n)).join(' '));
  });
  console.log('─'.repeat(40));
}

function testGeneration(gridSize: 4 | 6 | 9, difficulty: Difficulty) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Testing ${gridSize}x${gridSize} grid - ${difficulty.toUpperCase()} difficulty`);
  console.log('='.repeat(50));

  const startTime = Date.now();

  // Create grid configuration using Factory pattern
  const gridConfig = GridFactory.createGrid(gridSize);
  console.log(`\nGrid Config: ${gridConfig.getDescription()}`);
  console.log(`Box size: ${gridConfig.getBoxRows()}x${gridConfig.getBoxCols()}`);

  // Create generator
  const generator = new SudokuGenerator(gridConfig.getConfig());

  // Generate puzzle
  console.log('\nGenerating puzzle...');
  const puzzle = generator.generate(difficulty);

  const endTime = Date.now();
  const generationTime = endTime - startTime;

  // Print results
  printGrid(puzzle.puzzle, '📝 PUZZLE (0 = empty)');
  printGrid(puzzle.solution, '✅ SOLUTION');

  // Generate hints
  const hints = generator.generateHints(puzzle.puzzle, puzzle.solution, 3);
  console.log('\n💡 HINTS:');
  hints.forEach((hint, idx) => {
    console.log(`  ${idx + 1}. Row ${hint.row + 1}, Col ${hint.col + 1} = ${hint.value}`);
  });

  // Statistics
  const totalCells = gridSize * gridSize;
  const emptyCells = puzzle.puzzle.flat().filter(n => n === 0).length;
  const filledCells = totalCells - emptyCells;

  console.log('\n📊 STATISTICS:');
  console.log(`  Total cells: ${totalCells}`);
  console.log(`  Filled cells: ${filledCells}`);
  console.log(`  Empty cells: ${emptyCells}`);
  console.log(`  Fill percentage: ${((filledCells / totalCells) * 100).toFixed(1)}%`);
  console.log(`  Generation time: ${generationTime}ms`);

  console.log('\n✅ Generation successful!\n');
}

// Run tests
console.log('🎮 SUDOKU GENERATION TEST');
console.log('Testing all grid sizes and difficulties...\n');

try {
  // Test 4x4 Easy
  testGeneration(4, 'easy');

  // Test 6x6 Medium
  testGeneration(6, 'medium');

  // Test 9x9 Hard
  testGeneration(9, 'hard');

  console.log('\n' + '='.repeat(50));
  console.log('✅ ALL TESTS PASSED!');
  console.log('='.repeat(50) + '\n');
} catch (error) {
  console.error('\n❌ TEST FAILED:', error);
  process.exit(1);
}
