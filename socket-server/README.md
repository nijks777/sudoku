# Sudoku Socket.io Server

Real-time multiplayer WebSocket server for Sudoku game.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (already created):
```
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
SOCKET_PORT=3001
```

## Running

### Development (with hot reload):
```bash
npm run dev
```

### Production:
```bash
npm start
```

## Socket Events

### Client → Server
- `createRoom` - Create a new multiplayer room
- `joinRoom` - Join existing room
- `playerReady` - Mark player as ready
- `startGame` - Start the game (host only)
- `updateProgress` - Send progress update
- `requestPause` - Request game pause
- `resumeGame` - Resume paused game
- `gameComplete` - Notify game completion
- `leaveRoom` - Leave the room

### Server → Client
- `roomCreated` - Room successfully created
- `roomJoined` - Successfully joined room
- `playerJoined` - Another player joined
- `playerReadyUpdate` - Player ready status changed
- `gameStarted` - Game has started
- `opponentProgress` - Opponent's progress update
- `pauseRequested` - Opponent requested pause
- `gamePaused` - Game is now paused
- `gameResumed` - Game resumed
- `gameEnded` - Game completed with winner
- `playerLeft` - Player left the room
- `error` - Error message

## Deployment

Deploy to Railway or Render:

1. Connect GitHub repository
2. Set environment variables:
   - `NEXT_PUBLIC_CLIENT_URL` - Your frontend URL
   - `SOCKET_PORT` - 3001 (or Railway/Render assigned port)
3. Deploy!

## Port

Default: `3001`
Can be changed via `SOCKET_PORT` environment variable.
