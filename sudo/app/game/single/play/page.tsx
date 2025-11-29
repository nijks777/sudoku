'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function NameInputContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const difficulty = searchParams.get('difficulty');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (name.trim().length > 20) {
      setError('Name must be less than 20 characters');
      return;
    }

    // Store name in localStorage
    localStorage.setItem('playerName', name.trim());

    // Navigate to game
    router.push(`/game/single/game?difficulty=${difficulty}&name=${encodeURIComponent(name.trim())}`);
  };

  // Get difficulty display info
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
        <Link
          href="/game/single"
          className="absolute left-8 top-8 cursor-pointer rounded-full border-2 border-orange-500/60 bg-orange-100/90 px-6 py-2 font-semibold text-orange-800 backdrop-blur-sm transition-all hover:border-orange-600 hover:bg-orange-200 hover:shadow-lg"
        >
          ← Back
        </Link>

        {/* Center Container */}
        <div className="max-w-2xl rounded-3xl border-4 border-orange-400/60 bg-linear-to-br from-orange-50/95 via-amber-50/95 to-orange-100/95 p-8 shadow-2xl backdrop-blur-sm sm:p-12 md:p-16">
          {/* Title */}
          <div className="mb-8 text-center">
            <div className="mb-4 text-7xl">{diffInfo.emoji}</div>
            <h1 className="mb-2 bg-linear-to-r from-orange-600 via-orange-500 to-amber-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent drop-shadow-lg sm:text-5xl">
              {diffInfo.label} Mode
            </h1>
            <p className="text-lg font-semibold text-orange-700">
              {diffInfo.size} Sudoku Grid
            </p>
          </div>

          {/* Name Input Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="playerName"
                className="mb-2 block text-lg font-semibold text-orange-800"
              >
                Enter Your Name
              </label>
              <input
                type="text"
                id="playerName"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Your name here..."
                className="w-full rounded-xl border-2 border-orange-300 bg-white px-6 py-4 text-lg font-medium text-orange-900 placeholder-orange-400 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-300"
                maxLength={20}
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
              )}
              <p className="mt-2 text-sm text-orange-600">
                This will be displayed on the leaderboard
              </p>
            </div>

            {/* Start Button */}
            <button
              type="submit"
              className="w-full cursor-pointer rounded-2xl border-3 border-orange-500/70 bg-linear-to-br from-orange-100 to-amber-100 px-8 py-5 text-2xl font-bold text-orange-900 shadow-lg transition-all duration-300 hover:scale-105 hover:border-orange-600 hover:from-orange-200 hover:to-amber-200 hover:shadow-2xl hover:shadow-orange-400/50"
            >
              Start Game 🎮
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 rounded-xl bg-orange-100/60 p-4 text-center">
            <p className="text-sm font-medium text-orange-700">
              💡 Your progress will be saved to the leaderboard
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-center">
          <p className="rounded-full bg-orange-100/80 px-6 py-2 text-sm font-medium text-orange-800 shadow-md backdrop-blur-sm">
            Good luck! 🍀
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NameInputPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NameInputContent />
    </Suspense>
  );
}
