'use client';

import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';

// Types for room and player data
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
  pauseRequests: string[];
}

export const useMultiplayer = () => {
  const { socket, isConnected } = useSocket();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opponentProgress, setOpponentProgress] = useState<number>(0);

  useEffect(() => {
    if (!socket) return;

    // Listen for room created
    socket.on('roomCreated', (data: { roomCode: string; room: Room }) => {
      console.log('Room created:', data.roomCode);
      setRoom(data.room);
      setError(null);
    });

    // Listen for room joined
    socket.on('roomJoined', (data: { room: Room }) => {
      console.log('Room joined:', data.room.roomCode);
      setRoom(data.room);
      setError(null);
    });

    // Listen for player joined
    socket.on('playerJoined', (data: { room: Room }) => {
      console.log('Player joined room');
      setRoom(data.room);
    });

    // Listen for player ready updates
    socket.on('playerReadyUpdate', (data: { room: Room }) => {
      console.log('Player ready update');
      setRoom(data.room);
    });

    // Listen for game started
    socket.on('gameStarted', (data: { room: Room; startTime: number }) => {
      console.log('Game started!');
      setRoom(data.room);
    });

    // Listen for opponent progress
    socket.on('opponentProgress', (data: { playerName: string; progress: number }) => {
      console.log('Opponent progress:', data.progress);
      setOpponentProgress(data.progress);
    });

    // Listen for pause requested
    socket.on('pauseRequested', (data: { playerName: string }) => {
      console.log('Pause requested by:', data.playerName);
    });

    // Listen for game paused
    socket.on('gamePaused', (data: { room: Room }) => {
      console.log('Game paused');
      setRoom(data.room);
    });

    // Listen for game resumed
    socket.on('gameResumed', (data: { room: Room }) => {
      console.log('Game resumed');
      setRoom(data.room);
    });

    // Listen for game ended
    socket.on('gameEnded', (data: { winner: string; playerData: any }) => {
      console.log('Game ended. Winner:', data.winner);
    });

    // Listen for player left
    socket.on('playerLeft', (data: { playerName: string }) => {
      console.log('Player left:', data.playerName);
      setError(`${data.playerName} left the game`);
    });

    // Listen for errors
    socket.on('error', (data: { message: string }) => {
      console.error('Socket error:', data.message);
      setError(data.message);
    });

    // Cleanup
    return () => {
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('playerJoined');
      socket.off('playerReadyUpdate');
      socket.off('gameStarted');
      socket.off('opponentProgress');
      socket.off('pauseRequested');
      socket.off('gamePaused');
      socket.off('gameResumed');
      socket.off('gameEnded');
      socket.off('playerLeft');
      socket.off('error');
    };
  }, [socket]);

  // Actions
  const createRoom = (data: {
    hostName: string;
    difficulty: string;
    gridSize: number;
    puzzleId: string;
  }) => {
    if (!socket) {
      setError('Socket not connected');
      return;
    }
    socket.emit('createRoom', data);
  };

  const joinRoom = (data: { roomCode: string; guestName: string }) => {
    if (!socket) {
      setError('Socket not connected');
      return;
    }
    socket.emit('joinRoom', data);
  };

  const setPlayerReady = (data: { roomCode: string; playerName: string }) => {
    if (!socket) return;
    socket.emit('playerReady', data);
  };

  const startGame = (data: { roomCode: string }) => {
    if (!socket) return;
    socket.emit('startGame', data);
  };

  const updateProgress = (data: { roomCode: string; playerName: string; progress: number }) => {
    if (!socket) return;
    socket.emit('updateProgress', data);
  };

  const requestPause = (data: { roomCode: string; playerName: string }) => {
    if (!socket) return;
    socket.emit('requestPause', data);
  };

  const resumeGame = (data: { roomCode: string }) => {
    if (!socket) return;
    socket.emit('resumeGame', data);
  };

  const gameComplete = (data: {
    roomCode: string;
    playerName: string;
    timeSeconds: number;
    mistakes: number;
    hintsUsed: number;
  }) => {
    if (!socket) return;
    socket.emit('gameComplete', data);
  };

  const leaveRoom = (data: { roomCode: string; playerName: string }) => {
    if (!socket) return;
    socket.emit('leaveRoom', data);
  };

  return {
    isConnected,
    room,
    error,
    opponentProgress,
    createRoom,
    joinRoom,
    setPlayerReady,
    startGame,
    updateProgress,
    requestPause,
    resumeGame,
    gameComplete,
    leaveRoom,
  };
};
