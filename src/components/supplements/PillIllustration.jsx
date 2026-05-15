import React from 'react';

// Pill design index based on supplement id/name hash
export function getPillIndex(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 3;
}

// Pill 1: Two-tone capsule — white left, yellow-gold right (Zinc style)
function CapsuleYellow({ desaturated }) {
  const filter = desaturated ? 'grayscale(1) opacity(0.5)' : '';
  return (
    <svg width="160" height="70" viewBox="0 0 160 70" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter }}>
      <defs>
        <linearGradient id="yl-body-l" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e8e8e8" />
        </linearGradient>
        <linearGradient id="yl-body-r" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F9C94E" />
          <stop offset="100%" stopColor="#D4960A" />
        </linearGradient>
        <linearGradient id="yl-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id="yl-shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="rgba(0,0,0,0.18)" />
        </filter>
        <clipPath id="yl-clip">
          <rect x="5" y="5" width="150" height="60" rx="30" />
        </clipPath>
      </defs>
      {/* Shadow */}
      <ellipse cx="80" cy="64" rx="62" ry="6" fill="rgba(0,0,0,0.10)" />
      {/* Left half */}
      <path d="M80 5 H35 Q5 5 5 35 Q5 65 35 65 H80 Z" fill="url(#yl-body-l)" />
      {/* Right half */}
      <path d="M80 5 H125 Q155 5 155 35 Q155 65 125 65 H80 Z" fill="url(#yl-body-r)" />
      {/* Center seam */}
      <line x1="80" y1="5" x2="80" y2="65" stroke="rgba(180,140,0,0.25)" strokeWidth="1.5" />
      {/* Outline */}
      <rect x="5" y="5" width="150" height="60" rx="30" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
      {/* Shine highlight */}
      <path d="M35 10 Q80 8 125 10 Q130 14 125 24 Q80 20 35 24 Q30 14 35 10Z" fill="url(#yl-shine)" />
    </svg>
  );
}

// Pill 2: Oval tablet — soft purple with embossed line (Vitamin D style)
function TabletPurple({ desaturated }) {
  const filter = desaturated ? 'grayscale(1) opacity(0.5)' : '';
  return (
    <svg width="130" height="90" viewBox="0 0 130 90" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter }}>
      <defs>
        <radialGradient id="pu-body" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#B49FE8" />
          <stop offset="100%" stopColor="#7B5EA7" />
        </radialGradient>
        <linearGradient id="pu-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="65" cy="83" rx="46" ry="7" fill="rgba(0,0,0,0.12)" />
      {/* Body */}
      <ellipse cx="65" cy="44" rx="55" ry="38" fill="url(#pu-body)" />
      {/* Embossed line */}
      <line x1="18" y1="44" x2="112" y2="44" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="18" y1="46.5" x2="112" y2="46.5" stroke="rgba(80,50,120,0.25)" strokeWidth="1" strokeLinecap="round" />
      {/* Outline */}
      <ellipse cx="65" cy="44" rx="55" ry="38" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
      {/* Shine */}
      <ellipse cx="52" cy="28" rx="32" ry="13" fill="url(#pu-shine)" />
    </svg>
  );
}

// Pill 3: Two-tone capsule — white left with powder speckles, coral-red right (Ashwagandha style)
function CapsuleCoral({ desaturated }) {
  const filter = desaturated ? 'grayscale(1) opacity(0.5)' : '';
  return (
    <svg width="160" height="70" viewBox="0 0 160 70" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter }}>
      <defs>
        <linearGradient id="co-body-l" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#efe8e8" />
        </linearGradient>
        <linearGradient id="co-body-r" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF6B5B" />
          <stop offset="100%" stopColor="#CC3322" />
        </linearGradient>
        <linearGradient id="co-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <clipPath id="co-clip-l">
          <path d="M80 5 H35 Q5 5 5 35 Q5 65 35 65 H80 Z" />
        </clipPath>
      </defs>
      {/* Shadow */}
      <ellipse cx="80" cy="64" rx="62" ry="6" fill="rgba(0,0,0,0.10)" />
      {/* Left half */}
      <path d="M80 5 H35 Q5 5 5 35 Q5 65 35 65 H80 Z" fill="url(#co-body-l)" />
      {/* Powder speckles inside left half */}
      <g clipPath="url(#co-clip-l)">
        <circle cx="35" cy="25" r="4" fill="rgba(180,60,40,0.22)" />
        <circle cx="55" cy="38" r="5.5" fill="rgba(180,60,40,0.18)" />
        <circle cx="42" cy="50" r="3.5" fill="rgba(180,60,40,0.20)" />
        <circle cx="68" cy="28" r="3" fill="rgba(180,60,40,0.15)" />
        <circle cx="25" cy="42" r="3" fill="rgba(180,60,40,0.18)" />
        <circle cx="62" cy="52" r="4" fill="rgba(180,60,40,0.14)" />
      </g>
      {/* Right half */}
      <path d="M80 5 H125 Q155 5 155 35 Q155 65 125 65 H80 Z" fill="url(#co-body-r)" />
      {/* Center seam */}
      <line x1="80" y1="5" x2="80" y2="65" stroke="rgba(180,40,30,0.20)" strokeWidth="1.5" />
      {/* Outline */}
      <rect x="5" y="5" width="150" height="60" rx="30" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
      {/* Shine */}
      <path d="M35 10 Q80 8 125 10 Q130 14 125 24 Q80 20 35 24 Q30 14 35 10Z" fill="url(#co-shine)" />
    </svg>
  );
}

export default function PillIllustration({ name, index, desaturated = false, scale = 1 }) {
  const idx = index !== undefined ? index : getPillIndex(name);
  const style = { transform: `scale(${scale})`, transformOrigin: 'center' };
  if (idx === 0) return <div style={style}><CapsuleYellow desaturated={desaturated} /></div>;
  if (idx === 1) return <div style={style}><TabletPurple desaturated={desaturated} /></div>;
  return <div style={style}><CapsuleCoral desaturated={desaturated} /></div>;
}