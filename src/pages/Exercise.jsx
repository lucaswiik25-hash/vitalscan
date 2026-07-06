import React, { useMemo, useState } from "react";

const GOAL_KCAL = 850;
const RING_CIRCUMFERENCE = 704;

const iconPaths = {
  logo: <path d="M12 2 4 6.2l5.3 3.1L4 12.5 12 22l8-9.5-5.3-3.2L20 6.2 12 2Z" />,
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  weights: (
    <>
      <path d="M6.5 6.5v11M17.5 6.5v11M3 10v4M21 10v4M6.5 12h11" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 4-4 3 3 5-7" />
    </>
  ),
  settings: (
    <>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  back: <path d="m15 18-6-6 6-6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  calendar: (
    <>
      <path d="M8 3v3M16 3v3M4 9h16" />
      <path d="M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M7 17 17 7M8 7h9v9" />,
  run: (
    <>
      <path d="m13 4 2 2 2-2" />
      <path d="M11 7 8 12l4 2 3 6" />
      <path d="m6 20 3-5" />
      <path d="m14 10 4 2" />
    </>
  ),
  walk: (
    <>
      <path d="M13 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
      <path d="m10 8-2 5 3 2 1 5" />
      <path d="m7 20 2-5" />
      <path d="m12 10 4 2" />
    </>
  ),
  cycle: (
    <>
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="17" r="3" />
      <path d="m8 17 4-7 3 7" />
      <path d="M12 10h4l2-3" />
      <path d="M10 7h3" />
    </>
  ),
};

function Icon({ name, className = "h-5 w-5", filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

const quickAdds = [
  { name: "Run", meta: "25 min - Outdoor", kcal: 245, icon: "run" },
  { name: "Walk", meta: "35 min - Easy pace", kcal: 132, icon: "walk" },
  { name: "Weights", meta: "40 min - Strength", kcal: 210, icon: "weights" },
  { name: "Cycle", meta: "30 min - Cardio", kcal: 188, icon: "cycle" },
];

const startingLogs = [
  { name: "Morning run", meta: "07:20 - 4.8 km", kcal: 245, icon: "run" },
  { name: "Lunch walk", meta: "12:35 - easy pace", kcal: 132, icon: "walk" },
  { name: "Weights", meta: "17:45 - upper body", kcal: 210, icon: "weights" },
  { name: "Cycle", meta: "19:10 - light cardio", kcal: 55, icon: "cycle" },
];

function GlassButton({ children, className = "", dark = false }) {
  return (
    <button
      className={[
        "inline-flex h-[46px] items-center gap-2 rounded-full px-4 text-[15px] font-[760]",
        "transition duration-200 active:scale-95",
        dark
          ? "border border-white/10 bg-[#111318] text-white"
          : "border border-slate-900/10 bg-white/60 text-[#151922]",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function RailButton({ icon, active = false, label }) {
  return (
    <button
      aria-label={label}
      className={[
        "grid h-14 w-14 place-items-center rounded-[20px] border shadow-[0_14px_40px_rgba(80,99,128,0.14)]",
        "backdrop-blur-[26px] transition duration-200 active:scale-95 max-md:h-[46px] max-md:w-[46px] max-md:rounded-[17px]",
        active
          ? "border-white/20 bg-[#111318] text-white shadow-[0_18px_42px_rgba(17,19,24,0.24)]"
          : "border-white/45 bg-[#f4f8ff]/45 text-[#171d27]",
      ].join(" ")}
    >
      <Icon name={icon} className="h-[22px] w-[22px]" />
    </button>
  );
}

function LogRow({ item }) {
  return (
    <div className="grid min-h-[74px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 rounded-3xl border border-white/50 bg-white/45 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.76)] animate-[rowIn_.42s_cubic-bezier(.2,.8,.2,1)_both] max-md:grid-cols-[auto_minmax(0,1fr)]">
      <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#111318] text-white">
        <Icon name={item.icon} className="h-[23px] w-[23px]" />
      </div>
      <div className="min-w-0">
        <strong className="block truncate text-lg font-[760] leading-tight">{item.name}</strong>
        <span className="mt-1 block text-sm font-semibold text-[#697386]">{item.meta}</span>
      </div>
      <div className="whitespace-nowrap text-lg font-extrabold max-md:col-start-2">{item.kcal} kcal</div>
    </div>
  );
}

export default function ExercisePage() {
  const [burn, setBurn] = useState(642);
  const [logs, setLogs] = useState(startingLogs);
  const [note, setNote] = useState("Tap a tile to add it to today's log.");

  const progress = Math.min(Math.round((burn / GOAL_KCAL) * 100), 100);
  const remaining = Math.max(GOAL_KCAL - burn, 0);
  const ringOffset = useMemo(() => {
    return RING_CIRCUMFERENCE - RING_CIRCUMFERENCE * Math.min(burn / GOAL_KCAL, 1);
  }, [burn]);

  function addExercise(item) {
    setBurn((current) => current + item.kcal);
    setLogs((current) => [
      {
        name: item.name,
        meta: `Just now - ${item.meta}`,
        kcal: item.kcal,
        icon: item.icon,
      },
      ...current,
    ]);
    setNote(`${item.name} logged instantly.`);
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_28%_4%,rgba(255,255,255,0.88),transparent_22rem),radial-gradient(circle_at_84%_7%,rgba(93,143,255,0.34),transparent_26rem),linear-gradient(135deg,#dfe9f8_0%,#cbd9ee_48%,#e8eef2_100%)] text-[#10141b]"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', Inter, Arial, sans-serif" }}
    >
      <style>{`
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(14px) scale(.99); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 460; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      <main className="relative mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-[86px_minmax(0,1fr)] gap-6 px-7 py-[22px] pb-8 max-md:grid-cols-1 max-md:gap-3 max-md:px-3 max-md:py-3">
        <aside className="sticky top-[22px] flex h-[calc(100vh-44px)] flex-col items-center justify-between py-1.5 max-md:top-2 max-md:z-10 max-md:h-auto max-md:flex-row max-md:justify-center max-md:gap-2 max-md:rounded-[28px] max-md:border max-md:border-white/50 max-md:bg-[#ecf3fc]/60 max-md:p-2 max-md:backdrop-blur-2xl">
          <div className="grid justify-items-center gap-3 max-md:flex max-md:gap-2">
            <div className="grid h-14 w-14 place-items-center rounded-[18px] border border-white/55 bg-[#f4f8ff]/45 text-[#111318] shadow-[0_14px_40px_rgba(80,99,128,0.14)] backdrop-blur-[26px] max-md:h-[46px] max-md:w-[46px] max-md:rounded-[17px]">
              <Icon name="logo" filled className="h-7 w-7" />
            </div>
            <RailButton icon="grid" label="Dashboard" />
            <RailButton icon="weights" label="Exercise" active />
            <RailButton icon="chart" label="Progress" />
          </div>
          <div className="grid justify-items-center gap-3 max-md:hidden">
            <RailButton icon="settings" label="Settings" />
          </div>
        </aside>

        <section className="min-w-0">
          <header className="mb-[22px] grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 max-md:grid-cols-1">
            <div className="flex min-w-0 items-center gap-3 max-md:pr-32">
              <button className="grid h-[54px] w-[54px] place-items-center rounded-full border border-white/55 bg-[#f4f8ff]/45 text-[#10141b] shadow-[0_14px_40px_rgba(80,99,128,0.14)] backdrop-blur-[26px] transition active:scale-95">
                <Icon name="back" className="h-[22px] w-[22px]" />
              </button>
              <div className="min-w-0">
                <p className="mb-1 text-[15px] font-bold text-[#697386]">Today, July 6</p>
                <h1 className="text-[clamp(34px,4.5vw,62px)] font-[790] leading-none">Exercise</h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5 max-md:absolute max-md:right-3 max-md:top-[82px]">
              <button className="grid h-[54px] w-[54px] place-items-center rounded-full border border-white/55 bg-[#f4f8ff]/45 text-[#111722] shadow-[0_14px_40px_rgba(80,99,128,0.14)] backdrop-blur-[26px] transition active:scale-95">
                <Icon name="search" className="h-[22px] w-[22px]" />
              </button>
              <button className="relative grid h-[54px] w-[54px] place-items-center rounded-full border border-white/55 bg-[#f4f8ff]/45 text-[#111722] shadow-[0_14px_40px_rgba(80,99,128,0.14)] backdrop-blur-[26px] transition active:scale-95">
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#ff7d88] shadow-[0_0_0_3px_rgba(255,255,255,0.78)]" />
                <Icon name="bell" className="h-[22px] w-[22px]" />
              </button>
              <div className="h-[54px] w-[54px] rounded-full border border-white/55 bg-[radial-gradient(circle_at_50%_24%,#ffd3af_0_17%,transparent_18%),linear-gradient(145deg,#162337_0_48%,#7ba5ff_49%_100%)] shadow-[0_14px_40px_rgba(80,99,128,0.14)] backdrop-blur-[26px]" />
            </div>
          </header>

          <section className="mb-[18px] grid grid-cols-[minmax(0,1.08fr)_minmax(320px,.92fr)] gap-[22px] rounded-[42px] border border-white/55 bg-[linear-gradient(145deg,rgba(244,248,255,.72),rgba(225,235,249,.58)),radial-gradient(circle_at_18%_18%,rgba(255,255,255,.88),transparent_18rem)] p-6 shadow-[0_14px_40px_rgba(80,99,128,0.14)] backdrop-blur-[26px] max-xl:grid-cols-1 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none">
            <article className="relative min-h-[480px] overflow-hidden rounded-[34px] border border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,.82),rgba(234,241,251,.6)),radial-gradient(circle_at_82%_26%,rgba(93,143,255,.25),transparent_15rem)] p-[30px] shadow-[0_24px_70px_rgba(76,95,126,0.2)] max-md:min-h-0 max-md:rounded-[28px] max-md:p-[18px]">
              <div className="pointer-events-none absolute -bottom-40 -right-28 h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(93,143,255,.35),transparent_68%)]" />
              <div className="relative z-[1] flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[25px] font-[770] leading-tight max-[430px]:text-[22px]">Daily kcal burn</h2>
                  <p className="mt-2 text-[15px] font-semibold text-[#697386]">Thick progress ring toward today's movement goal</p>
                </div>
                <GlassButton className="max-[430px]:hidden">
                  <Icon name="calendar" className="h-[18px] w-[18px]" />
                  Today
                </GlassButton>
              </div>

              <div className="relative z-[1] grid min-h-[348px] grid-cols-[minmax(240px,390px)_minmax(180px,1fr)] items-center gap-6 pt-[22px] max-md:min-h-0 max-md:grid-cols-1">
                <div className="relative grid aspect-square w-full max-w-[390px] place-items-center drop-shadow-[0_26px_42px_rgba(69,111,195,0.18)] max-md:mx-auto max-md:max-w-[310px]">
                  <svg viewBox="0 0 260 260" className="h-full w-full -rotate-90 overflow-visible" aria-hidden="true">
                    <defs>
                      <linearGradient id="burnGradientReact" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ff7d88" />
                        <stop offset="46%" stopColor="#8977ff" />
                        <stop offset="100%" stopColor="#5d8fff" />
                      </linearGradient>
                    </defs>
                    <circle cx="130" cy="130" r="112" fill="none" stroke="rgba(32,47,74,0.08)" strokeWidth="28" strokeLinecap="round" />
                    <circle
                      cx="130"
                      cy="130"
                      r="112"
                      fill="none"
                      stroke="url(#burnGradientReact)"
                      strokeWidth="28"
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={ringOffset}
                      className="transition-[stroke-dashoffset] duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-[22%] grid place-items-center rounded-full border border-white/70 bg-[#f9fcff]/70 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                    <div>
                      <strong className="block text-[clamp(58px,7vw,86px)] font-extrabold leading-[.82]">{burn.toLocaleString()}</strong>
                      <span className="mt-2.5 block text-[15px] font-bold text-[#697386]">of {GOAL_KCAL} kcal</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  {[
                    ["Goal progress", `${progress}%`],
                    ["Active time", "58 min"],
                    ["Remaining", `${remaining} kcal`],
                  ].map(([label, value], index) => (
                    <div
                      key={label}
                      className="min-h-[98px] rounded-[28px] border border-white/60 bg-white/55 p-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] animate-[rise_.65s_cubic-bezier(.2,.8,.2,1)_both]"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <span className="text-sm font-bold text-[#697386]">{label}</span>
                      <strong className="mt-2 block text-[30px] font-[790] leading-none">{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="relative grid min-h-[480px] grid-rows-[auto_1fr_auto] gap-4 overflow-hidden rounded-[34px] border border-white/15 bg-[linear-gradient(145deg,rgba(36,42,54,.95),rgba(46,59,77,.86)),radial-gradient(circle_at_82%_10%,rgba(116,196,255,.32),transparent_14rem)] p-6 text-white shadow-[0_24px_70px_rgba(76,95,126,0.2)] max-md:min-h-0 max-md:rounded-[28px] max-md:p-[18px]">
              <div className="pointer-events-none absolute -bottom-32 -right-28 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(255,125,136,.24),transparent_68%)]" />
              <div className="relative z-[1] flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[25px] font-[770] leading-tight max-[430px]:text-[22px]">Quick add</h2>
                  <p className="mt-2 text-[15px] font-semibold text-white/65">Instantly log common exercise</p>
                </div>
                <GlassButton dark>
                  <Icon name="plus" className="h-[18px] w-[18px]" />
                  Custom
                </GlassButton>
              </div>

              <div className="relative z-[1] grid grid-cols-2 gap-3 max-[430px]:gap-2">
                {quickAdds.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => addExercise(item)}
                    className="grid min-h-[142px] content-between rounded-[28px] border border-white/15 bg-white/[.09] p-[18px] text-left text-white transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[.14] active:scale-95 max-md:min-h-32 max-md:p-[15px]"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[linear-gradient(145deg,#ffffff,#dce8ff)] text-[#10141b] shadow-[0_16px_32px_rgba(0,0,0,.16)] max-[430px]:h-[42px] max-[430px]:w-[42px] max-[430px]:rounded-2xl">
                      <Icon name={item.icon} className="h-6 w-6" />
                    </div>
                    <div>
                      <strong className="mt-[18px] block text-2xl font-[780] leading-none max-md:text-xl">{item.name}</strong>
                      <span className="mt-2 block text-sm font-semibold text-white/60">+{item.kcal} kcal</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="relative z-[1] text-sm font-bold text-white/65">{note}</div>
            </article>
          </section>

          <section className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-[18px] max-xl:grid-cols-1">
            <article className="rounded-[34px] border border-white/55 bg-[#ecf3fc]/75 p-6 shadow-[0_14px_40px_rgba(80,99,128,0.14)] backdrop-blur-[26px] max-md:rounded-[28px]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[25px] font-[770] leading-tight max-[430px]:text-[22px]">Exercises logged</h2>
                  <p className="mt-2 text-[15px] font-semibold text-[#697386]">{logs.length} activities today</p>
                </div>
                <GlassButton>
                  <Icon name="arrow" className="h-[18px] w-[18px]" />
                  View all
                </GlassButton>
              </div>
              <div className="mt-[18px] grid gap-2.5">
                {logs.map((item, index) => (
                  <LogRow key={`${item.name}-${item.kcal}-${index}`} item={item} />
                ))}
              </div>
            </article>

            <aside className="grid gap-[18px]">
              <article className="relative min-h-[246px] overflow-hidden rounded-[34px] border border-white/50 bg-[linear-gradient(155deg,#4d76ff_0%,#72c8ff_64%,rgba(255,255,255,.55)_100%)] p-[22px] text-white shadow-[0_14px_40px_rgba(80,99,128,0.12)] max-md:rounded-[28px]">
                <h3 className="text-[23px] font-[760]">Burn trend</h3>
                <p className="mt-2 font-semibold text-white/75">Higher than your 7-day average</p>
                <div className="mt-6 text-[58px] font-[790] leading-none">+18%</div>
                <svg viewBox="0 0 300 112" className="absolute bottom-6 left-[22px] right-[22px] h-28 w-[calc(100%-44px)] overflow-visible">
                  <path
                    d="M4 90 C38 72 54 28 88 54 S139 91 162 47 205 52 226 22 260 25 296 10"
                    fill="none"
                    stroke="rgba(255,255,255,.86)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="460"
                    className="animate-[drawLine_1.1s_cubic-bezier(.2,.8,.2,1)_both]"
                  />
                  <circle cx="226" cy="22" r="7" fill="none" stroke="rgba(255,255,255,.95)" strokeWidth="4" />
                </svg>
              </article>

              <article className="overflow-hidden rounded-[34px] border border-white/50 bg-[#f4f8ff]/60 p-[22px] shadow-[0_14px_40px_rgba(80,99,128,0.12)] max-md:rounded-[28px]">
                <h3 className="text-[23px] font-[760]">Movement split</h3>
                <p className="mt-2 font-semibold text-[#697386]">Where today's burn came from</p>
                <div className="mt-[18px] grid grid-cols-2 gap-3">
                  <div className="rounded-3xl border border-white/50 bg-white/45 p-4">
                    <span className="text-[13px] font-bold text-[#697386]">Cardio</span>
                    <strong className="mt-2 block text-[26px] font-[790]">62%</strong>
                  </div>
                  <div className="rounded-3xl border border-white/50 bg-white/45 p-4">
                    <span className="text-[13px] font-bold text-[#697386]">Strength</span>
                    <strong className="mt-2 block text-[26px] font-[790]">38%</strong>
                  </div>
                </div>
              </article>
            </aside>
          </section>
        </section>
      </main>
    </div>
  );
}
