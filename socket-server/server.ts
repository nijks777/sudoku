import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || '';
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected for socket server'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Import Room model (we'll create schema here since it's a separate server)
const roomSchema = new mongoose.Schema({
  roomCode: String,
  hostName: String,
  guestName: String,
  difficulty: String,
  gridSize: Number,
  puzzleId: mongoose.Schema.Types.ObjectId,
  status: String,
  hostProgress: Number,
  guestProgress: Number,
  isPaused: Boolean,
  pauseRequests: [String],
  createdAt: Date,
  expiresAt: Date,
  winnerName: String,
  winnerTime: Number,
  winnerMistakes: Number,
  winnerHints: Number,
  loserName: String,
  loserTime: Number,
  loserMistakes: Number,
  loserHints: Number,
  completedAt: Date,
  leftByPlayer: String,
});

const RoomModel = mongoose.models.Room || mongoose.model('Room', roomSchema);

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store active rooms in memory (can be moved to Redis for production)
interface Player {
  socketId: string;
  playerName: string;
  isReady: boolean;
  progress: number;
}

interface Room {
  roomCode: string;
  host: Player | null;
  guest: Player | null;
  difficulty: string;
  gridSize: number;
  puzzleId: string;
  status: 'waiting' | 'ready' | 'playing' | 'completed';
  isPaused: boolean;
  pauseRequests: string[]; // playerNames who requested pause
}

const rooms = new Map<string, Room>();

// Helper: Generate room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper: Get unique room code
function getUniqueRoomCode(): string {
  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }
  return code;
}

io.on('connection', (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Event: Create Room
  socket.on(
    'createRoom',
    (data: { hostName: string; difficulty: string; gridSize: number; puzzleId: string }) => {
      const roomCode = getUniqueRoomCode();

      const room: Room = {
        roomCode,
        host: {
          socketId: socket.id,
          playerName: data.hostName,
          isReady: false,
          progress: 0,
        },
        guest: null,
        difficulty: data.difficulty,
        gridSize: data.gridSize,
        puzzleId: data.puzzleId,
        status: 'waiting',
        isPaused: false,
        pauseRequests: [],
      };

      rooms.set(roomCode, room);
      socket.join(roomCode);

      console.log(`Room created: ${roomCode} by ${data.hostName}`);
      socket.emit('roomCreated', { roomCode, room });
    }
  );

  // Event: Join Room
  socket.on('joinRoom', (data: { roomCode: string; guestName: string }) => {
    const room = rooms.get(data.roomCode);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.guest) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    if (room.status !== 'waiting') {
      socket.emit('error', { message: 'Game already started' });
      return;
    }

    room.guest = {
      socketId: socket.id,
      playerName: data.guestName,
      isReady: false,
      progress: 0,
    };

    socket.join(data.roomCode);

    console.log(`${data.guestName} joined room: ${data.roomCode}`);

    // Notify both players
    socket.emit('roomJoined', { room });
    io.to(data.roomCode).emit('playerJoined', { room });
  });

  // Event: Player Ready
  socket.on('playerReady', (data: { roomCode: string; playerName: string }) => {
    const room = rooms.get(data.roomCode);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Update ready status
    if (room.host?.playerName === data.playerName) {
      room.host.isReady = true;
    } else if (room.guest?.playerName === data.playerName) {
      room.guest.isReady = true;
    }

    // Check if both players are ready
    if (room.host?.isReady && room.guest?.isReady) {
      room.status = 'ready';
    }

    io.to(data.roomCode).emit('playerReadyUpdate', { room });
  });

  // Event: Start Game
  socket.on('startGame', (data: { roomCode: string }) => {
    const room = rooms.get(data.roomCode);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.status !== 'ready') {
      socket.emit('error', { message: 'Both players must be ready' });
      return;
    }

    room.status = 'playing';
    console.log(`Game started in room: ${data.roomCode}`);

    io.to(data.roomCode).emit('gameStarted', { room, startTime: Date.now() });
  });

  // Event: Update Progress
  socket.on(
    'updateProgress',
    (data: { roomCode: string; playerName: string; progress: number }) => {
      const room = rooms.get(data.roomCode);

      if (!room) return;

      // Update progress
      if (room.host?.playerName === data.playerName) {
        room.host.progress = data.progress;
      } else if (room.guest?.playerName === data.playerName) {
        room.guest.progress = data.progress;
      }

      // Broadcast to other player
      socket.to(data.roomCode).emit('opponentProgress', {
        playerName: data.playerName,
        progress: data.progress,
      });
    }
  );

  // Event: Request Pause
  socket.on('requestPause', (data: { roomCode: string; playerName: string }) => {
    const room = rooms.get(data.roomCode);

    if (!room) return;

    // Add to pause requests if not already there
    if (!room.pauseRequests.includes(data.playerName)) {
      room.pauseRequests.push(data.playerName);
    }

    // If both players requested pause
    if (room.pauseRequests.length === 2) {
      room.isPaused = true;
      io.to(data.roomCode).emit('gamePaused', { room });
    } else {
      // Notify other player about pause request
      socket.to(data.roomCode).emit('pauseRequested', { playerName: data.playerName });
    }
  });

  // Event: Resume Game
  socket.on('resumeGame', (data: { roomCode: string }) => {
    const room = rooms.get(data.roomCode);

    if (!room) return;

    room.isPaused = false;
    room.pauseRequests = [];

    io.to(data.roomCode).emit('gameResumed', { room });
  });

  // Event: Game Complete
  socket.on(
    'gameComplete',
    async (data: {
      roomCode: string;
      playerName: string;
      timeSeconds: number;
      mistakes: number;
      hintsUsed: number;
    }) => {
      const room = rooms.get(data.roomCode);

      if (!room) return;

      room.status = 'completed';

      // Determine winner (first to complete) and loser
      const winner = data.playerName;
      const loser = room.host?.playerName === winner ? room.guest?.playerName : room.host?.playerName;

      // Determine winner (first to complete)
      const winnerData = {
        winner: data.playerName,
        playerData: data,
      };

      console.log(`Game completed in room: ${data.roomCode}. Winner: ${data.playerName}`);

      io.to(data.roomCode).emit('gameEnded', winnerData);

      // Save room result to MongoDB
      try {
        await RoomModel.findOneAndUpdate(
          { roomCode: data.roomCode },
          {
            status: 'completed',
            winnerName: winner,
            winnerTime: data.timeSeconds,
            winnerMistakes: data.mistakes,
            winnerHints: data.hintsUsed,
            loserName: loser,
            completedAt: new Date(),
          },
          { upsert: true, new: true }
        );
        console.log(`✅ Room result saved to MongoDB: ${data.roomCode}`);
      } catch (error) {
        console.error('❌ Failed to save room result:', error);
      }

      // Clean up room after 30 seconds
      setTimeout(() => {
        rooms.delete(data.roomCode);
        console.log(`Room deleted: ${data.roomCode}`);
      }, 30000);
    }
  );

  // Event: Leave Room
  socket.on('leaveRoom', async (data: { roomCode: string; playerName: string }) => {
    const room = rooms.get(data.roomCode);

    if (!room) return;

    console.log(`${data.playerName} left room: ${data.roomCode}`);

    // Notify other player
    socket.to(data.roomCode).emit('playerLeft', { playerName: data.playerName });

    // If game was in progress, save as abandoned
    if (room.status === 'playing') {
      const otherPlayer = room.host?.playerName === data.playerName ? room.guest?.playerName : room.host?.playerName;

      try {
        await RoomModel.findOneAndUpdate(
          { roomCode: data.roomCode },
          {
            status: 'abandoned',
            leftByPlayer: data.playerName,
            winnerName: otherPlayer, // Other player wins by default
            completedAt: new Date(),
          },
          { upsert: true, new: true }
        );
        console.log(`✅ Room abandoned and saved to MongoDB: ${data.roomCode}`);
      } catch (error) {
        console.error('❌ Failed to save abandoned room:', error);
      }
    }

    // Remove room from memory
    if (room.status === 'waiting' || room.status === 'playing') {
      rooms.delete(data.roomCode);
      console.log(`Room deleted (player left): ${data.roomCode}`);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`Client disconnected: ${socket.id}`);

    // Find and handle room cleanup
    for (const [roomCode, room] of rooms.entries()) {
      if (room.host?.socketId === socket.id || room.guest?.socketId === socket.id) {
        const playerName =
          room.host?.socketId === socket.id ? room.host.playerName : room.guest?.playerName;

        // Notify other player
        socket.to(roomCode).emit('playerLeft', { playerName });

        // If game was in progress, save as abandoned
        if (room.status === 'playing') {
          const otherPlayer = room.host?.socketId === socket.id ? room.guest?.playerName : room.host?.playerName;

          try {
            await RoomModel.findOneAndUpdate(
              { roomCode },
              {
                status: 'abandoned',
                leftByPlayer: playerName,
                winnerName: otherPlayer,
                completedAt: new Date(),
              },
              { upsert: true, new: true }
            );
            console.log(`✅ Room abandoned (disconnect) and saved: ${roomCode}`);
          } catch (error) {
            console.error('❌ Failed to save abandoned room:', error);
          }
        }

        // Delete room if game not started or in progress
        if (room.status === 'waiting' || room.status === 'ready' || room.status === 'playing') {
          rooms.delete(roomCode);
          console.log(`Room deleted (disconnect): ${roomCode}`);
        }
      }
    }
  });
});

const PORT = process.env.SOCKET_PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.io server running on port ${PORT}`);
});
