import mongoose, { Schema, Model } from 'mongoose';

// ==================== Puzzle Schema ====================
export interface IHint {
  row: number;
  col: number;
  value: number;
}

export interface IPuzzle {
  _id?: mongoose.Types.ObjectId | string;
  difficulty: 'easy' | 'medium' | 'hard';
  gridSize: 4 | 6 | 9 | 12;
  puzzle: number[][];
  solution: number[][];
  hints: IHint[];
  createdAt: Date;
}

const hintSchema = new Schema<IHint>({
  row: { type: Number, required: true },
  col: { type: Number, required: true },
  value: { type: Number, required: true },
});

const puzzleSchema = new Schema<IPuzzle>({
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  gridSize: {
    type: Number,
    enum: [4, 6, 9, 12],
    required: true,
  },
  puzzle: {
    type: [[Number]],
    required: true,
  },
  solution: {
    type: [[Number]],
    required: true,
  },
  hints: {
    type: [hintSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index for faster queries
puzzleSchema.index({ difficulty: 1, gridSize: 1 });

// ==================== Game Schema ====================
export interface IGame {
  playerName: string;
  difficulty: string;
  gridSize: number;
  mode: 'single' | 'multiplayer';
  timeSeconds: number;
  mistakes: number;
  hintsUsed: number;
  points: number;
  completedAt: Date;
  roomId?: string;
  isWinner?: boolean;
}

const gameSchema = new Schema<IGame>({
  playerName: {
    type: String,
    required: true,
    trim: true,
  },
  difficulty: {
    type: String,
    required: true,
  },
  gridSize: {
    type: Number,
    required: true,
  },
  mode: {
    type: String,
    enum: ['single', 'multiplayer'],
    required: true,
  },
  timeSeconds: {
    type: Number,
    required: true,
  },
  mistakes: {
    type: Number,
    default: 0,
  },
  hintsUsed: {
    type: Number,
    default: 0,
  },
  points: {
    type: Number,
    required: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  roomId: {
    type: String,
    required: false,
  },
  isWinner: {
    type: Boolean,
    required: false,
  },
});

// Create index for leaderboard queries
gameSchema.index({ playerName: 1 });
gameSchema.index({ completedAt: -1 });

// ==================== Room Schema ====================
export interface IRoom {
  roomCode: string;
  hostName: string;
  guestName?: string;
  difficulty: string;
  gridSize: number;
  puzzleId: mongoose.Types.ObjectId;
  status: 'waiting' | 'playing' | 'completed' | 'abandoned';
  hostProgress: number;
  guestProgress: number;
  isPaused: boolean;
  pauseRequests: string[];
  createdAt: Date;
  expiresAt: Date;
  // Game result fields
  winnerName?: string;
  winnerTime?: number;
  winnerMistakes?: number;
  winnerHints?: number;
  loserName?: string;
  loserTime?: number;
  loserMistakes?: number;
  loserHints?: number;
  completedAt?: Date;
  leftByPlayer?: string; // Track who left the room
}

const roomSchema = new Schema<IRoom>({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  hostName: {
    type: String,
    required: true,
    trim: true,
  },
  guestName: {
    type: String,
    trim: true,
  },
  difficulty: {
    type: String,
    required: true,
  },
  gridSize: {
    type: Number,
    required: true,
  },
  puzzleId: {
    type: Schema.Types.ObjectId,
    ref: 'Puzzle',
    required: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'completed', 'abandoned'],
    default: 'waiting',
  },
  hostProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  guestProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  isPaused: {
    type: Boolean,
    default: false,
  },
  pauseRequests: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  // Game result fields
  winnerName: {
    type: String,
    trim: true,
  },
  winnerTime: {
    type: Number,
  },
  winnerMistakes: {
    type: Number,
  },
  winnerHints: {
    type: Number,
  },
  loserName: {
    type: String,
    trim: true,
  },
  loserTime: {
    type: Number,
  },
  loserMistakes: {
    type: Number,
  },
  loserHints: {
    type: Number,
  },
  completedAt: {
    type: Date,
  },
  leftByPlayer: {
    type: String,
    trim: true,
  },
});

// Create index for room code lookups
roomSchema.index({ roomCode: 1 });
roomSchema.index({ expiresAt: 1 }); // For TTL cleanup

// ==================== Export Models ====================
// Prevent model overwrite upon initial compile in development
export const Puzzle: Model<IPuzzle> =
  mongoose.models.Puzzle || mongoose.model<IPuzzle>('Puzzle', puzzleSchema);

export const Game: Model<IGame> =
  mongoose.models.Game || mongoose.model<IGame>('Game', gameSchema);

export const Room: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>('Room', roomSchema);
