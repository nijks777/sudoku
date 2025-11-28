'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useMultiplayer } from '@/lib/socket/useMultiplayer';
import Link from 'next/link';

function RoomLobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const difficulty = searchParams.get('difficulty');
  const name = searchParams.get('name');

  const {
    isConnected,
    room,
    error,
    createRoom,
    joinRoom,
    setPlayerReady,
    startGame,
    leaveRoom,
  } = useMultiplayer();

  const [videoLoaded, setVideoLoaded] = useState(false);
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [puzzleId, setPuzzleId] = useState<string | null>(null);

  // Fetch puzzle when creating room
  useEffect(() => {
    if (mode === 'create' && !puzzleId) {
      fetchPuzzle();
    }
  }, [mode]);

  const fetchPuzzle = async () => {
    try {
      const response = await fetch(`/api/puzzle?difficulty=${difficulty}`);
      const data = await response.json();
      console.log('Puzzle data:', data);
      if (data.id) {
        console.log('Setting puzzle ID:', data.id);
        setPuzzleId(data.id);
      } else {
        console.error('No puzzle ID found in response');
      }
    } catch (err) {
      console.error('Failed to fetch puzzle:', err);
    }
  };

  const handleCreateRoom = () => {
    if (!puzzleId || !name) return;

    const gridSize = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 9;

    createRoom({
      hostName: name,
      difficulty: difficulty || 'easy',
      gridSize,
      puzzleId,
    });
  };

  const handleJoinRoom = () => {
    if (!roomCodeInput.trim() || !name) return;
    joinRoom({
      roomCode: roomCodeInput.toUpperCase(),
      guestName: name,
    });
  };

  const handleReady = () => {
    if (!room || !name) return;
    setPlayerReady({
      roomCode: room.roomCode,
      playerName: name,
    });
  };

  // Check if current player is ready based on room data
  const isCurrentPlayerReady = () => {
    if (!room || !name) return false;
    const isHost = room.host?.playerName === name;
    return isHost ? room.host?.isReady : room.guest?.isReady;
  };

  const handleStartGame = () => {
    if (!room) return;
    startGame({ roomCode: room.roomCode });
  };

  const handleLeave = () => {
    if (room && name) {
      leaveRoom({ roomCode: room.roomCode, playerName: name });
    }
    router.push('/game/multiplayer');
  };

  // Navigate to game when started
  useEffect(() => {
    if (room?.status === 'playing') {
      console.log('Game starting, room data:', room);
      router.push(
        `/game/multiplayer/game?roomCode=${room.roomCode}&name=${encodeURIComponent(name || '')}&difficulty=${difficulty}&puzzleId=${room.puzzleId}`
      );
    }
  }, [room?.status]);

  // Debug connection status
  useEffect(() => {
    console.log('Connection status:', isConnected);
    console.log('Puzzle ID:', puzzleId);
    console.log('Room:', room);
  }, [isConnected, puzzleId, room]);

  const getDifficultyInfo = () => {
    switch (difficulty) {
      case 'easy':
        return { emoji: '🌱', color: 'green', size: '4×4', label: 'Easy' };
      case 'medium':
        return { emoji: '🔥', color: 'orange', size: '6×6', label: 'Medium' };
      case 'hard':
        return { emoji: '💀', color: 'red', size: '9×9', label: 'Hard' };
      default:
        return { emoji: '🎮', color: 'orange', size: '?×?', label: 'Unknown' };
    }
  };

  const diffInfo = getDifficultyInfo();
  const isHost = room?.host?.playerName === name;
  const canStartGame = room?.status === 'ready' && isHost;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-orange-50">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
          videoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        {/* Back Button */}
        <button
          onClick={handleLeave}
          className="absolute left-8 top-8 cursor-pointer rounded-full border-2 border-orange-500/60 bg-orange-100/90 px-6 py-2 font-semibold text-orange-800 backdrop-blur-sm transition-all hover:border-orange-600 hover:bg-orange-200 hover:shadow-lg"
        >
          ← Leave
        </button>

        {/* Connection Status */}
        <div className="absolute right-8 top-8 rounded-full border-2 border-orange-500/60 bg-orange-100/90 px-4 py-2 backdrop-blur-sm">
          <span
            className={`text-sm font-semibold ${isConnected ? 'text-green-700' : 'text-red-700'}`}
          >
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>

        {/* Main Container */}
        <div className="max-w-3xl rounded-3xl border-4 border-orange-400/60 bg-gradient-to-br from-orange-50/95 via-amber-50/95 to-orange-100/95 p-8 shadow-2xl backdrop-blur-sm sm:p-12">
          {/* Error Display */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-100 p-4 text-center">
              <p className="font-semibold text-red-800">⚠️ {error}</p>
            </div>
          )}

          {/* If No Room: Mode Selection or Room Actions */}
          {!room && (
            <>
              {mode === 'select' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="mb-4 text-6xl">{diffInfo.emoji}</div>
                    <h1 className="mb-2 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 bg-clip-text text-4xl font-bold text-transparent">
                      {diffInfo.label} {diffInfo.size}
                    </h1>
                    <p className="text-lg font-semibold text-orange-700">
                      Hello, {name}! Choose an option:
                    </p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => setMode('create')}
                      className="w-full cursor-pointer rounded-2xl border-3 border-green-500/70 bg-gradient-to-br from-green-100 to-emerald-100 px-8 py-6 text-xl font-bold text-green-900 shadow-lg transition-all hover:scale-105 hover:from-green-200 hover:to-emerald-200"
                    >
                      🎮 Create New Room
                    </button>

                    <button
                      onClick={() => setMode('join')}
                      className="w-full cursor-pointer rounded-2xl border-3 border-blue-500/70 bg-gradient-to-br from-blue-100 to-cyan-100 px-8 py-6 text-xl font-bold text-blue-900 shadow-lg transition-all hover:scale-105 hover:from-blue-200 hover:to-cyan-200"
                    >
                      🔗 Join Existing Room
                    </button>
                  </div>
                </div>
              )}

              {mode === 'create' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="mb-2 text-3xl font-bold text-orange-800">
                      Create Room
                    </h2>
                    <p className="text-orange-600">Share the room code with your friend</p>
                    {!isConnected && (
                      <p className="mt-2 text-sm text-red-600">⏳ Connecting to server...</p>
                    )}
                  </div>

                  <button
                    onClick={handleCreateRoom}
                    disabled={!isConnected || !puzzleId}
                    className="w-full cursor-pointer rounded-2xl bg-linear-to-r from-orange-500 to-amber-500 px-8 py-5 text-2xl font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-orange-600 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {!isConnected ? '⏳ Connecting...' : puzzleId ? '✨ Create Room' : '⏳ Loading puzzle...'}
                  </button>

                  <button
                    onClick={() => setMode('select')}
                    className="w-full cursor-pointer rounded-xl border-2 border-orange-400 bg-white px-6 py-3 font-semibold text-orange-800 transition-all hover:bg-orange-50"
                  >
                    ← Back
                  </button>
                </div>
              )}

              {mode === 'join' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="mb-2 text-3xl font-bold text-orange-800">Join Room</h2>
                    <p className="text-orange-600">Enter the 6-character room code</p>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={roomCodeInput}
                      onChange={(e) =>
                        setRoomCodeInput(e.target.value.toUpperCase().slice(0, 6))
                      }
                      placeholder="ABC123"
                      className="w-full rounded-xl border-2 border-orange-300 bg-white px-6 py-4 text-center text-2xl font-bold uppercase tracking-widest text-orange-900 outline-none focus:border-orange-500"
                      maxLength={6}
                    />
                  </div>

                  <button
                    onClick={handleJoinRoom}
                    disabled={!isConnected || roomCodeInput.length !== 6}
                    className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-5 text-2xl font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-blue-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    🔗 Join Room
                  </button>

                  <button
                    onClick={() => setMode('select')}
                    className="w-full cursor-pointer rounded-xl border-2 border-orange-400 bg-white px-6 py-3 font-semibold text-orange-800 transition-all hover:bg-orange-50"
                  >
                    ← Back
                  </button>
                </div>
              )}
            </>
          )}

          {/* If Room Exists: Show Lobby */}
          {room && (
            <div className="space-y-6">
              {/* Room Code Display */}
              <div className="rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 p-6 text-center">
                <p className="mb-2 text-sm font-semibold text-purple-700">ROOM CODE</p>
                <p className="mb-3 text-5xl font-bold tracking-widest text-purple-900">
                  {room.roomCode}
                </p>
                <p className="text-sm text-purple-600">Share this code with your opponent</p>
              </div>

              {/* Players */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-orange-800">Players</h3>

                {/* Host */}
                <div
                  className={`rounded-xl border-2 p-4 ${
                    room.host?.isReady
                      ? 'border-green-400 bg-green-50'
                      : 'border-orange-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-orange-900">
                        👑 {room.host?.playerName} (Host)
                      </p>
                      {isHost && <p className="text-sm text-orange-600">You</p>}
                    </div>
                    <div>
                      {room.host?.isReady ? (
                        <span className="rounded-full bg-green-600 px-4 py-1 text-sm font-bold text-white">
                          ✓ Ready
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-300 px-4 py-1 text-sm font-bold text-gray-700">
                          Waiting
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Guest */}
                {room.guest ? (
                  <div
                    className={`rounded-xl border-2 p-4 ${
                      room.guest.isReady
                        ? 'border-green-400 bg-green-50'
                        : 'border-orange-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-orange-900">⚔️ {room.guest.playerName}</p>
                        {!isHost && <p className="text-sm text-orange-600">You</p>}
                      </div>
                      <div>
                        {room.guest.isReady ? (
                          <span className="rounded-full bg-green-600 px-4 py-1 text-sm font-bold text-white">
                            ✓ Ready
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-300 px-4 py-1 text-sm font-bold text-gray-700">
                            Waiting
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/50 p-6 text-center">
                    <p className="text-orange-600">Waiting for opponent to join...</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {!isCurrentPlayerReady() && (
                  <button
                    onClick={handleReady}
                    className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-5 text-2xl font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-green-600 hover:to-emerald-600"
                  >
                    ✓ I'm Ready!
                  </button>
                )}

                {canStartGame && (
                  <button
                    onClick={handleStartGame}
                    className="w-full cursor-pointer animate-pulse rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-5 text-2xl font-bold text-white shadow-lg transition-all hover:scale-105"
                  >
                    🚀 Start Game!
                  </button>
                )}

                {room.status === 'ready' && !isHost && (
                  <div className="rounded-xl bg-yellow-100 p-4 text-center">
                    <p className="font-semibold text-yellow-800">
                      ⏳ Waiting for host to start the game...
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RoomLobbyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <RoomLobbyContent />
    </Suspense>
  );
}
