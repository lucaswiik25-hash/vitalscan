import React, { useMemo, useState } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { Flame, Clock, Heart, Footprints, X } from 'lucide-react';

const PRIMARY = '#1c1c1e';
const SURFACE = '#ffffff';
const SURFACE_SECONDARY = '#f8f8fa';
const SURFACE_TERTIARY = '#f2f2f7';
const LABEL_COLOR = '#c7c7cc';
const SECONDARY = '#8e8e93';

/** Upward-arch polar coords: 0° = right-bottom, 90° = top, 180° = left-bottom */
function polarUp(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  };
}

function describeUpwardSegment(cx, cy, innerR, outerR, startDeg, endDeg) {
  const outerStart = polarUp(cx, cy, outerR, startDeg);
  const outerEnd = polarUp(cx, cy, outerR, endDeg);
  const innerEnd = polarUp(cx, cy, innerR, endDeg);
  const innerStart = polarUp(cx, cy, innerR, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${large} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${large} 1 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

function LayingHalfCircleArc({ pct, segments = 12, gapDeg = 3 }) {
  const cx = 140;
  const cy = 140;
  const outerR = 130;
  const innerR = 100;
  const startAngle = 0;
  const endAngle = 180;
  const totalArc = endAngle - startAngle;
  const segmentAngle = (totalArc - (segments - 1) * gapDeg) / segments;
  const filled = Math.round((Math.min(100, pct) / 100) * segments);

  return (
    <div className="w-[280px] h-[140px] mx-auto">
      <svg width="280" height="140" viewBox="0 0 280 140" className="block">
        {Array.from({ length: segments }, (_, i) => {
          const segStart = startAngle + i * (segmentAngle + gapDeg);
          const segEnd = segStart + segmentAngle;
          const active = i < filled;
          return (
            <path
              key={i}
              d={describeUpwardSegment(cx, cy, innerR, outerR, segStart, segEnd)}
              fill={active ? PRIMARY : SURFACE_TERTIARY}
              style={{ transition: 'fill 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
            />
          );
        })}
      </svg>
    </div>
  );
}

function WeekOverview({ weekDays, selectedDate, onSelectDate, workoutDates }) {
  return (
    <div
      className="shadow-sm"
      style={{ background: SURFACE, borderRadius: 24, padding: 20 }}
    >
      <div className="flex justify-between items-end">
        {weekDays.map((d) => {
          const isSelected = d.dateStr === selectedDate;
          const hasWorkout = workoutDates.has(d.dateStr);
          return (
            <button
              key={d.dateStr}
              type="button"
              onClick={() => onSelectDate(d.dateStr)}
              className="press-scale flex flex-col items-center gap-2 flex-1 min-w-0 cursor-pointer"
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? PRIMARY : LABEL_COLOR,
                  textTransform: 'capitalize',
                }}
              >
                {d.label}
              </span>
              <div
                className="day-pill flex flex-col items-center justify-center transition-all"
                style={{
                  width: 44,
                  height: 64,
                  borderRadius: 22,
                  background: isSelected ? PRIMARY : SURFACE_TERTIARY,
                  border: `2px solid ${isSelected ? PRIMARY : PRIMARY}`,
                  boxShadow: isSelected ? '0 8px 20px rgba(0,0,0,0.18)' : 'none',
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: isSelected ? '#fff' : PRIMARY,
                    lineHeight: 1,
                  }}
                >
                  {d.dateNum}
                </span>
                {hasWorkout && (
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: isSelected ? '#fff' : PRIMARY,
                      marginTop: 4,
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, value, label }) {
  return (
    <div
      style={{
        flex: 1,
        background: SURFACE_SECONDARY,
        borderRadius: 16,
        padding: 16,
        textAlign: 'center',
      }}
    >
      <Icon
        style={{ width: 18, height: 18, color: PRIMARY, margin: '0 auto' }}
        strokeWidth={2}
      />
      <div style={{ fontSize: 20, fontWeight: 700, color: PRIMARY, marginTop: 8 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: SECONDARY, marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}

function EditGoalModal({ goal, onSave, onClose }) {
  const [value, setValue] = useState(String(goal));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg mx-4 mb-8 rounded-[24px] p-6 shadow-sm"
        style={{ background: SURFACE }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 style={{ fontSize: 18, fontWeight: 700, color: PRIMARY }}>Daily Burn Goal</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: SURFACE_TERTIARY }}
          >
            <X className="w-4 h-4" style={{ color: SECONDARY }} />
          </button>
        </div>
        <label style={{ fontSize: 13, fontWeight: 600, color: SECONDARY, display: 'block', marginBottom: 8 }}>
          Target Calories
        </label>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-xl px-4 py-3.5 text-base font-semibold focus:outline-none mb-6"
          style={{
            color: PRIMARY,
            border: `2px solid ${SURFACE_TERTIARY}`,
          }}
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 rounded-xl text-base font-bold press-scale"
            style={{ background: SURFACE_TERTIARY, color: PRIMARY }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const n = parseInt(value, 10);
              if (n > 0) onSave(n);
              onClose();
            }}
            className="flex-1 py-4 rounded-xl text-base font-bold text-white press-scale"
            style={{ background: PRIMARY }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExerciseHeroModule({
  selectedDate,
  onSelectDate,
  exercises = [],
  allExercises = [],
  goalValue,
  onGoalChange,
  onLogWorkout,
}) {
  const [showEditGoal, setShowEditGoal] = useState(false);

  const totalBurned = exercises.reduce((s, e) => s + (e.calories_burned || 0), 0);
  const remaining = Math.max(0, goalValue - totalBurned);
  const pct = goalValue > 0 ? Math.min(100, (totalBurned / goalValue) * 100) : 0;

  const weekDays = useMemo(() => {
    const anchor = new Date(selectedDate);
    const weekStart = startOfWeek(anchor, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      return {
        label: format(d, 'EEE'),
        dateNum: format(d, 'd'),
        dateStr: format(d, 'yyyy-MM-dd'),
      };
    });
  }, [selectedDate]);

  const workoutDates = useMemo(() => {
    const dates = new Set();
    allExercises.forEach((e) => {
      if (e.date && (e.calories_burned > 0 || e.duration_minutes > 0)) dates.add(e.date);
    });
    return dates;
  }, [allExercises]);

  const totalMinutes = exercises.reduce((s, e) => s + (e.duration_minutes || 0), 0);

  const avgBpm = useMemo(() => {
    if (exercises.length === 0) return '—';
    const intensityMap = { low: 105, medium: 130, high: 155 };
    let sum = 0;
    let weight = 0;
    exercises.forEach((e) => {
      const mins = e.duration_minutes || 1;
      sum += (intensityMap[e.intensity] || 130) * mins;
      weight += mins;
    });
    return weight > 0 ? Math.round(sum / weight) : '—';
  }, [exercises]);

  const stepsDisplay = useMemo(() => {
    if (exercises.length === 0) return '—';
    const steps = exercises.reduce((s, e) => {
      const mins = e.duration_minutes || 0;
      const isWalk = /walk|run|hike|jog/i.test(e.name || '');
      return s + (isWalk ? mins * 110 : mins * 45);
    }, 0);
    if (steps >= 1000) return `${(steps / 1000).toFixed(1)}k`;
    return String(steps);
  }, [exercises]);

  return (
    <div className="space-y-3">
      <WeekOverview
        weekDays={weekDays}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        workoutDates={workoutDates}
      />

      <div className="shadow-sm" style={{ background: SURFACE, borderRadius: 24, padding: 24 }}>
        <div className="flex items-center justify-between mb-2">
          <h2 style={{ fontSize: 17, fontWeight: 700, color: PRIMARY }}>Calories Burned</h2>
          <button
            type="button"
            onClick={() => setShowEditGoal(true)}
            className="press-scale"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: SECONDARY,
              background: SURFACE_TERTIARY,
              borderRadius: 12,
              padding: '8px 16px',
              border: 'none',
            }}
          >
            Edit
          </button>
        </div>

        <div className="flex flex-col items-center">
          <LayingHalfCircleArc pct={pct} />
          <div className="text-center mt-2.5 relative z-10">
            <Flame
              className="mx-auto mb-2"
              style={{ width: 28, height: 28, color: PRIMARY }}
              strokeWidth={2}
            />
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: PRIMARY,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {remaining}
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: SECONDARY, marginTop: 6 }}>
              {totalBurned >= goalValue ? 'Goal reached' : 'Remaining'}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <StatTile icon={Clock} value={totalMinutes || 0} label="Min Active" />
          <StatTile icon={Heart} value={avgBpm} label="Avg BPM" />
          <StatTile icon={Footprints} value={stepsDisplay} label="Steps" />
        </div>

        <button
          type="button"
          onClick={onLogWorkout}
          className="w-full press-scale flex items-center justify-center gap-2 mt-4"
          style={{
            background: PRIMARY,
            color: '#fff',
            padding: '16px 0',
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          Log Workout
        </button>
      </div>

      {showEditGoal && (
        <EditGoalModal
          goal={goalValue}
          onSave={onGoalChange}
          onClose={() => setShowEditGoal(false)}
        />
      )}
    </div>
  );
}
