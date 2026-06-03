import React from 'react';

export default function MiniScoreRing({ score, color = '#6366F1', size = 40 }) {
  const STROKE = 4;
  const R = (size - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const dash = score != null ? (Math.min(score, 100) / 100) * CIRC : 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={R}
          fill="none" stroke="#F2F4F8" strokeWidth={STROKE} />
        {score != null && score > 0 && (
          <circle cx={size / 2} cy={size / 2} r={R}
            fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC}`}
            style={{ transition: 'stroke-dasharray 0.7s ease' }} />
        )}
      </svg>
    </div>
  );
}