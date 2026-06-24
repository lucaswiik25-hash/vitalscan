import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, differenceInCalendarDays } from 'date-fns';
import { listFoodLogs } from '@/lib/db';
import { useUserProfile } from '@/hooks/useUserProfile';

// Mountain background image
const BG_URL = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80&fit=crop';

// Half-circle gauge
function HalfGauge({ value, max, size = 200 }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const toX = (angle) => cx + r * Math.cos(angle);
  const toY = (angle) => cy + r * Math.sin(angle);

  const trackStart = { x: toX(Math.PI), y: toY(Math.PI) };
  const trackEnd   = { x: toX(0),       y: toY(0) };

  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const progressAngle = Math.PI - pct * Math.PI;
  const progEnd = { x: toX(progressAngle), y: toY(progressAngle) };
  const largeArc = pct > 0.5 ? 1 : 0;

  return (
    <svg width={size} height={size / 2 + stroke} viewBox={`0 0 ${size} ${size / 2 + stroke}`} style={{ overflow: 'visible' }}>
      <path
        d={`M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 0 1 ${trackEnd.x} ${trackEnd.y}`}
        fill="none"
        stroke="rgba(173,216,230,0.35)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {pct > 0 && (
        <path
          d={`M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 ${largeArc} 1 ${progEnd.x} ${progEnd.y}`}
          fill="none"
          stroke="rgba(200,225,240,0.85)"
          strokeWidth={stroke}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 8px rgba(200,225,240,0.5))' }}
        />
      )}
    </svg>
  );
}

const SLIDES = [
  { key: 'protein',  label: 'Protein',  unit: 'g',   targetKey: 'protein_target',  consumedKey: 'protein',  defaultTarget: 150 },
  { key: 'calories', label: 'Calories', unit: 'kcal', targetKey: 'calorie_target',  consumedKey: 'calories', defaultTarget: 2000 },
  { key: 'carbs',    label: 'Carbs',    unit: 'g',   targetKey: 'carbs_target',    consumedKey: 'carbs',    defaultTarget: 250 },
  { key: 'fat',      label: 'Fat',      unit: 'g',   targetKey: 'fat_target',      consumedKey: 'fat',      defaultTarget: 80 },
];

export default function Home() {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [slideIdx, setSlideIdx] = useState(0);
  const touchStartX = useRef(null);
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();

  // Streak update
  useEffect(() => {
    if (!profile?.id || profileLoading) return;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const lastActive = profile.last_active_date;
    if (lastActive === todayStr) return;
    const daysSince = lastActive ? differenceInCalendarDays(new Date(todayStr), new Date(lastActive)) : null;
    const newStreak = daysSince === 1 ? (profile.streak || 0) + 1 : 1;
    updateProfile({ streak: newStreak, last_active_date: todayStr }).catch(() => {});
  }, [profile?.id, profileLoading]);

  const { data: todayMeals = [] } = useQuery({
    queryKey: ['meals', today],
    queryFn: () => listFoodLogs({ date: today, logged: true }),
  });

  const consumed = todayMeals.reduce((acc, meal) => ({
    calories: (acc.calories || 0) + (meal.calories || 0),
    protein:  (acc.protein  || 0) + (meal.protein  || 0),
    carbs:    (acc.carbs    || 0) + (meal.carbs    || 0),
    fat:      (acc.fat      || 0) + (meal.fat      || 0),
  }), {});

  const slide = SLIDES[slideIdx];
  const target  = profile[slide.targetKey] || slide.defaultTarget;
  const current = Math.round(consumed[slide.consumedKey] || 0);
  const left    = Math.max(0, target - current);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50 && slideIdx < SLIDES.length - 1) setSlideIdx(i => i + 1);
    if (diff < -50 && slideIdx > 0) setSlideIdx(i => i - 1);
    touchStartX.current = null;
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background image */}
      <img
        src={BG_URL}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />
      {/* Dark overlay at bottom for readability */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.18) 60%, rgba(0,0,0,0.45) 100%)', zIndex: 1 }} />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6"
        style={{ paddingTop: 'max(48px, env(safe-area-inset-top))' }}>
        <span style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 17,
          fontWeight: 600,
          fontStyle: 'normal',
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: '0px',
          textShadow: '0 1px 8px rgba(0,0,0,0.3)',
        }}>Scanly</span>

        {/* Streak badge */}
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>🔥</span>
          </div>
          <div style={{
            position: 'absolute',
            top: -3,
            right: -3,
            minWidth: 14,
            height: 14,
            borderRadius: 7,
            background: 'rgba(255,255,255,0.25)',
            border: '0.5px solid rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 700,
            color: '#fff',
            padding: '0 2px',
          }}>
            {profile.streak || 0}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-start" style={{ paddingTop: 'max(110px, env(safe-area-inset-top) + 68px)' }}>

        {/* Macro label */}
        <p style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 28,
          fontWeight: 500,
          fontStyle: 'normal',
          color: 'rgba(255,255,255,0.95)',
          letterSpacing: 0,
          lineHeight: 1,
          marginBottom: 12,
          textShadow: '0 1px 12px rgba(0,0,0,0.3)',
        }}>
          {slide.label}
        </p>

        {/* Half gauge + number */}
        <div style={{ position: 'relative', width: 200, height: 104, marginBottom: 0 }}>
          <HalfGauge value={current} max={target} size={200} />
          {/* Number centered below arc */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'baseline',
            gap: 2,
            whiteSpace: 'nowrap',
          }}>
            <span style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 56,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.97)',
              letterSpacing: -1,
              lineHeight: 1,
              textShadow: '0 2px 14px rgba(0,0,0,0.3)',
            }}>{current}</span>
            <span style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 20,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.55)',
            }}>{slide.unit}</span>
          </div>
        </div>

        {/* Subtitle — target reference */}
        <p style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 13,
          fontWeight: 400,
          color: 'rgba(255,255,255,0.5)',
          marginTop: 8,
          letterSpacing: 0,
        }}>{target}{slide.unit}</p>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12, alignItems: 'center' }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlideIdx(i)}
              style={{
                width: i === slideIdx ? 14 : 5,
                height: 5,
                borderRadius: i === slideIdx ? 3 : '50%',
                background: i === slideIdx ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom nav placeholder space — actual BottomNav renders via AppShell */}
    </div>
  );
}