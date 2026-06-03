import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Home } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const TARGET_HOURS = 8;
const NAVY = '#0F1219';
const SERIF = 'var(--font-serif), "Playfair Display", Georgia, serif';
const SANS = 'var(--font-inter), Inter, system-ui, sans-serif';

const DEFAULT_BED = 23; // 11:00 PM
const DEFAULT_WAKE = 7; // 7:00 AM

function readSleepStore() {
  try {
    return JSON.parse(localStorage.getItem('scanly_sleep') || '{}');
  } catch {
    return {};
  }
}

function readSchedule() {
  try {
    const s = JSON.parse(localStorage.getItem('scanly_sleep_schedule') || '{}');
    return { bed: s.bed ?? DEFAULT_BED, wake: s.wake ?? DEFAULT_WAKE };
  } catch {
    return { bed: DEFAULT_BED, wake: DEFAULT_WAKE };
  }
}

function saveSchedule(bed, wake) {
  localStorage.setItem('scanly_sleep_schedule', JSON.stringify({ bed, wake }));
}

function computeScore(hours) {
  if (!hours) return null;
  const duration = Math.min(100, Math.round((hours / TARGET_HOURS) * 100));
  const quality = Math.min(100, Math.round(duration * 0.95 + 5));
  const habits = Math.min(100, Math.round(duration * 0.9 + 10));
  return Math.min(100, Math.round(duration * 0.4 + quality * 0.35 + habits * 0.25));
}

function formatHour12(h) {
  const hour = Math.floor(h) % 24;
  const min = Math.round((h % 1) * 60);
  const period = hour >= 12 ? 'pm' : 'am';
  let h12 = hour % 12;
  if (h12 === 0) h12 = 12;
  const mm = min > 0 ? `:${String(min).padStart(2, '0')}` : '';
  return `${h12}${mm}${period}`;
}

function sleepDurationHours(bed, wake) {
  if (wake >= bed) return wake - bed;
  return 24 - bed + wake;
}

/** 0 at top (12AM), clockwise */
function hourToRad(h) {
  return ((h % 24) / 24) * Math.PI * 2 - Math.PI / 2;
}

function polar(cx, cy, r, rad) {
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startHour, endHour) {
  const start = hourToRad(startHour);
  let end = hourToRad(endHour);
  if (end <= start) end += Math.PI * 2;
  const large = end - start > Math.PI ? 1 : 0;
  const p1 = polar(cx, cy, r, start);
  const p2 = polar(cx, cy, r, end);
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
}

const CLOCK_LABELS = [
  { h: 0, text: '12AM', main: true },
  { h: 2, text: '2', main: false },
  { h: 4, text: '4', main: false },
  { h: 6, text: '6AM', main: true },
  { h: 8, text: '8', main: false },
  { h: 10, text: '10', main: false },
  { h: 12, text: '12PM', main: true },
  { h: 14, text: '2', main: false },
  { h: 16, text: '4', main: false },
  { h: 18, text: '6PM', main: true },
  { h: 20, text: '8', main: false },
  { h: 22, text: '10', main: false },
];

function SleepScheduleDial({ bedHour, wakeHour, onBedChange, onWakeChange }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const rTrack = 128;
  const rArc = 128;
  const rTicks = 128;
  const rLabels = 88;
  const dragging = useRef(null);
  const svgRef = useRef(null);

  const bedRad = hourToRad(bedHour);
  const wakeRad = hourToRad(wakeHour);
  const bedPos = polar(cx, cy, rArc, bedRad);
  const wakePos = polar(cx, cy, rArc, wakeRad);

  const arcSpan = wakeHour >= bedHour ? wakeHour - bedHour : 24 - bedHour + wakeHour;
  const tickCount = Math.max(24, Math.round(arcSpan * 4));
  const ticks = [];
  for (let i = 0; i <= tickCount; i++) {
    const hr = (bedHour + (arcSpan * i) / tickCount) % 24;
    const rad = hourToRad(hr);
    const inner = polar(cx, cy, rTicks - 5, rad);
    const outer = polar(cx, cy, rTicks + 7, rad);
    ticks.push(
      <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.9)" strokeWidth="1.15" />
    );
  }

  const clientToHour = useCallback((clientX, clientY, svgRect) => {
    const x = ((clientX - svgRect.left) / svgRect.width) * size - cx;
    const y = ((clientY - svgRect.top) / svgRect.height) * size - cy;
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;
    return (angle / (Math.PI * 2)) * 24;
  }, [cx, cy, size]);

  const onPointerDown = (which) => (e) => {
    e.preventDefault();
    dragging.current = which;
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging.current || !svgRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const h = Math.round(clientToHour(e.clientX, e.clientY, rect) * 2) / 2;
    if (dragging.current === 'bed') onBedChange(h % 24);
    else onWakeChange(h % 24);
  };

  const onPointerUp = () => {
    dragging.current = null;
  };

  return (
    <div className="relative flex justify-center" style={{ width: size, height: size, margin: '0 auto' }}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="touch-none"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Outer track ring */}
        <circle cx={cx} cy={cy} r={rTrack} fill="none" stroke="#2A2E38" strokeWidth="22" />

        {/* Active sleep arc (lighter band) */}
        <path
          d={describeArc(cx, cy, rArc, bedHour, wakeHour)}
          fill="none"
          stroke="rgba(180,185,200,0.35)"
          strokeWidth="22"
          strokeLinecap="round"
        />

        {/* Tick marks on arc */}
        {ticks}

        {/* Inner dial face */}
        <circle cx={cx} cy={cy} r={rLabels - 4} fill="#1A1D26" />

        {/* Hour tick marks on inner face */}
        {Array.from({ length: 24 }, (_, i) => {
          const rad = hourToRad(i);
          const a = polar(cx, cy, rLabels - 2, rad);
          const b = polar(cx, cy, rLabels + 4, rad);
          return (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,255,255,0.25)" strokeWidth={i % 6 === 0 ? 1.5 : 0.8} />
          );
        })}

        {/* Clock labels */}
        {CLOCK_LABELS.map(({ h, text, main }) => {
          const rad = hourToRad(h);
          const p = polar(cx, cy, rLabels - (main ? 18 : 22), rad);
          return (
            <text
              key={h}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#FFFFFF"
              style={{
                fontFamily: SANS,
                fontSize: main ? 11 : 10,
                fontWeight: main ? 600 : 400,
                opacity: main ? 1 : 0.85,
              }}
            >
              {text}
            </text>
          );
        })}

        {/* Sparkle near 12AM */}
        <g transform={`translate(${polar(cx, cy, rLabels - 32, hourToRad(0)).x - 6}, ${polar(cx, cy, rLabels - 32, hourToRad(0)).y - 6})`}>
          <path
            d="M6 0 L7.2 4.8 L12 6 L7.2 7.2 L6 12 L4.8 7.2 L0 6 L4.8 4.8 Z"
            fill="#5EEAD4"
            opacity="0.95"
          />
        </g>

        {/* Sun near 12PM */}
        <g transform={`translate(${polar(cx, cy, rLabels - 32, hourToRad(12)).x - 7}, ${polar(cx, cy, rLabels - 32, hourToRad(12)).y - 7})`}>
          <circle cx="7" cy="7" r="4.5" fill="#FBBF24" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="7"
              y1="7"
              x2={7 + 7 * Math.cos((deg * Math.PI) / 180)}
              y2={7 + 7 * Math.sin((deg * Math.PI) / 180)}
              stroke="#FBBF24"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Bed handle — Zzz */}
        <g
          transform={`translate(${bedPos.x - 18}, ${bedPos.y - 18})`}
          style={{ cursor: 'grab' }}
          onPointerDown={onPointerDown('bed')}
        >
          <circle cx="18" cy="18" r="17" fill="#FFFFFF" />
          <text x="18" y="22" textAnchor="middle" fill="#3D4250" style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700 }}>
            Zzz
          </text>
        </g>

        {/* Wake handle — bell */}
        <g
          transform={`translate(${wakePos.x - 18}, ${wakePos.y - 18})`}
          style={{ cursor: 'grab' }}
          onPointerDown={onPointerDown('wake')}
        >
          <circle cx="18" cy="18" r="17" fill="#FFFFFF" />
          <text x="18" y="22" textAnchor="middle" fill="#3D4250" style={{ fontSize: 14 }} aria-hidden>
            🔔
          </text>
        </g>
      </svg>
    </div>
  );
}

function WeeklySleepRow({ weekData }) {
  return (
    <div
      className="flex justify-between items-center px-3 py-5"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}
    >
      {weekData.map((day) => (
        <div key={day.date} className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 44,
              height: 44,
              border: '1.5px solid rgba(255,255,255,0.95)',
            }}
          >
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 15,
                fontWeight: 400,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
              }}
            >
              {day.pct != null ? `${day.pct}%` : '0%'}
            </span>
          </div>
          <span
            style={{
              fontFamily: SERIF,
              fontSize: 14,
              color: day.isToday ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
              fontWeight: day.isToday ? 600 : 400,
            }}
          >
            {day.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function SleepGoalCard({ bedHour, wakeHour, goalHours }) {
  const size = 140;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const progress = Math.min(1, goalHours / TARGET_HOURS);
  const dash = progress * circ;
  const cx = size / 2;
  const cy = size / 2;

  const moonPos = { x: cx, y: cy - r };
  const sunPos = { x: cx, y: cy + r * 0.72 };

  return (
    <div
      className="rounded-[20px] p-4 flex flex-col items-center justify-center"
      style={{ background: '#FFFFFF', minHeight: 168 }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="goalRingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="55%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#E879F9" />
            </linearGradient>
          </defs>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E8ECF4" strokeWidth={stroke} />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="url(#goalRingGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </svg>

        {/* Moon icon on ring */}
        <div
          className="absolute w-4 h-4 rounded-full flex items-center justify-center"
          style={{
            left: moonPos.x - 8,
            top: moonPos.y - 8,
            background: '#1E3A8A',
          }}
        >
          <span className="text-[8px]">🌙</span>
        </div>
        <div
          className="absolute w-4 h-4 rounded-full flex items-center justify-center"
          style={{
            left: sunPos.x - 8,
            top: sunPos.y - 8,
            background: '#F472B6',
          }}
        >
          <span className="text-[8px]">☀️</span>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
          <p style={{ fontFamily: SANS, fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>
            Fall asleep / {formatHour12(bedHour)}
          </p>
          <p
            style={{
              fontFamily: SERIF,
              fontSize: 36,
              fontWeight: 600,
              color: '#1E3A8A',
              lineHeight: 1,
              letterSpacing: '-0.03em',
            }}
          >
            {Math.round(goalHours)}hr
          </p>
          <p style={{ fontFamily: SANS, fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>
            Wake Up / {formatHour12(wakeHour)}
          </p>
        </div>
      </div>
    </div>
  );
}

function SleepInsightCard({ hoursLogged }) {
  const underFour = hoursLogged != null && hoursLogged < 4;
  const h = hoursLogged != null ? (hoursLogged % 1 === 0 ? `${hoursLogged}h` : formatHour12(hoursLogged)) : '4h';

  return (
    <div
      className="rounded-[20px] p-4 flex flex-col justify-between"
      style={{
        background: 'linear-gradient(145deg, #7C3AED 0%, #5B21B6 45%, #4338CA 100%)',
        minHeight: 148,
      }}
    >
      <span className="text-white text-lg leading-none">🌙</span>
      <div>
        <p style={{ fontFamily: SANS, fontSize: 15, color: '#FFFFFF', lineHeight: 1.35 }}>
          {underFour || hoursLogged == null ? (
            <>
              Less than <strong>{hoursLogged != null ? h : '4h'}</strong> of <strong>sleep</strong> today.
            </>
          ) : (
            <>
              You logged <strong>{h}</strong> of <strong>sleep</strong> today.
            </>
          )}
        </p>
        <p style={{ fontFamily: SANS, fontSize: 15, color: '#FFFFFF', marginTop: 12 }}>
          Get some <strong>rest!</strong>
        </p>
      </div>
    </div>
  );
}

function DetailPlaceholder() {
  return (
    <div
      className="rounded-[20px] w-full h-full"
      style={{ background: '#B8C4D4', minHeight: 332 }}
      aria-hidden
    />
  );
}

function LogHoursSheet({ open, onClose, onSave, saving }) {
  const [picked, setPicked] = useState(8);
  const options = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 11, 12];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 max-w-lg mx-auto">
          <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="absolute bottom-0 left-0 right-0 rounded-t-[24px] p-6 pb-10"
            style={{ background: NAVY, border: '1px solid rgba(255,255,255,0.15)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
          >
            <p className="text-white font-semibold mb-4" style={{ fontFamily: SANS }}>Log hours slept</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {options.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setPicked(h)}
                  className="h-11 rounded-xl text-sm font-semibold"
                  style={{
                    background: picked === h ? '#FFFFFF' : 'rgba(255,255,255,0.08)',
                    color: picked === h ? NAVY : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {h}h
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onSave(picked)}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-white font-bold"
              style={{ color: NAVY, fontFamily: SANS }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function SleepTracker() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const [showLog, setShowLog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [optimisticHours, setOptimisticHours] = useState(null);
  const scheduleInit = readSchedule();
  const [bedHour, setBedHour] = useState(scheduleInit.bed);
  const [wakeHour, setWakeHour] = useState(scheduleInit.wake);

  const goalHours = sleepDurationHours(bedHour, wakeHour);
  const sleepHours = optimisticHours ?? profile.last_sleep_hours ?? readSleepStore()[TODAY] ?? null;

  const handleBed = (h) => {
    setBedHour(h);
    saveSchedule(h, wakeHour);
  };
  const handleWake = (h) => {
    setWakeHour(h);
    saveSchedule(bedHour, h);
  };

  const weekData = useMemo(() => {
    const store = readSleepStore();
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = new Date();
    const dayIdx = today.getDay();
    const mondayOffset = dayIdx === 0 ? 6 : dayIdx - 1;
    const profileHours = optimisticHours ?? profile.last_sleep_hours;

    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, mondayOffset - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const hours = store[dateStr] ?? (dateStr === TODAY && profileHours ? profileHours : null);
      const pct = hours != null ? computeScore(hours) : null;
      return { date: dateStr, label: labels[i], hours, pct, isToday: dateStr === TODAY };
    });
  }, [optimisticHours, profile.last_sleep_hours]);

  const saveSleep = async (hours) => {
    setOptimisticHours(hours);
    setSaving(true);
    try {
      const stored = readSleepStore();
      stored[TODAY] = hours;
      localStorage.setItem('scanly_sleep', JSON.stringify(stored));
    } catch (_) {}
    if (profile.id) {
      await base44.entities.UserProfile.update(profile.id, {
        last_sleep_hours: hours,
        last_sleep_date: TODAY,
      });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
    setSaving(false);
    setShowLog(false);
  };

  return (
    <div
      className="min-h-screen pb-28 select-none"
      style={{ background: NAVY, fontFamily: SANS }}
    >
      <div className="px-5 pt-12 max-w-lg mx-auto">
        {/* Home */}
        <Link
          to="/"
          className="inline-flex items-center justify-center w-9 h-9 rounded-full mb-6"
          style={{ border: '1.5px solid rgba(255,255,255,0.9)' }}
        >
          <Home className="w-4 h-4 text-white" strokeWidth={2} />
        </Link>

        {/* Clock dial */}
        <SleepScheduleDial
          bedHour={bedHour}
          wakeHour={wakeHour}
          onBedChange={handleBed}
          onWakeChange={handleWake}
        />

        {/* White-outlined module container (weekly + cards) — no orange bezel */}
        <div
          className="mt-6 rounded-[28px] overflow-hidden"
          style={{ border: '1.5px solid rgba(255,255,255,0.92)' }}
        >
          <WeeklySleepRow weekData={weekData} />

          <div className="p-3 grid grid-cols-[1fr_1fr] gap-3" style={{ background: NAVY }}>
            <div className="flex flex-col gap-3">
              <button type="button" onClick={() => setShowLog(true)} className="text-left w-full">
                <SleepGoalCard bedHour={bedHour} wakeHour={wakeHour} goalHours={goalHours} />
              </button>
              <button type="button" onClick={() => setShowLog(true)} className="text-left w-full">
                <SleepInsightCard hoursLogged={sleepHours} />
              </button>
            </div>
            <DetailPlaceholder />
          </div>
        </div>
      </div>

      <LogHoursSheet open={showLog} onClose={() => setShowLog(false)} onSave={saveSleep} saving={saving} />
    </div>
  );
}
