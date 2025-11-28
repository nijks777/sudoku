'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer } from '@/lib/socket/useMultiplayer';

export default function JoinRoomPage() {
  const router = useRouter();
  const { isConnected, joinRoom, error, room } = useMultiplayer();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [nameError, setNameError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Navigate to lobby when room is joined
  useEffect(() => {
    if (room && isJoining) {
      router.push(
        `/game/multiplayer/lobby?roomCode=${room.roomCode}&name=${encodeURIComponent(playerName.trim())}`
      );
    }
  }, [room, isJoining]);

  // Reset joining state on error
  useEffect(() => {
    if (error && isJoining) {
      setIsJoining(false);
    }
  }, [error]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!playerName.trim()) {
      setNameError('Please enter your name');
      return;
    }

    if (playerName.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }

    if (!roomCode.trim() || roomCode.length !== 6) {
      setNameError('Please enter a valid 6-character room code');
      return;
    }

    // Set joining state
    setIsJoining(true);

    // Join room via socket
    joinRoom({
      roomCode: roomCode.toUpperCase(),
      guestName: playerName.trim(),
    });
  };

  const handleBack = () => {
    router.push('/');
  };

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
          onClick={handleBack}
          className="absolute left-8 top-8 cursor-pointer rounded-full border-2 border-orange-500/60 bg-orange-100/90 px-6 py-2 font-semibold text-orange-800 backdrop-blur-sm transition-all hover:border-orange-600 hover:bg-orange-200 hover:shadow-lg"
        >
          ← Back
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
        <div className="max-w-2xl rounded-3xl border-4 border-orange-400/60 bg-linear-to-br from-orange-50/95 via-amber-50/95 to-orange-100/95 p-8 shadow-2xl backdrop-blur-sm sm:p-12 md:p-16">
          {/* Title */}
          <div className="mb-8 text-center">
            <div className="mb-4 text-7xl">🔗</div>
            <h1 className="mb-4 bg-linear-to-r from-orange-600 via-orange-500 to-amber-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent drop-shadow-lg sm:text-5xl">
              Join a Room
            </h1>
            <p className="text-lg font-semibold tracking-wide text-orange-700">
              Enter room code to join your friend
            </p>
          </div>

          {/* Error Display */}
          {(error || nameError) && (
            <div className="mb-6 rounded-xl bg-red-100 p-4 text-center">
              <p className="font-semibold text-red-800">⚠️ {error || nameError}</p>
            </div>
          )}

          {/* Joining State */}
          {isJoining && !error && (
            <div className="mb-6 rounded-xl bg-blue-100 p-4 text-center">
              <p className="font-semibold text-blue-800">🔄 Joining room...</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleJoin} className="space-y-6">
            {/* Player Name */}
            <div>
              <label
                htmlFor="playerName"
                className="mb-2 block text-lg font-semibold text-orange-800"
              >
                Your Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setNameError('');
                }}
                placeholder="Enter your name..."
                className="w-full rounded-xl border-2 border-orange-300 bg-white px-6 py-4 text-lg font-medium text-orange-900 placeholder-orange-400 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-300"
                maxLength={20}
                autoFocus
              />
            </div>

            {/* Room Code */}
            <div>
              <label
                htmlFor="roomCode"
                className="mb-2 block text-lg font-semibold text-orange-800"
              >
                Room Code
              </label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) =>
                  setRoomCode(e.target.value.toUpperCase().slice(0, 6))
                }
                placeholder="ABC123"
                className="w-full rounded-xl border-2 border-orange-300 bg-white px-6 py-4 text-center text-2xl font-bold uppercase tracking-widest text-orange-900 placeholder-orange-400 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-300"
                maxLength={6}
              />
              <p className="mt-2 text-sm text-orange-600">
                Enter the 6-character code from your friend
              </p>
            </div>

            {/* Join Button */}
            <button
              type="submit"
              disabled={!isConnected || !playerName.trim() || roomCode.length !== 6 || isJoining}
              className="w-full cursor-pointer rounded-2xl border-3 border-blue-500/70 bg-linear-to-br from-blue-100 to-cyan-100 px-8 py-5 text-2xl font-bold text-blue-900 shadow-lg transition-all duration-300 hover:scale-105 hover:border-blue-600 hover:from-blue-200 hover:to-cyan-200 hover:shadow-2xl hover:shadow-blue-400/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isJoining ? 'Joining...' : 'Join Room 🚀'}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 rounded-xl bg-orange-100/60 p-4 text-center">
            <p className="text-sm font-medium text-orange-700">
              💡 Ask your friend for their room code to join
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-center">
          <p className="rounded-full bg-orange-100/80 px-6 py-2 text-sm font-medium text-orange-800 shadow-md backdrop-blur-sm">
            Join any game in progress!
          </p>
        </div>
      </div>
    </div>
  );
}
