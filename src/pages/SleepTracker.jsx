import React, { useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, Sparkles, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  buildCalendarWeek,
  calcWeekStreak,
  calcWeekAvgHours,
  calcBestNight,
  calcDurationScore,
  calcQualitySleepScore,
  deriveTimesFromHours,
  getGreeting,
  hoursFromLog,
  QUALITY_EMOJI,
} from '@/lib/sleepCalculations';
import { loadLocalSleepLogs, saveLocalSleepLog, mergeSleepLogs } from '@/lib/sleepStorage';
import { usePageVisible, pageRevealStyle } from '@/lib/animHelpers';
import SleepWeeklyChart from '@/components/sleep/SleepWeeklyChart';
import SleepLogSheet from '@/components/sleep/SleepLogSheet';
import SleepAnalysisPage from '@/components/sleep/SleepAnalysisPage';
import '@/styles/sleepTracker.css';

const TODAY = format(new Date(), 'yyyy-MM-dd');

const insightStyle = (type) => {
  if (type === 'warning') return { icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, iconBg: '#FEF3C7' };
  if (type === 'positive') return { icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, iconBg: '#D1FAE5' };
  return { icon: <Lightbulb className="w-4 h-4 text-indigo-500" />, iconBg: '#EEF2FF' };
};

function SleepToast({ message, show }) {
  return (
    <div className={`st-toast${show ? ' is-show' : ''}`}>
      {message}
    </div>
  );
}

export default function SleepTracker() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const pageVisible = usePageVisible();

  const [showLogSheet, setShowLogSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysisDay, setAnalysisDay] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const { data: apiSleepLogs = [] } = useQuery({
    queryKey: ['sleepLogs'],
    queryFn: async () => {
      try {
        return await base44.entities.SleepLog.list();
      } catch {
        return [];
      }
    },
  });

  const sleepLogs = useMemo(
    () => mergeSleepLogs(apiSleepLogs, loadLocalSleepLogs()),
    [apiSleepLogs],
  );

  const todayLog = useMemo(() => sleepLogs.find((l) => l.date === TODAY), [sleepLogs]);

  const weekDays = useMemo(() => buildCalendarWeek(sleepLogs), [sleepLogs]);
  const avgHours = useMemo(() => calcWeekAvgHours(weekDays), [weekDays]);
  const bestNight = useMemo(() => calcBestNight(weekDays), [weekDays]);
  const streak = useMemo(() => calcWeekStreak(weekDays), [weekDays]);

  const showToast = useCallback((message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2500);
  }, []);

  const logInitialData = useMemo(() => {
    if (!todayLog) return null;
    return {
      hours: hoursFromLog(todayLog),
      quality: todayLog.mood || null,
      notes: todayLog.journal_note || '',
      tags: [],
    };
  }, [todayLog]);

  const handleSaveSleep = async ({ hours, quality, notes, tags }) => {
    setSaving(true);
    const { sleep_time, wake_time, duration_minutes } = deriveTimesFromHours(hours);
    const sleepScore = calcQualitySleepScore(hours, quality);
    const durationScore = calcDurationScore(duration_minutes);

    const noteText = [notes.trim(), tags.length ? tags.join(', ') : ''].filter(Boolean).join('\n');

    const payload = {
      date: TODAY,
      sleep_time,
      wake_time,
      duration_minutes,
      sleep_score: sleepScore,
      duration_score: durationScore,
      consistency_score: todayLog?.consistency_score ?? 0,
      habits_score: todayLog?.habits_score ?? 50,
      mood: quality,
      journal_note: noteText,
    };

    const existingId = todayLog?.id && !String(todayLog.id).startsWith('local-') ? todayLog.id : null;
    const localEntry = saveLocalSleepLog({ ...payload, id: existingId || todayLog?.id });

    queryClient.setQueryData(['sleepLogs'], (old = []) => {
      const rest = (old || []).filter((l) => l.date !== TODAY);
      return [localEntry, ...rest];
    });

    try {
      let saved = localEntry;
      if (existingId) {
        saved = await base44.entities.SleepLog.update(existingId, payload);
      } else {
        saved = await base44.entities.SleepLog.create(payload);
      }
      saveLocalSleepLog({ ...payload, id: saved.id });
      queryClient.setQueryData(['sleepLogs'], (old = []) => {
        const rest = (old || []).filter((l) => l.date !== TODAY);
        return [{ ...saved, ...payload }, ...rest];
      });
    } catch (err) {
      console.error('Sleep API save failed, using local storage:', err);
    }

    try {
      if (profile?.id) {
        await base44.entities.UserProfile.update(profile.id, {
          last_sleep_hours: hours,
          last_sleep_date: TODAY,
        });
      }
    } catch (_) {
      /* profile update is optional */
    }

    queryClient.invalidateQueries({ queryKey: ['sleepLogs'] });
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });

    setShowLogSheet(false);
    showToast('Sleep logged! 💤');
    setSaving(false);
  };

  const analyzeSleep = async () => {
    if (sleepLogs.length === 0) {
      showToast('Log some sleep first to analyze');
      return;
    }

    setAnalyzing(true);
    setAiResult(null);

    const recent = [...sleepLogs]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);

    const avgHoursLogged = recent.reduce((s, l) => s + (l.duration_minutes || 0), 0) / recent.length / 60;
    const avgScore = Math.round(
      recent.reduce((s, l) => s + (l.sleep_score || 0), 0) / recent.length,
    );

    const sleepSummary = recent
      .map((l) => {
        const h = ((l.duration_minutes || 0) / 60).toFixed(1);
        return `${l.date}: ${h}h, quality: ${l.mood || 'unknown'}, score: ${l.sleep_score ?? 'n/a'}${l.journal_note ? `, notes: ${l.journal_note}` : ''}`;
      })
      .join('\n');

    const prompt = `You are a sleep specialist and coach. Analyze this user's sleep logs and give personalized, actionable insights.

Base your entire analysis on the specific data below. Do not use generic advice — reference actual numbers from their logs.

USER PROFILE:
- Age: ${profile.age || 'unknown'} | Sex: ${profile.sex || 'unknown'} | Goal: ${profile.goal || 'general health'}
- Health conditions: ${(profile.health_conditions || []).join(', ') || 'none reported'}

SLEEP SUMMARY (last ${recent.length} logged nights):
- Average duration: ${avgHoursLogged.toFixed(1)} hours/night
- Average sleep score: ${avgScore}/100

DAILY LOGS:
${sleepSummary}

Identify patterns (weekday vs weekend, quality vs duration mismatches, consistency issues). Return 3-4 specific insights with titles and descriptions citing their actual data.`;

    try {
      const { data: claudeRes } = await base44.functions.invoke('analyzeWithClaude', {
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            insights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  type: { type: 'string' },
                },
              },
            },
            top_recommendation: { type: 'string' },
          },
        },
      });
      setAiResult(claudeRes?.result || claudeRes);
    } catch (err) {
      console.error(err);
      showToast('Analysis failed — try again');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDayClick = (day) => {
    if (day.log) {
      setAnalysisDay(day);
    } else {
      showToast(`No data for ${day.label}`);
    }
  };

  const handleCloseAnalysis = () => setAnalysisDay(null);

  return (
    <div className="sleep-tracker min-h-screen bg-background" style={pageRevealStyle(pageVisible)}>
      <div className={`st-main${analysisDay ? ' is-hidden' : ''}`}>
        {/* Header */}
        <div className="st-page-header">
          <div>
            <div className="st-header-greeting">{getGreeting()}</div>
            <div className="st-header-title">Sleep</div>
          </div>
          <div className="st-header-avatar">🌙</div>
        </div>

        {/* Log Sleep */}
        <button type="button" className="st-log-btn" onClick={() => setShowLogSheet(true)}>
          <div className="st-log-btn-label">
            <div className="st-btn-icon">+</div>
            LOG Sleep
          </div>
          <div className="st-log-btn-sub">
            {todayLog ? `Last logged: ${hoursFromLog(todayLog).toFixed(1)}h — tap to update` : "Tap to record tonight's sleep"}
          </div>
        </button>

        {/* Quick Stats */}
        <div className="st-quick-stats">
          <div className="st-quick-stat">
            <div className="st-quick-stat-value">{avgHours != null ? avgHours.toFixed(1) : '--'}</div>
            <div className="st-quick-stat-label">Avg Hours</div>
            <div className="st-quick-stat-delta st-delta-neutral">This week</div>
          </div>
          <div className="st-quick-stat">
            <div className="st-quick-stat-value">{bestNight ? bestNight.dayShort : '--'}</div>
            <div className="st-quick-stat-label">Best Night</div>
            <div className="st-quick-stat-delta st-delta-up">
              {bestNight ? `${Number(bestNight.hours).toFixed(1)}h` : '--'}
            </div>
          </div>
          <div className="st-quick-stat">
            <div className="st-quick-stat-value">{streak}</div>
            <div className="st-quick-stat-label">Day Streak</div>
            <div className="st-quick-stat-delta st-delta-neutral">Keep it up!</div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="st-section">
          <div className="st-section-header">
            <div className="st-section-title">Weekly Trends</div>
            <button
              type="button"
              className="st-section-action"
              onClick={() => showToast('Full history coming soon')}
            >
              See All →
            </button>
          </div>
          <SleepWeeklyChart weekDays={weekDays} onDayClick={handleDayClick} />
        </div>

        {/* Week Overview */}
        <div className="st-section">
          <div className="st-section-header">
            <div className="st-section-title">Week Overview</div>
            <button
              type="button"
              className="st-section-action"
              onClick={() => showToast('Tap a day with data to analyze')}
            >
              Tap to analyze
            </button>
          </div>
          <div className="st-week-container">
            {weekDays.map((day) => {
              const hasData = !!day.log;
              const emoji = day.quality ? QUALITY_EMOJI[day.quality] || '' : '';
              return (
                <button
                  key={day.key}
                  type="button"
                  className={`st-day-pill${hasData ? ' has-data' : ''}${day.isToday ? ' is-today' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="st-day-letter">{day.label[0]}</div>
                  <div className="st-day-name">{day.label}</div>
                  {hasData && <div className="st-day-hours">{Number(day.hours).toFixed(1)}h</div>}
                  {hasData && emoji && <div className="st-day-quality">{emoji}</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Card */}
        <div className="st-ai-card">
          <div className="st-ai-header">
            <div className="st-ai-icon-wrap">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="st-ai-title">AI Sleep Analysis</div>
              <div className="st-ai-badge">Beta</div>
            </div>
          </div>
          <div className="st-ai-desc">
            Analyzes your sleep logs to find patterns, consistency issues, and personalized tips for better rest.
          </div>
          <button
            type="button"
            className="st-ai-btn"
            onClick={analyzeSleep}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Analyze My Sleep
              </>
            )}
          </button>

          {aiResult && (
            <div className="st-ai-results">
              {aiResult.summary && (
                <div className="st-ai-summary">
                  <p className="st-ai-summary-label">Summary</p>
                  <p className="st-ai-summary-text">{aiResult.summary}</p>
                </div>
              )}

              {(aiResult.insights || []).map((insight, i) => {
                const style = insightStyle(insight.type);
                return (
                  <div key={i} className="st-ai-insight">
                    <div className="st-ai-insight-icon" style={{ background: style.iconBg }}>
                      {style.icon}
                    </div>
                    <div>
                      <p className="st-ai-insight-title">{insight.title}</p>
                      <p className="st-ai-insight-desc">{insight.description}</p>
                    </div>
                  </div>
                );
              })}

              {aiResult.top_recommendation && (
                <div className="st-ai-recommendation">
                  <p className="st-ai-recommendation-label">Top Recommendation</p>
                  <p className="st-ai-recommendation-text">{aiResult.top_recommendation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Log Sheet */}
      <SleepLogSheet
        open={showLogSheet}
        onClose={() => setShowLogSheet(false)}
        onSave={handleSaveSleep}
        saving={saving}
        initialData={logInitialData}
        onToast={showToast}
      />

      {/* Analysis Page */}
      {analysisDay && (
        <SleepAnalysisPage day={analysisDay} onClose={handleCloseAnalysis} />
      )}

      {/* AI loading overlay */}
      {analyzing && (
        <div className="st-ai-loading">
          <Loader2 className="w-10 h-10 animate-spin text-white mb-4" />
          <p className="text-white text-lg font-semibold">Analyzing your sleep...</p>
          <p className="text-sm mt-1 st-ai-loading-sub">Reviewing patterns from your logs</p>
        </div>
      )}

      <SleepToast message={toast.message} show={toast.show} />
    </div>
  );
}
