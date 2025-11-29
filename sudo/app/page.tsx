'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-orange-50">
      {/* Video Background - Fully Visible */}
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

      {/* Content - Center Card */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pb-20">
        {/* Center Container with Cream/Orange Theme */}
        <div className="max-w-4xl rounded-3xl border-4 border-orange-400/60 bg-linear-to-br from-orange-50/95 via-amber-50/95 to-orange-100/95 p-8 shadow-2xl backdrop-blur-sm sm:p-12 md:p-16">
          {/* Title */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 bg-linear-to-r from-orange-600 via-orange-500 to-amber-600 bg-clip-text text-6xl font-bold tracking-tight text-transparent drop-shadow-lg sm:text-7xl md:text-8xl">
              SUDOKU
            </h1>
            <p className="text-lg font-semibold tracking-wide text-orange-700 sm:text-xl">
              Challenge Your Mind
            </p>
          </div>

          {/* Mode Selection Cards */}
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
            {/* Single Player Button */}
            <Link href="/game/single">
              <button className="group relative cursor-pointer overflow-hidden rounded-2xl border-3 border-orange-500/70 bg-linear-to-br from-orange-100 to-amber-100 px-12 py-8 shadow-lg transition-all duration-300 hover:scale-105 hover:border-orange-600 hover:from-orange-200 hover:to-amber-200 hover:shadow-2xl hover:shadow-orange-400/50">
                <div className="relative z-10">
                  <div className="mb-3 text-5xl">🎮</div>
                  <h2 className="mb-2 text-2xl font-bold text-orange-900">
                    Single Player
                  </h2>
                  <p className="text-sm font-medium text-orange-700">
                    Play solo at your pace
                  </p>
                </div>
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-linear-to-br from-orange-200/0 to-amber-200/0 transition-all duration-300 group-hover:from-orange-200/50 group-hover:to-amber-200/50" />
              </button>
            </Link>

            {/* Multiplayer Button */}
            <Link href="/game/multiplayer">
              <button className="group relative cursor-pointer overflow-hidden rounded-2xl border-3 border-orange-500/70 bg-linear-to-br from-orange-100 to-amber-100 px-12 py-8 shadow-lg transition-all duration-300 hover:scale-105 hover:border-orange-600 hover:from-orange-200 hover:to-amber-200 hover:shadow-2xl hover:shadow-orange-400/50">
                <div className="relative z-10">
                  <div className="mb-3 text-5xl">⚔️</div>
                  <h2 className="mb-2 text-2xl font-bold text-orange-900">
                    Multiplayer
                  </h2>
                  <p className="text-sm font-medium text-orange-700">
                    Compete with friends
                  </p>
                </div>
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-linear-to-br from-orange-200/0 to-amber-200/0 transition-all duration-300 group-hover:from-orange-200/50 group-hover:to-amber-200/50" />
              </button>
            </Link>
          </div>

          {/* Join Room Link */}
          <div className="mt-8 text-center">
            <Link href="/game/multiplayer/join">
              <button className="cursor-pointer rounded-full border-2 border-blue-500/60 bg-linear-to-r from-blue-100 to-cyan-100 px-8 py-3 font-semibold text-blue-800 shadow-md transition-all hover:border-blue-600 hover:from-blue-200 hover:to-cyan-200 hover:shadow-lg">
                🔗 Join Room with Code
              </button>
            </Link>
          </div>

          {/* Leaderboard Link */}
          <div className="mt-4 text-center">
            <Link href="/leaderboard">
              <button className="cursor-pointer rounded-full border-2 border-orange-500/60 bg-linear-to-r from-orange-100 to-amber-100 px-8 py-3 font-semibold text-orange-800 shadow-md transition-all hover:border-orange-600 hover:from-orange-200 hover:to-amber-200 hover:shadow-lg">
                🏆 View Leaderboard
              </button>
            </Link>
          </div>
        </div>

        {/* Footer - Outside the card */}
        <div className="absolute bottom-8 text-center">
          <p className="rounded-full bg-orange-100/80 px-6 py-2 text-sm font-medium text-orange-800 shadow-md backdrop-blur-sm">
            Test your logic skills with classic Sudoku puzzles
          </p>
        </div>
      </div>
    </div>
  );
}
