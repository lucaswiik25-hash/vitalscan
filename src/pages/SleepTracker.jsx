import React, { useState, useEffect } from 'react';

export default function SleepTracker() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sleepDebt, setSleepDebt] = useState({ hours: 2, minutes: 30 });
  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepStartTime, setSleepStartTime] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logHours, setLogHours] = useState('');
  const [logMinutes, setLogMinutes] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[currentTime.getDay()];
  const dayPrefix = dayName.slice(0, 3);
  const daySuffix = dayName.slice(3);

  const nextDayCode = days[(currentTime.getDay() + 1) % 7].slice(0, 2).toUpperCase();

  const formatTimeUnit = (num) => num.toString().padStart(2, '0');

  const handleStartSleep = () => {
    if (!isSleeping) {
      setIsSleeping(true);
      setSleepStartTime(new Date());
    } else {
      const endTime = new Date();
      const durationMs = endTime - sleepStartTime;
      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
      const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

      setLogs(prev => [...prev, {
        id: Date.now(),
        start: sleepStartTime,
        end: endTime,
        duration: `${durationHours}h ${durationMinutes}min`
      }]);
      setIsSleeping(false);
      setSleepStartTime(null);
    }
  };

  const handleAddLog = () => {
    const h = parseInt(logHours) || 0;
    const m = parseInt(logMinutes) || 0;
    if (h > 0 || m > 0) {
      setLogs(prev => [...prev, {
        id: Date.now(),
        start: new Date(),
        end: new Date(),
        duration: `${h}h ${m}min`,
        isManual: true
      }]);
      setLogHours('');
      setLogMinutes('');
      setShowLogModal(false);
    }
  };

  const getElapsedTime = () => {
    if (!sleepStartTime) return { hours: 0, minutes: 0 };
    const diff = new Date() - sleepStartTime;
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    };
  };

  const elapsed = getElapsedTime();
  const displayHours = isSleeping ? elapsed.hours : 11;
  const displayMinutes = isSleeping ? elapsed.minutes : 30;

  return (
    <div className="w-full max-w-[390px] mx-auto bg-[#7a8fa3] rounded-[48px] p-3 pb-6 relative overflow-hidden shadow-2xl">
      {/* Notch */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-[20px] z-10" />

      {/* Status Bar */}
      <div className="h-11 flex items-center justify-between px-2 relative z-[5]">
        <div className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.5 19c0-1.7-1.3-3-3-3h-5c-1.7 0-3 1.3-3 3" />
            <path d="M13 13V9" />
            <path d="M13 9a4 4 0 0 0-4-4" />
            <path d="M13 9a4 4 0 0 1 4-4" />
            <path d="M9 16v3" />
            <path d="M15 16v3" />
            <path d="M11 16v3" />
            <path d="M17 16v3" />
          </svg>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-[#f0f0f0] rounded-[32px] p-7 pt-7 pb-5 mt-1">

        {/* Day Header */}
        <div className="mb-6 leading-[0.9]">
          <div className="text-[72px] font-bold text-black tracking-[-3px] leading-[0.85]">
            {dayPrefix}-
          </div>
          <div className="text-[48px] font-normal text-black tracking-[-1px] ml-1 leading-none">
            {daySuffix}
          </div>
        </div>

        {/* Clock Display */}
        <div className="flex justify-center mb-5">
          <div className="bg-[#f8f8f8] border-[5px] border-[#5a5a5a] rounded-[60px] px-9 pt-[18px] pb-[22px] relative shadow-[inset_0_2px_8px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.15)]">
            <div className="flex items-baseline gap-0.5">
              <span className="text-[80px] font-medium text-[#555] leading-none tracking-[-4px]">
                {displayHours}
              </span>
              <span className="text-2xl font-medium text-black ml-0.5 -mr-0.5">h</span>
              <span className="text-[48px] font-semibold text-[#333] mx-1 leading-[0.8]">:</span>
              <span className="text-[80px] font-medium text-[#555] leading-none tracking-[-4px]">
                {formatTimeUnit(displayMinutes)}
              </span>
              <span className="text-2xl font-medium text-black ml-0.5">min</span>
            </div>
            {/* Clock Feet */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-20">
              <div className="w-7 h-3.5 bg-[#5a5a5a] rounded-b-md" />
              <div className="w-7 h-3.5 bg-[#5a5a5a] rounded-b-md" />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 mb-4">
          <button
            onClick={handleStartSleep}
            className={`w-full py-4 border-[3px] border-[#b0b0b0] rounded-[28px] text-[26px] font-normal cursor-pointer transition-all duration-200 active:scale-[0.98] ${
              isSleeping 
                ? 'bg-red-50 text-red-600 border-red-300' 
                : 'bg-[#f5f5f5] text-black'
            }`}
          >
            {isSleeping ? 'stop sleep' : 'start sleep'}
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="w-full py-4 border-[3px] border-[#b0b0b0] rounded-[28px] bg-[#f5f5f5] text-[26px] font-normal text-black cursor-pointer transition-all duration-200 active:scale-[0.98]"
          >
            Log
          </button>
        </div>

        {/* Bottom Cards Row */}
        <div className="flex gap-2.5">
          {/* Debt Card */}
          <div className="flex-[1.2] bg-[#e8e8e8] rounded-[24px] p-4 px-[18px]">
            <div className="text-[32px] font-normal text-black mb-1">Dept</div>
            <div className="flex items-baseline gap-px">
              <span className="text-[64px] font-medium text-[#555] leading-none tracking-[-3px]">
                {sleepDebt.hours}
              </span>
              <span className="text-xl font-medium text-black">h</span>
              <span className="text-[64px] font-medium text-[#555] leading-none tracking-[-3px]">
                {formatTimeUnit(sleepDebt.minutes)}
              </span>
              <span className="text-xl font-medium text-black">min</span>
            </div>
          </div>

          {/* Calendar Card */}
          <div className="flex-1 bg-[#e8e8e8] rounded-[24px] p-4 px-[18px] relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xl font-normal text-black">Calender</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <div className="text-[72px] font-bold text-[#555] leading-[0.9] tracking-[-4px] mt-2">
              {nextDayCode}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="w-10 h-10 bg-[#c5d4e8] rounded-full opacity-60" />
          <button className="w-10 h-10 border-[3px] border-[#b0b0b0] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-90">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-[320px]">
            <h3 className="text-2xl font-bold text-black mb-4">Add Sleep Log</h3>
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="text-sm text-gray-500 block mb-1">Hours</label>
                <input
                  type="number"
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)}
                  placeholder="0"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-2xl text-center"
                  min="0"
                  max="24"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-500 block mb-1">Minutes</label>
                <input
                  type="number"
                  value={logMinutes}
                  onChange={(e) => setLogMinutes(e.target.value)}
                  placeholder="0"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-2xl text-center"
                  min="0"
                  max="59"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLogModal(false)}
                className="flex-1 py-3 border-2 border-gray-300 rounded-xl text-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLog}
                className="flex-1 py-3 bg-black text-white rounded-xl text-lg font-medium"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs List (collapsible) */}
      {logs.length > 0 && (
        <div className="mt-4 bg-white/10 rounded-[24px] p-4">
          <h4 className="text-white text-lg font-medium mb-2">Recent Logs</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {logs.slice(-5).map((log) => (
              <div key={log.id} className="bg-white/20 rounded-xl p-3 flex justify-between items-center">
                <span className="text-white text-sm">
                  {log.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-white font-medium">{log.duration}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}