import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Calendar, MoreHorizontal, Play, BarChart2, User, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const DATE_LABEL = format(new Date(), 'EEE d MMM');

// Small orange ring for metric modules
function SmallRing({ pct = 0, size = 28, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  // Gap at bottom: start at ~120deg, end at ~60deg (leaving ~60deg gap at bottom)
  const gapAngle = 60;
  const arcAngle = 360 - gapAngle;
  const dash = (pct / 100) * (arcAngle / 360) * circ;
  const total = circ;
  const rotation = 90 + gapAngle / 2; // start from bottom-left

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="smRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E8924A" />
          <stop offset="100%" stopColor="#F0B429" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke}
        strokeDasharray={`${(arcAngle / 360) * circ} ${circ}`}
        strokeLinecap="round"
        style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50% 50%' }} />
      {pct > 0 && (
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="url(#smRingGrad)" strokeWidth={stroke}
          strokeDasharray={`${dash} ${total}`}
          strokeLinecap="round"
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50% 50%', transition: 'stroke-dasharray 1s ease' }} />
      )}
    </svg>
  );
}

function MetricModule({ label, value, pct, style = {} }) {
  return (
    <div className="flex flex-col gap-1" style={style}>
      <span style={{ fontSize: 11, color: '#9B9DB0', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{label}</span>
      <div className="flex items-center gap-1.5">
        <SmallRing pct={pct} />
        <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{value}</span>
        <span style={{ fontSize: 14, color: '#9B9DB0' }}>→</span>
      </div>
    </div>
  );
}

// Main large ring with gap at bottom
function MainRing({ score = 0, size = 220, stroke = 14 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const gapAngle = 50;
  const arcAngle = 360 - gapAngle;
  const maxDash = (arcAngle / 360) * circ;
  const dash = (score / 100) * maxDash;
  const rotation = 90 + gapAngle / 2;

  const qualityLabel = score >= 90 ? 'Excellent' : score >= 80 ? 'Very Good' : score >= 70 ? 'Good' : score >= 55 ? 'Fair' : score > 0 ? 'Poor' : '—';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="mainRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E8924A" />
            <stop offset="100%" stopColor="#F0B429" />
          </linearGradient>
        </defs>
        {/* Track arc */}
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke}
          strokeDasharray={`${maxDash} ${circ}`}
          strokeLinecap="round"
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50% 50%' }} />
        {/* Progress arc */}
        {score > 0 && (
          <circle cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="url(#mainRingGrad)" strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50% 50%', transition: 'stroke-dasharray 1.2s ease' }} />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <div style={{
          background: '#2E3044', borderRadius: 20, padding: '4px 10px',
          fontSize: 11, color: '#9B9DB0', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500
        }}>
          Sleep Score
        </div>
        <span style={{ fontSize: 64, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
          {score > 0 ? score : '—'}
        </span>
        <span style={{ fontSize: 16, color: '#9B9DB0' }}>{qualityLabel}</span>
      </div>
    </div>
  );
}

function formatHours(h) {
  if (!h) return '—';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`;
}

export default function SleepTracker() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('journal');
  const [showInput, setShowInput] = useState(false);
  const [selectedHours, setSelectedHours] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles[0] || {};

  // Read sleep from profile or localStorage
  const localSleepHours = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem('scanly_sleep') || '{}');
      return stored[TODAY] ?? null;
    } catch { return null; }
  })();
  const sleepHours = profile.last_sleep_hours ?? localSleepHours ?? null;

  // Derived stats
  const durationScore = sleepHours ? Math.min(100, Math.round((sleepHours / 8) * 100)) : 0;
  const qualityScore = sleepHours ? Math.min(100, Math.round(durationScore * 0.95 + 5)) : 0;
  const habitsScore = sleepHours ? Math.min(100, Math.round(durationScore * 0.9 + 10)) : 0;
  const sleepScore = sleepHours ? Math.min(100, Math.round((durationScore * 0.4 + qualityScore * 0.35 + habitsScore * 0.25))) : 0;

  const timeInBed = sleepHours ? sleepHours + 1.13 : null; // estimate
  const sleepDebt = sleepHours ? Math.max(0, 8 - sleepHours) : null;

  const saveSleep = async (h) => {
    setSelectedHours(h);
    setSaving(true);
    // Save to localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('scanly_sleep') || '{}');
      stored[TODAY] = h;
      localStorage.setItem('scanly_sleep', JSON.stringify(stored));
    } catch (_) {}
    if (profile.id) {
      await base44.entities.UserProfile.update(profile.id, {
        last_sleep_hours: h,
        last_sleep_date: TODAY,
      });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
    setSaving(false);
    setShowInput(false);
  };

  const displayHours = selectedHours ?? sleepHours;

  return (
    <div className="min-h-screen flex flex-col select-none"
      style={{ background: '#1C1E2A' }}>

      {/* Purple radial glow behind ring */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 30%, #2E2A3E 0%, #1C1E2A 70%)',
      }} />

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-14 pb-4">
        <button style={{
          width: 36, height: 36, borderRadius: 10, background: '#252836',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Calendar className="w-4 h-4" style={{ color: '#9B9DB0' }} />
        </button>

        <span style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>{DATE_LABEL}</span>

        <button style={{
          width: 36, height: 36, borderRadius: 18, background: '#252836',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MoreHorizontal className="w-4 h-4" style={{ color: '#9B9DB0' }} />
        </button>
      </div>

      {/* SECONDARY METRICS ROW */}
      <div className="relative z-10 flex items-start justify-between px-7 mb-2">
        <MetricModule label="Duration" value={durationScore} pct={durationScore} style={{ marginTop: 8 }} />
        <MetricModule label="Quality" value={qualityScore} pct={qualityScore} style={{ marginTop: 0 }} />
        <MetricModule label="Habits" value={habitsScore} pct={habitsScore} style={{ marginTop: 8 }} />
      </div>

      {/* MAIN RING */}
      <div className="relative z-10 flex justify-center mt-2">
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <MainRing score={sleepScore} />
        </motion.div>
      </div>

      {/* LISTEN ROW */}
      <div className="relative z-10 flex items-center justify-center gap-3 mt-6">
        <button style={{
          width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Play className="w-3.5 h-3.5 text-white" fill="white" />
        </button>
        <span style={{ fontSize: 15, color: '#fff' }}>Listen to your sleep</span>
      </div>

      {/* LOG SLEEP BUTTON (if no sleep logged) */}
      {!displayHours && (
        <div className="relative z-10 flex justify-center mt-5">
          <button onClick={() => setShowInput(true)}
            style={{
              background: 'linear-gradient(135deg, #E8924A, #F0B429)',
              borderRadius: 24, padding: '12px 32px',
              fontSize: 15, fontWeight: 600, color: '#fff',
            }}>
            Log Last Night's Sleep
          </button>
        </div>
      )}
      {displayHours && (
        <div className="relative z-10 flex justify-center mt-4">
          <button onClick={() => setShowInput(true)}
            style={{ fontSize: 13, color: '#9B9DB0', textDecoration: 'underline' }}>
            Edit sleep hours
          </button>
        </div>
      )}

      <div className="flex-1" />

      {/* BOTTOM STATS TRAY */}
      <div className="relative z-10" style={{
        background: '#13141F', borderRadius: '24px 24px 0 0', padding: '20px 20px 0 20px',
      }}>
        {/* Row 1 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 rounded-[16px] p-4" style={{ background: '#252836' }}>
            <p style={{ fontSize: 13, color: '#9B9DB0', marginBottom: 4 }}>Sleep</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
              {displayHours ? formatHours(displayHours) : '—'}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 px-4">
            <SmallRing pct={durationScore} size={36} stroke={5} />
            <div className="flex items-center gap-1">
              <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{durationScore || '—'}</span>
              <span style={{ fontSize: 14, color: '#9B9DB0' }}>→</span>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex gap-3 pb-6">
          <div className="flex-1 rounded-[16px] p-4" style={{ background: '#252836' }}>
            <p style={{ fontSize: 13, color: '#9B9DB0', marginBottom: 4 }}>Time in bed</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
              {timeInBed ? formatHours(timeInBed) : '—'}
            </p>
          </div>
          <div className="flex-1 rounded-[16px] p-4" style={{ background: '#252836' }}>
            <p style={{ fontSize: 13, color: '#9B9DB0', marginBottom: 4 }}>Sleep Debt</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
              {sleepDebt !== null && sleepDebt > 0 ? formatHours(sleepDebt) : sleepDebt === 0 ? 'None 🎉' : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div className="relative z-10 flex items-center justify-around px-6 pb-8 pt-3" style={{ background: '#13141F', minHeight: 80 }}>
        {[
          { key: 'journal', icon: BookOpen, label: 'Journal' },
          { key: 'stats', icon: BarChart2, label: 'Statistics' },
          { key: 'profile', icon: User, label: 'Profile' },
        ].map(({ key, icon: Icon, label }) => {
          const active = activeTab === key;
          return (
            <button key={key} onClick={() => setActiveTab(key)}
              className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all"
              style={{ background: active ? '#2E3044' : 'transparent' }}>
              <Icon className="w-5 h-5" style={{ color: active ? '#fff' : '#9B9DB0' }} />
              <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? '#fff' : '#9B9DB0' }}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* SLEEP INPUT OVERLAY */}
      {showInput && (
        <motion.div className="fixed inset-0 z-50 flex flex-col justify-end"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInput(false)} />
          <motion.div className="relative z-10 rounded-t-[28px] p-6 pb-12"
            style={{ background: '#1C1E2A', border: '1px solid rgba(255,255,255,0.08)' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>How long did you sleep?</p>
            <p style={{ fontSize: 13, color: '#9B9DB0', marginBottom: 20 }}>Tap to select hours</p>
            <div className="grid grid-cols-4 gap-2.5">
              {[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12].map(h => {
                const isSelected = displayHours === h;
                return (
                  <button key={h} onClick={() => saveSleep(h)}
                    className="h-12 rounded-[14px] text-sm font-bold transition-all active:scale-95"
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, #E8924A, #F0B429)' : '#252836',
                      color: isSelected ? '#fff' : '#9B9DB0',
                    }}>
                    {h % 1 === 0 ? `${h}h` : `${Math.floor(h)}h30`}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}