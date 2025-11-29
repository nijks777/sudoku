# 🔌 Socket.io Server - Real-time Multiplayer

A standalone **Socket.io** server for handling real-time multiplayer Sudoku battles. This server manages game rooms, player synchronization, and real-time events for 1v1 Sudoku competitions.

---

## 📋 Overview

This is a separate Node.js server that handles WebSocket connections for the Sudoku multiplayer mode. It runs independently from the Next.js application and communicates with clients using Socket.io.

### Why a Separate Server?

- **Dedicated WebSocket Handling**: Keeps long-lived WebSocket connections separate from serverless Next.js API routes
- **Better Performance**: Optimized specifically for real-time communication
- **Scalability**: Can be deployed on platforms that support persistent connections (Render, Railway)
- **Independent Scaling**: Scale WebSocket server independently from the main application

---

## 🚀 Features

### Real-time Multiplayer
- **Room Management**: Create and join 6-character unique room codes
- **Player Synchronization**: Real-time progress updates between players
- **Game State Management**: Track game status, pauses, and completion
- **Disconnection Handling**: Graceful handling of player disconnections
- **Automatic Cleanup**: Rooms auto-expire after 24 hours

### Events Handled
- `createRoom` - Host creates a new game room
- `joinRoom` - Guest joins an existing room
- `playerReady` - Players mark themselves as ready
- `startGame` - Begin the multiplayer game
- `updateProgress` - Send progress updates (0-100%)
- `requestPause` - Request game pause (requires both players)
- `resumeGame` - Resume a paused game
- `gameComplete` - First player to finish wins
- `leaveRoom` - Player leaves the room
- `disconnect` - Handle unexpected disconnections

---

## 🛠 Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5
- **WebSocket Library**: Socket.io 4.8
- **Database**: MongoDB (Mongoose) - for persisting game results
- **Environment**: dotenv for configuration

---

## 📁 Project Structure

```
socket-server/
├── server.ts              # Main Socket.io server
├── package.json           # Dependencies and scripts
├── render.yaml            # Render deployment config
├── .env                   # Environment variables (not in git)
└── README.md              # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20 or higher
- npm v10 or higher
- MongoDB connection string

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**

   Create a `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/sudoku?retryWrites=true&w=majority
   NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
   SOCKET_PORT=3001
   ```

### Running Locally

**Development mode (with auto-reload)**:
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:3001`

---

## 🌐 Deployment

### Deploy to Render

1. **Create a new Web Service** on [render.com](https://render.com)

2. **Configure**:
   - **Repository**: Your GitHub repo
   - **Root Directory**: `socket-server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

3. **Environment Variables**:
   ```
   MONGODB_URI=mongodb+srv://...
   NEXT_PUBLIC_CLIENT_URL=https://your-app.vercel.app
   SOCKET_PORT=10000
   ```

4. **Deploy!**

Render will provide a URL like: `https://your-app-name.onrender.com`

### Deploy to Railway (Alternative)

1. **Create a new project** on [railway.app](https://railway.app)
2. **Deploy from GitHub**
3. **Set Root Directory**: `socket-server`
4. **Add Environment Variables** (same as above)
5. Railway auto-detects Node.js and runs `npm start`

---

## 🔌 Socket.io Events

### Client → Server Events

#### `createRoom`
```typescript
socket.emit('createRoom', {
  hostName: string,
  difficulty: 'easy' | 'medium' | 'hard',
  gridSize: 4 | 6 | 9 | 12,
  puzzleId: string
});
```

**Response**: `roomCreated` event with room code

---

#### `joinRoom`
```typescript
socket.emit('joinRoom', {
  roomCode: string,
  guestName: string
});
```

**Responses**:
- `roomJoined` - Successfully joined
- `playerJoined` - Broadcast to host
- `error` - Room not found/full/started

---

#### `playerReady`
```typescript
socket.emit('playerReady', {
  roomCode: string,
  playerName: string
});
```

**Response**: `playerReadyUpdate` when ready status changes

---

#### `startGame`
```typescript
socket.emit('startGame', {
  roomCode: string
});
```

**Response**: `gameStarted` with start timestamp

---

#### `updateProgress`
```typescript
socket.emit('updateProgress', {
  roomCode: string,
  playerName: string,
  progress: number  // 0-100
});
```

**Response**: `opponentProgress` broadcast to other player

---

#### `requestPause`
```typescript
socket.emit('requestPause', {
  roomCode: string,
  playerName: string
});
```

**Responses**:
- `pauseRequested` - Sent to opponent
- `gamePaused` - When both players agree

---

#### `resumeGame`
```typescript
socket.emit('resumeGame', {
  roomCode: string
});
```

**Response**: `gameResumed` to both players

---

#### `gameComplete`
```typescript
socket.emit('gameComplete', {
  roomCode: string,
  playerName: string,
  timeSeconds: number,
  mistakes: number,
  hintsUsed: number
});
```

**Response**: `gameEnded` with winner information
**Side Effect**: Game result saved to MongoDB

---

#### `leaveRoom`
```typescript
socket.emit('leaveRoom', {
  roomCode: string,
  playerName: string
});
```

**Response**: `playerLeft` broadcast to opponent
**Side Effect**: Room marked as abandoned in database

---

### Server → Client Events

#### `roomCreated`
```typescript
{
  roomCode: string,
  room: Room
}
```

#### `roomJoined` & `playerJoined`
```typescript
{
  room: Room
}
```

#### `gameStarted`
```typescript
{
  room: Room,
  startTime: number
}
```

#### `opponentProgress`
```typescript
{
  playerName: string,
  progress: number
}
```

#### `gameEnded`
```typescript
{
  winner: string,
  playerData: {
    playerName: string,
    timeSeconds: number,
    mistakes: number,
    hintsUsed: number
  }
}
```

#### `error`
```typescript
{
  message: string
}
```

---

## 🗄 Room Data Structure

```typescript
interface Room {
  roomCode: string;               // 6-char unique code
  host: Player | null;
  guest: Player | null;
  difficulty: string;
  gridSize: number;
  puzzleId: string;
  status: 'waiting' | 'ready' | 'playing' | 'completed';
  isPaused: boolean;
  pauseRequests: string[];
}

interface Player {
  socketId: string;
  playerName: string;
  isReady: boolean;
  progress: number;               // 0-100
}
```

---

## 🔒 CORS Configuration

The server accepts connections from:
- **Development**: `http://localhost:3000`
- **Production**: Your Vercel app URL (set via `NEXT_PUBLIC_CLIENT_URL`)

```typescript
{
  origin: process.env.NEXT_PUBLIC_CLIENT_URL,
  methods: ['GET', 'POST'],
  credentials: true
}
```

---

## 📊 Database Integration

When games complete or are abandoned, results are saved to MongoDB:

**Completed Game**:
```typescript
{
  roomCode, status: 'completed',
  winnerName, winnerTime, winnerMistakes, winnerHints,
  loserName, completedAt
}
```

**Abandoned Game**:
```typescript
{
  roomCode, status: 'abandoned',
  leftByPlayer, winnerName, completedAt
}
```

---

## 🧪 Testing

### Test Connection
```javascript
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connected!', socket.id));
```

### Test Room Creation
```javascript
socket.emit('createRoom', {
  hostName: 'TestUser',
  difficulty: 'easy',
  gridSize: 4,
  puzzleId: '507f1f77bcf86cd799439011'
});

socket.on('roomCreated', (data) => console.log('Room Code:', data.roomCode));
```

---

## 🐛 Debugging

### Enable Debug Logs
```bash
DEBUG=socket.io* npm run dev
```

### Common Issues

**Port already in use**:
```bash
lsof -ti:3001 | xargs kill -9
```

**CORS errors**: Check `NEXT_PUBLIC_CLIENT_URL` matches frontend URL

**MongoDB connection failed**: Verify `MONGODB_URI` and IP whitelist

---

## 📄 License

Part of the Sudoku Web Application - MIT License

---

**Last Updated**: November 2025
