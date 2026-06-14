import React, { createContext, useCallback, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, X } from 'lucide-react';

const ScanJobContext = createContext(null);

export function storeScanResult(key, data) {
  sessionStorage.setItem(key, JSON.stringify(data));
}

export function loadScanResult(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    sessionStorage.removeItem(key);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function ScanJobProvider({ children }) {
  const navigate = useNavigate();
  const [running, setRunning] = useState(null);
  const [completed, setCompleted] = useState(null);

  const runBackgroundAnalysis = useCallback(({ label, task, resultKey, viewPath, navigateAway }) => {
    setRunning({ label });
    setCompleted(null);
    navigateAway?.();

    task()
      .then((result) => {
        storeScanResult(resultKey, result);
        setRunning(null);
        setCompleted({ label, resultKey, viewPath });
      })
      .catch((err) => {
        setRunning(null);
        alert(err?.message || 'Analysis failed. Please try again.');
      });
  }, []);

  const dismissComplete = useCallback(() => setCompleted(null), []);

  const viewResult = useCallback(() => {
    if (!completed) return;
    navigate(`${completed.viewPath}?bgScan=1`);
    setCompleted(null);
  }, [completed, navigate]);

  return (
    <ScanJobContext.Provider value={{ running, completed, runBackgroundAnalysis, dismissComplete, viewResult }}>
      {children}
      {running && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-900/90 text-white text-sm font-medium shadow-lg backdrop-blur-sm">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{running.label}</span>
        </div>
      )}
      {completed && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-[28px] p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Analysis ready</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Your scan is complete and ready to view.
            </p>
            <button
              type="button"
              onClick={viewResult}
              className="w-full h-12 rounded-2xl bg-gray-900 text-white text-sm font-semibold mb-2"
            >
              View verdict
            </button>
            <button
              type="button"
              onClick={dismissComplete}
              className="w-full h-10 rounded-2xl text-sm text-gray-400 font-medium flex items-center justify-center gap-1"
            >
              <X className="w-4 h-4" /> Dismiss
            </button>
          </div>
        </div>
      )}
    </ScanJobContext.Provider>
  );
}

export function useScanJob() {
  const ctx = useContext(ScanJobContext);
  if (!ctx) throw new Error('useScanJob must be used within ScanJobProvider');
  return ctx;
}
