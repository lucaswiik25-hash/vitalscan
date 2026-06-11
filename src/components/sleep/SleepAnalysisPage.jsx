import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import {
  hoursFromLog,
  calcQualityEfficiency,
  calcQualitySleepScore,
  generateSleepVerdict,
  QUALITY_EMOJI,
} from '@/lib/sleepCalculations';

export default function SleepAnalysisPage({ day, onClose }) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const data = useMemo(() => {
    if (!day?.log) return null;
    const hours = hoursFromLog(day.log);
    const quality = day.log.mood || 'fair';
    const score = calcQualitySleepScore(hours, quality);
    const efficiency = calcQualityEfficiency(hours, quality);
    const { verdict, improvements } = generateSleepVerdict(hours, quality);
    return { hours, quality, score, efficiency, verdict, improvements, notes: day.log.journal_note };
  }, [day]);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const handleClose = () => {
    setClosing(true);
    setVisible(false);
    setTimeout(onClose, 650);
  };

  if (!day || !data) return null;

  const formattedDate = day.log?.date
    ? format(new Date(day.log.date + 'T12:00:00'), 'MMMM d, yyyy')
    : '';

  const qualityLabel = data.quality.charAt(0).toUpperCase() + data.quality.slice(1);
  const qualityEmoji = QUALITY_EMOJI[data.quality] || '🌙';

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`bottom-sheet-backdrop absolute inset-0 bg-black/35 backdrop-blur-sm ${visible && !closing ? 'is-visible' : ''} ${closing ? 'is-closing' : ''}`}
        onClick={handleClose}
      />
      <div
        className={`st-analysis-page bottom-sheet-panel st-analysis-slide absolute left-0 right-0 bottom-0 top-0 flex flex-col overflow-hidden ${visible && !closing ? 'is-visible' : ''} ${closing ? 'is-closing' : ''}`}
      >
        <div className="st-analysis-sheet-handle" />

        <div className="st-analysis-sheet-header">
          <div>
            <div className="st-analysis-date">{day.dayName}</div>
            <div className="st-analysis-date-sub">{formattedDate}</div>
          </div>
          <button type="button" className="st-analysis-close" onClick={handleClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="st-analysis-body flex-1 overflow-y-auto">
          <div className="st-analysis-card">
            <div className="st-analysis-summary-row">
              <span className="st-analysis-emoji">{qualityEmoji}</span>
              <div>
                <div className="st-analysis-hours">{data.hours}h slept</div>
                <div className="st-analysis-meta">
                  {qualityLabel} quality · {data.efficiency}% efficiency · Score {data.score}/100
                </div>
              </div>
            </div>
          </div>

          <div className="st-analysis-card">
            <div className="st-verdict-title">
              <div className="st-verdict-icon-wrap">📊</div>
              Sleep Overview
            </div>
            <div className="st-verdict-text" dangerouslySetInnerHTML={{ __html: data.verdict }} />
            {data.notes?.trim() && (
              <div className="st-notes-display">{data.notes}</div>
            )}
          </div>

          <div className="st-analysis-card">
            <div className="st-verdict-title">
              <div className="st-verdict-icon-wrap">💡</div>
              What Could Improve
            </div>
            <ul className="st-improvement-list">
              {data.improvements.map((imp, i) => (
                <li key={i}>
                  <span className="st-improvement-icon">{imp.icon}</span>
                  {imp.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
