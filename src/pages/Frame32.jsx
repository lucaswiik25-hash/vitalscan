import React from "react";
import { motion } from "framer-motion";

export default function Frame32() {
  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-black">
      {/* Full-screen phone frame — no black rim, image fills everything */}
      <div
        className="relative w-full max-w-[390px] mx-auto overflow-hidden"
        style={{ height: "100svh", maxHeight: 844 }}
      >
        {/* Full-bleed background image */}
        <motion.img
          src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/a5b576513_d9be0168f_67ec5c8e6977d0cbaef966754bccad720c2b178a.png"
          alt="Mountain Landscape"
          className="absolute inset-0 w-full h-full object-cover object-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />

        {/* Subtle dark vignette at top & bottom for legibility */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.35) 100%)",
          }}
        />

        {/* ── Header ── */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-12 z-10">
          {/* Scanly wordmark — SF Pro, large */}
          <motion.p
            className="text-white text-3xl tracking-tight"
            style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 500 }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          >
            Scanly
          </motion.p>

          {/* Fire streak badge */}
          <motion.div
            className="flex items-center gap-1 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
          >
            <span className="text-base">🔥</span>
            <span
              className="text-white text-sm font-semibold"
              style={{ fontFamily: "'SF Pro Text', -apple-system, sans-serif" }}
            >
              1
            </span>
          </motion.div>
        </div>

        {/* ── Overview label ── */}
        <motion.p
          className="absolute left-0 right-0 text-center z-10"
          style={{
            top: "26%",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontWeight: 400,
            fontSize: "clamp(52px, 14vw, 76px)",
            color: "#000",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        >
          Overview
        </motion.p>

        {/* ── Half-circle arc + 80 metric ── */}
        <div
          className="absolute left-0 right-0 flex flex-col items-center z-10"
          style={{ top: "36%" }}
        >
          {/* SVG progress arc — arch opening downward */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.65, duration: 0.9, ease: "easeOut" }}
          >
            <svg width="300" height="160" viewBox="0 0 300 160" fill="none">
              {/* Track (dim white) — top semicircle */}
              <path
                d="M 20 150 A 130 130 0 0 1 280 150"
                stroke="rgba(255,255,255,0.30)"
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
              />
              {/* Progress stroke — 80% of the arc */}
              <path
                d="M 20 150 A 130 130 0 0 1 280 150"
                stroke="white"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="408"
                strokeDashoffset="82"
                fill="none"
              />
            </svg>
          </motion.div>

          {/* 80 sits below the arc */}
          <motion.p
            style={{
              marginTop: -20,
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontWeight: 400,
              fontSize: "clamp(72px, 20vw, 110px)",
              color: "#fff",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              textShadow: "0 2px 24px rgba(0,0,0,0.35)",
            }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.9, ease: "easeOut" }}
          >
            80
          </motion.p>
        </div>

        {/* ── Pagination dots ── */}
        <motion.div
          className="absolute left-0 right-0 flex items-center justify-center gap-1.5 z-10"
          style={{ bottom: "18%" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          {[true, false, false, false].map((active, i) => (
            <div
              key={i}
              className="rounded-full bg-white"
              style={{
                width: active ? 22 : 8,
                height: 8,
                opacity: active ? 1 : 0.5,
                transition: "all 0.3s",
              }}
            />
          ))}
        </motion.div>

        {/* ── Bottom navigation bar ── */}
        <motion.div
          className="absolute left-0 right-0 flex items-center justify-between px-6 z-10"
          style={{ bottom: "5%" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7, ease: "easeOut" }}
        >
          {/* Nav pill */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-full"
            style={{
              background: "rgba(120,120,128,0.55)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.18)",
              flex: 1,
              marginRight: 14,
            }}
          >
            {/* Home tab — active */}
            <button
              className="flex items-center justify-center rounded-full active:scale-90 transition-transform"
              style={{
                width: 44,
                height: 44,
                background: "rgba(255,255,255,0.22)",
              }}
              aria-label="Home"
            >
              {/* SF-style house icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 9.75L12 3l9 6.75V21a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.75Z"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M9 22V12h6v10" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Add / FAB button */}
          <button
            className="flex items-center justify-center rounded-full active:scale-90 transition-transform"
            style={{
              width: 52,
              height: 52,
              background: "rgba(120,120,128,0.55)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.22)",
              flexShrink: 0,
            }}
            aria-label="Add"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </motion.div>
      </div>
    </main>
  );
}