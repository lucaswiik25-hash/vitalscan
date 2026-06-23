import React, { useState, useEffect } from 'react';
import { QUALITY_OPTIONS, NOTE_TAGS } from '@/lib/sleepCalculations';

const RING_CIRC = 2 * Math.PI * 80;
const HOUR_PRESETS = [6, 7.5, 8, 9];

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function SleepLogSheet({ open, onClose, onSave, saving, initialData, onToast }) {
  const [step, setStep] = useState(1);
  const [hours, setHours] = useState(7.5);
  const [quality, setQuality] = useState(null);
  const [notes, setNotes] = useState('');
  const [activeTags, setActiveTags] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setHours(initialData?.hours ?? 7.5);
      setQuality(initialData?.quality ?? null);
      setNotes(initialData?.notes ?? '');
      setActiveTags(initialData?.tags ?? []);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
    }
  }, [open, initialData]);

  const ringOffset = RING_CIRC - (hours / 12) * RING_CIRC;
  const progressPct = (hours / 12) * 100;

  const handleHoursChange = (val) => {
    const h = parseFloat(val);
    setHours(h);
  };

  const handlePreset = (h) => {
    setHours(h);
  };

  const toggleTag = (tag) => {
    setActiveTags((prev) => {
      const next = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
      return next;
    });
  };

  const goToStep = (next) => {
    if (next === 3 && !quality && step === 2) {
      onToast?.('Please select a sleep quality');
      return;
    }
    setStep(next);
  };

  const handleSave = () => {
    onSave({ hours, quality: quality || 'fair', notes, tags: activeTags });
  };

  if (!open && !visible) return null;

  return (
    <>
      <div
        className={`st-log-overlay${visible ? ' is-active' : ''}`}
        onClick={onClose}
      />
      <div className={`st-log-sheet${visible ? ' is-active' : ''}${step === 1 ? ' is-fullscreen' : ''}`}>
        <div className="st-log-sheet-handle" />
        <div className="st-log-sheet-content">
          <div className="st-log-header">
            <div className="st-step-indicator">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`st-step-dot${step === i ? ' is-active' : ''}${step > i ? ' is-completed' : ''}`}
                />
              ))}
            </div>
            <button type="button" className="st-log-close" onClick={onClose}>×</button>
          </div>

          {/* Step 1: Hours */}
          <div className={`st-log-page${step === 1 ? ' is-active' : ''}`}>
            <div className="st-log-title">How many hours<br />did you sleep?</div>
            <div className="st-log-subtitle">Adjust to match your actual sleep duration</div>
            <div className="st-hours-display">
              <div className="st-hours-ring">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <defs>
                    <linearGradient id="sleepRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <circle className="st-hours-ring-bg" cx="100" cy="100" r="80" />
                  <circle
                    className="st-hours-ring-fill"
                    cx="100"
                    cy="100"
                    r="80"
                    strokeDasharray={RING_CIRC}
                    strokeDashoffset={ringOffset}
                  />
                </svg>
                <div className="st-hours-number-wrap">
                  <div className="st-hours-number">{hours}</div>
                  <div className="st-hours-label">hours</div>
                </div>
              </div>
            </div>
            <div className="st-hours-slider-wrap">
              <input
                type="range"
                className="st-hours-slider"
                min="0"
                max="12"
                step="0.5"
                value={hours}
                style={{ '--progress': `${progressPct}%` }}
                onChange={(e) => handleHoursChange(e.target.value)}
              />
              <div className="st-hours-marks">
                <span>0h</span><span>3h</span><span>6h</span><span>9h</span><span>12h</span>
              </div>
            </div>
            <div className="st-hours-presets">
              {HOUR_PRESETS.map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`st-hours-preset${hours === h ? ' is-active' : ''}`}
                  onClick={() => handlePreset(h)}
                >
                  {h}h
                </button>
              ))}
            </div>
            <div className="st-log-nav">
              <button type="button" className="st-btn-primary" onClick={() => goToStep(2)}>
                Continue →
              </button>
            </div>
          </div>

          {/* Step 2: Quality */}
          <div className={`st-log-page${step === 2 ? ' is-active' : ''}`}>
            <div className="st-log-title">How was your<br />sleep quality?</div>
            <div className="st-log-subtitle">Be honest - this helps us analyze your patterns</div>
            <div className="st-quality-options">
              {QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`st-quality-option${quality === opt.key ? ' is-selected' : ''}`}
                  onClick={() => setQuality(opt.key)}
                >
                  <div className="st-quality-emoji">{opt.emoji}</div>
                  <div className="st-quality-text">
                    <div className="st-quality-label">{opt.label}</div>
                    <div className="st-quality-desc">{opt.desc}</div>
                  </div>
                  <div className="st-quality-check"><CheckIcon /></div>
                </button>
              ))}
            </div>
            <div className="st-log-nav">
              <button type="button" className="st-btn-secondary" onClick={() => goToStep(1)}>← Back</button>
              <button
                type="button"
                className="st-btn-primary"
                onClick={() => goToStep(3)}
              >
                Continue →
              </button>
            </div>
          </div>

          {/* Step 3: Notes */}
          <div className={`st-log-page${step === 3 ? ' is-active' : ''}`}>
            <div className="st-log-title">Sleep notes</div>
            <div className="st-log-subtitle">Dreams, disturbances, or anything notable</div>
            <textarea
              className="st-notes-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Had a vivid dream about flying... Woke up at 3am because of noise..."
            />
            <div className="st-notes-hint">Optional - skip if nothing to note</div>
            <div className="st-notes-tags">
              {NOTE_TAGS.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  className={`st-note-tag${activeTags.includes(tag.label) ? ' is-active' : ''}`}
                  onClick={() => toggleTag(tag.label)}
                >
                  {tag.emoji} {tag.label}
                </button>
              ))}
            </div>
            <div className="st-log-nav">
              <button type="button" className="st-btn-secondary" onClick={() => goToStep(2)}>← Back</button>
              <button type="button" className="st-btn-primary" onClick={handleSave} disabled={!!saving}>
                {saving ? 'Saving…' : 'Save Sleep ✓'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}