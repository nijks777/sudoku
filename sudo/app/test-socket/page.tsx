'use client';

import { useSocket } from '@/lib/socket/useSocket';
import { useMultiplayer } from '@/lib/socket/useMultiplayer';
import { useState } from 'react';

export default function TestSocketPage() {
  const { isConnected, transport } = useSocket();
  const {
    room,
    error,
    createRoom,
    joinRoom,
    setPlayerReady,
    startGame,
    leaveRoom,
  } = useMultiplayer();

  const [playerName, setPlayerName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');

  const handleCreateRoom = () => {
    if (!playerName) {
      alert('Please enter your name');
      return;
    }
    createRoom({
      hostName: playerName,
      difficulty: 'easy',
      gridSize: 4,
      puzzleId: 'test-puzzle-id',
    });
  };

  const handleJoinRoom = () => {
    if (!playerName || !roomCodeInput) {
      alert('Please enter your name and room code');
      return;
    }
    joinRoom({
      roomCode: roomCodeInput,
      guestName: playerName,
    });
  };

  const handleReady = () => {
    if (!room || !playerName) return;
    setPlayerReady({
      roomCode: room.roomCode,
      playerName,
    });
  };

  const handleStartGame = () => {
    if (!room) return;
    startGame({ roomCode: room.roomCode });
  };

  const handleLeaveRoom = () => {
    if (!room || !playerName) return;
    leaveRoom({
      roomCode: room.roomCode,
      playerName,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold">Socket.io Connection Test</h1>

        {/* Connection Status */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-semibold">Connection Status</h2>
          <div className="space-y-2">
            <p>
              Status:{' '}
              <span
                className={`font-bold ${isConnected ? 'text-green-600' : 'text-red-600'}`}
              >
                {isConnected ? '✅ Connected' : '❌ Disconnected'}
              </span>
            </p>
            <p>
              Transport: <span className="font-mono">{transport}</span>
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 rounded-lg bg-red-100 p-4 text-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Room Info */}
        {room && (
          <div className="mb-8 rounded-lg bg-blue-100 p-6">
            <h2 className="mb-4 text-2xl font-semibold">Room Info</h2>
            <div className="space-y-2">
              <p>
                <strong>Room Code:</strong> {room.roomCode}
              </p>
              <p>
                <strong>Status:</strong> {room.status}
              </p>
              <p>
                <strong>Host:</strong> {room.host?.playerName}{' '}
                {room.host?.isReady && '(Ready)'}
              </p>
              {room.guest && (
                <p>
                  <strong>Guest:</strong> {room.guest.playerName}{' '}
                  {room.guest.isReady && '(Ready)'}
                </p>
              )}
              <p>
                <strong>Difficulty:</strong> {room.difficulty}
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-semibold">Test Controls</h2>

          <div className="space-y-4">
            {/* Player Name */}
            <div>
              <label className="mb-2 block font-semibold">Your Name:</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full rounded border border-gray-300 px-4 py-2"
                placeholder="Enter your name"
              />
            </div>

            {!room && (
              <>
                {/* Create Room */}
                <button
                  onClick={handleCreateRoom}
                  disabled={!isConnected}
                  className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Create Room
                </button>

                {/* Join Room */}
                <div>
                  <label className="mb-2 block font-semibold">Room Code:</label>
                  <input
                    type="text"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    className="mb-2 w-full rounded border border-gray-300 px-4 py-2"
                    placeholder="Enter room code"
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={!isConnected}
                    className="w-full rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:bg-gray-400"
                  >
                    Join Room
                  </button>
                </div>
              </>
            )}

            {room && (
              <>
                {/* Ready Button */}
                <button
                  onClick={handleReady}
                  className="w-full rounded bg-yellow-600 px-4 py-2 font-semibold text-white hover:bg-yellow-700"
                >
                  Mark Ready
                </button>

                {/* Start Game (Host Only) */}
                {room.host?.playerName === playerName && (
                  <button
                    onClick={handleStartGame}
                    disabled={room.status !== 'ready'}
                    className="w-full rounded bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 disabled:bg-gray-400"
                  >
                    Start Game
                  </button>
                )}

                {/* Leave Room */}
                <button
                  onClick={handleLeaveRoom}
                  className="w-full rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                >
                  Leave Room
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
