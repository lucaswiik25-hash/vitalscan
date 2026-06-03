import React from 'react';
import { formatTime12, calcDurationMinutes, formatDuration } from '@/lib/sleepCalculations';

const SIZE = 220;
const STROKE = 18;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const GAP_ANGLE = 60;
const ARC_ANGLE = 360 - GAP_ANGLE;
const MAX_DASH = (ARC_ANGLE / 360) * CIRC;
const ROTATION = 90 + GAP_ANGLE / 2;

function scoreColor(score) {
  if (score >= 75) return '#10B981';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}

function TimeButton({ label, value, onChange }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9BA3AF]">{label}</p>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-[17px] font-bold text-[#111827] bg-transparent border-none outline-none text-center"
        style={{ width: 90 }}
      />
      <p className="text-[12px] text-[#6B7280]">{formatTime12(value)}</p>
    </div>
  );
}

export default function SleepHeroRing({ sleepTime, wakeTime, onSleepChange, onWakeChange, sleepScore }) {
  const durationMin = calcDurationMinutes(sleepTime, wakeTime);
  const color = scoreColor(sleepScore);
  const dash = (Math.min(sleepScore, 100) / 100) * MAX_DASH;

  return (
    <div className="flex flex-col items-center">
      {/* Ring */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <defs>
            <linearGradient id="sleepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke="#F2F4F8" strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={`${MAX_DASH} ${CIRC}`}
            style={{ transform: `rotate(${ROTATION}deg)`, transformOrigin: '50% 50%' }}
          />
          {/* Progress */}
          {sleepScore > 0 && (
            <circle
              cx={SIZE / 2} cy={SIZE / 2} r={R}
              fill="none" stroke="url(#sleepGrad)" strokeWidth={STROKE} strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRC}`}
              style={{ transform: `rotate(${ROTATION}deg)`, transformOrigin: '50% 50%', transition: 'stroke-dasharray 0.9s ease' }}
            />
          )}
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9BA3AF]">Sleep Score</span>
          <span className="font-extrabold leading-none mt-1" style={{ fontSize: 52, color: sleepScore > 0 ? color : '#D1D5DB' }}>
            {sleepScore > 0 ? sleepScore : '—'}
          </span>
          <span className="text-[13px] font-semibold text-[#6B7280] mt-1">{formatDuration(durationMin)}</span>
        </div>
      </div>

      {/* Time inputs */}
      <div className="flex justify-between w-full px-4 mt-2">
        <TimeButton label="Bedtime" value={sleepTime} onChange={onSleepChange} />
        <TimeButton label="Wake up" value={wakeTime} onChange={onWakeChange} />
      </div>
    </div>
  );
}