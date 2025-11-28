'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DifficultySelection() {
  const router = useRouter();
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
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        {/* Back Button */}
        <Link
          href="/"
          className="absolute left-8 top-8 cursor-pointer rounded-full border-2 border-orange-500/60 bg-orange-100/90 px-6 py-2 font-semibold text-orange-800 backdrop-blur-sm transition-all hover:border-orange-600 hover:bg-orange-200 hover:shadow-lg"
        >
          ← Back
        </Link>

        {/* Center Container */}
        <div className="max-w-5xl rounded-3xl border-4 border-orange-400/60 bg-linear-to-br from-orange-50/95 via-amber-50/95 to-orange-100/95 p-8 shadow-2xl backdrop-blur-sm sm:p-12 md:p-16">
          {/* Title */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 bg-linear-to-r from-orange-600 via-orange-500 to-amber-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent drop-shadow-lg sm:text-6xl md:text-7xl">
              Select Difficulty
            </h1>
            <p className="text-lg font-semibold tracking-wide text-orange-700">
              Choose your challenge level
            </p>
          </div>

          {/* Difficulty Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
            {/* Easy - 4x4 */}
            <Link href="/game/single/play?difficulty=easy">
              <button className="group relative cursor-pointer overflow-hidden rounded-2xl border-3 border-green-500/70 bg-linear-to-br from-green-100 to-emerald-100 px-8 py-10 shadow-lg transition-all duration-300 hover:scale-105 hover:border-green-600 hover:from-green-200 hover:to-emerald-200 hover:shadow-2xl hover:shadow-green-400/50">
                <div className="relative z-10">
                  <div className="mb-4 text-6xl">🌱</div>
                  <h2 className="mb-3 text-3xl font-bold text-green-900">
                    Easy
                  </h2>
                  <p className="mb-2 text-sm font-semibold text-green-700">
                    4×4 Grid
                  </p>
                  <p className="text-xs font-medium text-green-600">
                    Perfect for beginners
                  </p>
                  <div className="mt-4 text-2xl font-bold text-green-800">
                    5 pts
                  </div>
                </div>
                <div className="absolute inset-0 bg-linear-to-br from-green-200/0 to-emerald-200/0 transition-all duration-300 group-hover:from-green-200/50 group-hover:to-emerald-200/50" />
              </button>
            </Link>

            {/* Medium - 6x6 */}
            <Link href="/game/single/play?difficulty=medium">
              <button className="group relative cursor-pointer overflow-hidden rounded-2xl border-3 border-orange-500/70 bg-linear-to-br from-orange-100 to-amber-100 px-8 py-10 shadow-lg transition-all duration-300 hover:scale-105 hover:border-orange-600 hover:from-orange-200 hover:to-amber-200 hover:shadow-2xl hover:shadow-orange-400/50">
                <div className="relative z-10">
                  <div className="mb-4 text-6xl">🔥</div>
                  <h2 className="mb-3 text-3xl font-bold text-orange-900">
                    Medium
                  </h2>
                  <p className="mb-2 text-sm font-semibold text-orange-700">
                    6×6 Grid
                  </p>
                  <p className="text-xs font-medium text-orange-600">
                    Moderate challenge
                  </p>
                  <div className="mt-4 text-2xl font-bold text-orange-800">
                    10 pts
                  </div>
                </div>
                <div className="absolute inset-0 bg-linear-to-br from-orange-200/0 to-amber-200/0 transition-all duration-300 group-hover:from-orange-200/50 group-hover:to-amber-200/50" />
              </button>
            </Link>

            {/* Hard - 9x9 */}
            <Link href="/game/single/play?difficulty=hard">
              <button className="group relative cursor-pointer overflow-hidden rounded-2xl border-3 border-red-500/70 bg-linear-to-br from-red-100 to-rose-100 px-8 py-10 shadow-lg transition-all duration-300 hover:scale-105 hover:border-red-600 hover:from-red-200 hover:to-rose-200 hover:shadow-2xl hover:shadow-red-400/50">
                <div className="relative z-10">
                  <div className="mb-4 text-6xl">💀</div>
                  <h2 className="mb-3 text-3xl font-bold text-red-900">
                    Hard
                  </h2>
                  <p className="mb-2 text-sm font-semibold text-red-700">
                    9×9 Grid
                  </p>
                  <p className="text-xs font-medium text-red-600">
                    For experienced players
                  </p>
                  <div className="mt-4 text-2xl font-bold text-red-800">
                    20 pts
                  </div>
                </div>
                <div className="absolute inset-0 bg-linear-to-br from-red-200/0 to-rose-200/0 transition-all duration-300 group-hover:from-red-200/50 group-hover:to-rose-200/50" />
              </button>
            </Link>
          </div>

          {/* Info Text */}
          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-orange-600">
              💡 Choose your difficulty to start playing
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-center">
          <p className="rounded-full bg-orange-100/80 px-6 py-2 text-sm font-medium text-orange-800 shadow-md backdrop-blur-sm">
            Each difficulty has different grid sizes and point values
          </p>
        </div>
      </div>
    </div>
  );
}
