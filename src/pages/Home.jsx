import React from "react";

/**
 * ScoreScreen — "Scanly" app score view
 * Converted from Figma design (node 883:28)
 *
 * Notes:
 * - The mountain photo background is approximated with a CSS gradient since
 *   the original Figma image asset URLs expire after 7 days. Swap the
 *   `backgroundImage` below for your own exported photo if you want pixel-exact art.
 * - Tailwind utility classes only — no extra dependencies required.
 * - Drop this into Base44 / any React+Tailwind project as a single component.
 */

export default function ScoreScreen({ score = 80 }) {
  // Gauge math: semicircle arc, 0–100 mapped to 0–180 degrees
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const radius = 160;
  const circumference = Math.PI * radius; // half circumference (semicircle)
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="relative w-full max-w-[489px] mx-auto h-[972px] overflow-hidden rounded-[28px] shadow-2xl">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #6b5b8a 0%, #c97b5a 25%, #f0a868 45%, #e8915f 60%, #2b2a3d 100%)",
        }}
      >
        {/* Mountain silhouette */}
        <svg
          className="absolute bottom-0 left-0 w-full h-[55%]"
          viewBox="0 0 489 500"
          preserveAspectRatio="none"
        >
          <polygon
            points="0,500 80,260 160,340 245,120 330,300 410,230 489,500"
            fill="#e8e4e0"
            opacity="0.9"
          />
          <polygon
            points="0,500 80,300 160,380 245,200 330,340 410,280 489,500"
            fill="#2b2a3d"
            opacity="0.55"
          />
        </svg>
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-7 pt-4">
        <h1 className="text-white text-[44px] leading-none font-light tracking-tight">
          Scanly
        </h1>
        <div className="flex items-center gap-1 bg-black/70 rounded-full pl-3 pr-4 py-2">
          <span className="text-xl">🔥</span>
          <span className="text-white text-lg font-medium">1</span>
        </div>
      </div>

      {/* "Score" heading */}
      <p className="absolute top-[88px] left-1/2 -translate-x-1/2 font-serif text-black text-[80px] leading-none whitespace-nowrap">
        Score
      </p>

      {/* Gauge */}
      <div className="absolute top-[190px] left-1/2 -translate-x-1/2 w-[416px] h-[210px]">
        <svg viewBox="0 0 416 220" className="w-full h-full">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cdb98a" />
              <stop offset="50%" stopColor="#8fb6c9" />
              <stop offset="100%" stopColor="#a08a6f" />
            </linearGradient>
          </defs>
          {/* Track */}
          <path
            d="M 48 208 A 160 160 0 0 1 368 208"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Progress */}
          <path
            d="M 48 208 A 160 160 0 0 1 368 208"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <p className="absolute inset-0 flex items-center justify-center font-serif text-white text-[110px] leading-none">
          {score}
        </p>
      </div>

      {/* Pagination dots */}
      <div className="absolute top-[478px] left-1/2 -translate-x-1/2 flex items-center gap-2">
        <span className="w-4 h-2.5 rounded-full bg-white" />
        <span className="w-2.5 h-2.5 rounded-full bg-white" />
        <span className="w-2.5 h-2.5 rounded-full bg-white" />
        <span className="w-2.5 h-2.5 rounded-full bg-white" />
      </div>

      {/* Summary text */}
      <p className="absolute top-[545px] left-1/2 -translate-x-1/2 w-[430px] text-center font-serif text-white text-2xl leading-snug">
        Last night's sleep was extraordinarily good. You logged over 9h of
        sleep — this means you've officially paid off your sleep debt. The
        only issue I see is your eating habits: you ate only 2 times
        yesterday and consumed just 800kcal. If you keep that up, you won't
        hit your goal of gaining muscle.
      </p>

      {/* Bottom nav bar */}
      <div className="absolute bottom-[35px] left-1/2 -translate-x-1/2 w-[420px] flex items-center justify-between">
        {/* Home pill */}
        <div className="relative flex-1 h-[67px] bg-black/55 backdrop-blur rounded-[45px] flex items-center pl-1">
          <button
            type="button"
            className="w-[66px] h-[66px] rounded-full bg-gradient-to-r from-[rgba(208,219,255,0.4)] to-[rgba(208,219,255,0.4)] flex items-center justify-center"
            aria-label="Home"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 11.5 12 4l9 7.5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Add button */}
        <button
          type="button"
          className="ml-4 w-[74px] h-[74px] rounded-full bg-black/85 flex items-center justify-center"
          aria-label="Add"
        >
          <span className="text-white text-4xl leading-none font-light">+</span>
        </button>
      </div>
    </div>
  );
}