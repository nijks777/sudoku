'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useMultiplayer } from '@/lib/socket/useMultiplayer';

function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('roomCode');
  const name = searchParams.get('name');

  const {
    isConnected,
    room,
    error,
    setPlayerReady,
    startGame,
    leaveRoom,
  } = useMultiplayer();

  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleReady = () => {
    if (!room || !name) return;
    setPlayerReady({
      roomCode: room.roomCode,
      playerName: name,
    });
    setIsReady(true);
  };

  const handleStartGame = () => {
    if (!room) return;
    startGame({ roomCode: room.roomCode });
  };

  const handleLeave = () => {
    if (room && name) {
      leaveRoom({ roomCode: room.roomCode, playerName: name });
    }
    router.push('/');
  };

  // Navigate to game when started
  useEffect(() => {
    if (room?.status === 'playing') {
      // Get difficulty from room
      const difficulty = room.difficulty;
      router.push(
        `/game/multiplayer/game?roomCode=${room.roomCode}&name=${encodeURIComponent(name || '')}&difficulty=${difficulty}`
      );
    }
  }, [room?.status]);

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
        <div className="max-w-3xl rounded-3xl border-4 border-orange-400/60 bg-linear-to-br from-orange-50/95 via-amber-50/95 to-orange-100/95 p-8 shadow-2xl backdrop-blur-sm sm:p-12">
          {/* Error Display */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-100 p-4 text-center">
              <p className="font-semibold text-red-800">⚠️ {error}</p>
            </div>
          )}

          {/* Room Lobby */}
          {room ? (
            <div className="space-y-6">
              {/* Room Code Display */}
              <div className="rounded-2xl bg-linear-to-r from-purple-100 to-pink-100 p-6 text-center">
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
                {!isReady && (
                  <button
                    onClick={handleReady}
                    className="w-full cursor-pointer rounded-2xl bg-linear-to-r from-green-500 to-emerald-500 px-8 py-5 text-2xl font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-green-600 hover:to-emerald-600"
                  >
                    ✓ I'm Ready!
                  </button>
                )}

                {canStartGame && (
                  <button
                    onClick={handleStartGame}
                    className="w-full cursor-pointer animate-pulse rounded-2xl bg-linear-to-r from-purple-500 to-pink-500 px-8 py-5 text-2xl font-bold text-white shadow-lg transition-all hover:scale-105"
                  >
                    ��� Start Game!
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
          ) : (
            <div className="text-center">
              <div className="mb-4 text-6xl">⏳</div>
              <h2 className="text-2xl font-bold text-orange-800">Joining room...</h2>
              <p className="mt-2 text-orange-600">Room Code: {roomCode}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LobbyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <LobbyContent />
    </Suspense>
  );
}
