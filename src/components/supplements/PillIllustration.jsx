import React from 'react';

export function getPillIndex(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 3;
}

// Pill 1: Yellow left half + white right half with powder dots (matching reference image)
function CapsuleYellow({ desaturated }) {
  const filter = desaturated ? 'grayscale(1) opacity(0.45)' : '';
  return (
    <svg width="180" height="76" viewBox="0 0 180 76" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter }}>
      <defs>
        <linearGradient id="yl2-l" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFE566" />
          <stop offset="45%" stopColor="#F5C200" />
          <stop offset="100%" stopColor="#C89400" />
        </linearGradient>
        <linearGradient id="yl2-r" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0E0E0" />
        </linearGradient>
        <radialGradient id="yl2-lshine" cx="40%" cy="28%" r="55%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.82)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="yl2-rshine" cx="60%" cy="28%" r="55%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.70)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <clipPath id="yl2-clip-l">
          <path d="M90 6 H44 Q6 6 6 38 Q6 70 44 70 H90 Z" />
        </clipPath>
        <clipPath id="yl2-clip-r">
          <path d="M90 6 H136 Q174 6 174 38 Q174 70 136 70 H90 Z" />
        </clipPath>
      </defs>
      {/* Drop shadow */}
      <ellipse cx="90" cy="71" rx="70" ry="5" fill="rgba(0,0,0,0.10)" />
      {/* Yellow left half */}
      <path d="M90 6 H44 Q6 6 6 38 Q6 70 44 70 H90 Z" fill="url(#yl2-l)" />
      {/* White right half */}
      <path d="M90 6 H136 Q174 6 174 38 Q174 70 136 70 H90 Z" fill="url(#yl2-r)" />
      {/* Powder dots inside white half */}
      <g clipPath="url(#yl2-clip-r)">
        <circle cx="113" cy="30" r="6.5" fill="rgba(190,150,0,0.28)" />
        <circle cx="128" cy="42" r="5" fill="rgba(190,150,0,0.22)" />
        <circle cx="107" cy="48" r="4.5" fill="rgba(190,150,0,0.20)" />
        <circle cx="140" cy="30" r="3.5" fill="rgba(190,150,0,0.18)" />
        <circle cx="120" cy="55" r="3" fill="rgba(190,150,0,0.15)" />
      </g>
      {/* Yellow shine */}
      <g clipPath="url(#yl2-clip-l)">
        <ellipse cx="55" cy="22" rx="30" ry="12" fill="url(#yl2-lshine)" />
      </g>
      {/* White shine */}
      <g clipPath="url(#yl2-clip-r)">
        <ellipse cx="120" cy="22" rx="28" ry="11" fill="url(#yl2-rshine)" />
      </g>
      {/* Seam */}
      <line x1="90" y1="6" x2="90" y2="70" stroke="rgba(160,120,0,0.22)" strokeWidth="1.5" />
      {/* Outline */}
      <rect x="6" y="6" width="168" height="64" rx="32" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
    </svg>
  );
}

// Pill 2: Coral left + white right (same capsule shape as reference)
function CapsuleCoral({ desaturated }) {
  const filter = desaturated ? 'grayscale(1) opacity(0.45)' : '';
  return (
    <svg width="180" height="76" viewBox="0 0 180 76" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter }}>
      <defs>
        <linearGradient id="co2-l" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF8A75" />
          <stop offset="45%" stopColor="#FF5A3C" />
          <stop offset="100%" stopColor="#C93020" />
        </linearGradient>
        <linearGradient id="co2-r" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0E0E0" />
        </linearGradient>
        <radialGradient id="co2-lshine" cx="40%" cy="28%" r="55%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <clipPath id="co2-clip-l">
          <path d="M90 6 H44 Q6 6 6 38 Q6 70 44 70 H90 Z" />
        </clipPath>
        <clipPath id="co2-clip-r">
          <path d="M90 6 H136 Q174 6 174 38 Q174 70 136 70 H90 Z" />
        </clipPath>
      </defs>
      <ellipse cx="90" cy="71" rx="70" ry="5" fill="rgba(0,0,0,0.10)" />
      <path d="M90 6 H44 Q6 6 6 38 Q6 70 44 70 H90 Z" fill="url(#co2-l)" />
      <path d="M90 6 H136 Q174 6 174 38 Q174 70 136 70 H90 Z" fill="url(#co2-r)" />
      <g clipPath="url(#co2-clip-r)">
        <circle cx="113" cy="30" r="6.5" fill="rgba(180,50,30,0.25)" />
        <circle cx="128" cy="42" r="5" fill="rgba(180,50,30,0.20)" />
        <circle cx="107" cy="48" r="4.5" fill="rgba(180,50,30,0.18)" />
        <circle cx="140" cy="30" r="3.5" fill="rgba(180,50,30,0.15)" />
        <circle cx="120" cy="55" r="3" fill="rgba(180,50,30,0.12)" />
      </g>
      <g clipPath="url(#co2-clip-l)">
        <ellipse cx="55" cy="22" rx="30" ry="12" fill="url(#co2-lshine)" />
      </g>
      <line x1="90" y1="6" x2="90" y2="70" stroke="rgba(140,30,20,0.20)" strokeWidth="1.5" />
      <rect x="6" y="6" width="168" height="64" rx="32" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
    </svg>
  );
}

// Pill 3: Purple left + white right
function CapsulePurple({ desaturated }) {
  const filter = desaturated ? 'grayscale(1) opacity(0.45)' : '';
  return (
    <svg width="180" height="76" viewBox="0 0 180 76" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter }}>
      <defs>
        <linearGradient id="pu2-l" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C4A8F5" />
          <stop offset="45%" stopColor="#9B72E8" />
          <stop offset="100%" stopColor="#6B42B8" />
        </linearGradient>
        <linearGradient id="pu2-r" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0E0E0" />
        </linearGradient>
        <radialGradient id="pu2-lshine" cx="40%" cy="28%" r="55%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <clipPath id="pu2-clip-l">
          <path d="M90 6 H44 Q6 6 6 38 Q6 70 44 70 H90 Z" />
        </clipPath>
        <clipPath id="pu2-clip-r">
          <path d="M90 6 H136 Q174 6 174 38 Q174 70 136 70 H90 Z" />
        </clipPath>
      </defs>
      <ellipse cx="90" cy="71" rx="70" ry="5" fill="rgba(0,0,0,0.10)" />
      <path d="M90 6 H44 Q6 6 6 38 Q6 70 44 70 H90 Z" fill="url(#pu2-l)" />
      <path d="M90 6 H136 Q174 6 174 38 Q174 70 136 70 H90 Z" fill="url(#pu2-r)" />
      <g clipPath="url(#pu2-clip-r)">
        <circle cx="113" cy="30" r="6.5" fill="rgba(100,50,180,0.22)" />
        <circle cx="128" cy="42" r="5" fill="rgba(100,50,180,0.18)" />
        <circle cx="107" cy="48" r="4.5" fill="rgba(100,50,180,0.16)" />
        <circle cx="140" cy="30" r="3.5" fill="rgba(100,50,180,0.14)" />
        <circle cx="120" cy="55" r="3" fill="rgba(100,50,180,0.12)" />
      </g>
      <g clipPath="url(#pu2-clip-l)">
        <ellipse cx="55" cy="22" rx="30" ry="12" fill="url(#pu2-lshine)" />
      </g>
      <line x1="90" y1="6" x2="90" y2="70" stroke="rgba(80,30,140,0.20)" strokeWidth="1.5" />
      <rect x="6" y="6" width="168" height="64" rx="32" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
    </svg>
  );
}

export default function PillIllustration({ name, index, desaturated = false, scale = 1 }) {
  const idx = index !== undefined ? index : getPillIndex(name);
  const style = { transform: `scale(${scale})`, transformOrigin: 'center' };
  if (idx === 0) return <div style={style}><CapsuleYellow desaturated={desaturated} /></div>;
  if (idx === 1) return <div style={style}><CapsulePurple desaturated={desaturated} /></div>;
  return <div style={style}><CapsuleCoral desaturated={desaturated} /></div>;
}