import React, { useMemo } from 'react';

const WIDTH = 320;
const HEIGHT = 170;
const PADDING = 22;

export default function SleepWeeklyChart({ weekDays, onDayClick }) {
  const { linePath, areaPath, dots, activeDays } = useMemo(() => {
    const points = weekDays
      .map((day, i) => {
        if (!day.log || day.hours <= 0) return null;
        const x = PADDING + (i * (WIDTH - 2 * PADDING)) / 6;
        const y = HEIGHT - 10 - (day.hours / 11) * (HEIGHT - 30);
        return { x, y, day };
      })
      .filter(Boolean);

    if (points.length === 0) {
      return { linePath: '', areaPath: '', dots: [], activeDays: new Set() };
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const areaD = `${d} L ${points[points.length - 1].x} ${HEIGHT} L ${points[0].x} ${HEIGHT} Z`;
    const active = new Set(weekDays.filter((d) => d.log).map((d) => d.key));

    return {
      linePath: d,
      areaPath: areaD,
      dots: points,
      activeDays: active,
    };
  }, [weekDays]);

  const gridLines = Array.from({ length: 12 }, (_, i) => {
    const y = HEIGHT - (i / 11) * (HEIGHT - 20);
    return (
      <line
        key={i}
        className="st-chart-grid-line"
        x1={PADDING}
        y1={y}
        x2={WIDTH - PADDING}
        y2={y}
      />
    );
  });

  return (
    <div className="st-chart-card">
      <div className="st-chart-y-axis">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i}>{i}</span>
        ))}
      </div>
      <div className="st-chart-area">
        <svg className="st-chart-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="sleepLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="sleepAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g>{gridLines}</g>
          {areaPath && <path className="st-chart-area-fill" d={areaPath} />}
          {linePath && <path className="st-chart-line" d={linePath} />}
          <g>
            {dots.map((p) => (
              <circle
                key={p.day.dateStr}
                className="st-chart-dot"
                cx={p.x}
                cy={p.y}
                r="4.5"
                onClick={() => onDayClick(p.day)}
              />
            ))}
          </g>
        </svg>
        <div className="st-chart-x-axis">
          {weekDays.map((day) => (
            <span
              key={day.key}
              className={`st-chart-x-label${activeDays.has(day.key) ? ' is-active' : ''}`}
            >
              {day.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
