import React from "react";

const stages = [
  { label: "Light", value: "3h 06m" },
  { label: "Deep", value: "1h 42m" },
  { label: "REM", value: "1h 28m" },
  { label: "Awake", value: "14m" },
];

const depthBars = ["h-8", "h-14", "h-10", "h-20", "h-12", "h-16", "h-9"];

function Icon({ children, className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

function GlassButton({ children, className = "", active = false, ...props }) {
  return (
    <button
      className={[
        "group flex items-center justify-center gap-2 rounded-[22px] font-semibold tracking-normal",
        "transition-all duration-300 ease-out active:scale-[0.98]",
        "hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-violet-200/70",
        active
          ? "bg-white/80 text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_16px_36px_rgba(109,91,255,.14)]"
          : "bg-white/48 text-zinc-700 shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_14px_34px_rgba(24,24,27,.08)] ring-1 ring-white/70 backdrop-blur-2xl",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

export default function SleepTrackingPage() {
  return (
    <div
      className="min-h-screen w-full bg-[#f6f5fb] px-3 py-4 text-zinc-950"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', Inter, system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes sleepRise {
          from { opacity: 0; transform: translateY(16px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes softFloat {
          50% { transform: translate3d(-18px, 18px, 0) scale(1.05); }
        }
        @keyframes barIn {
          from { opacity: 0; transform: scaleY(.55); }
          to { opacity: 1; transform: scaleY(1); }
        }
        .sleep-rise { animation: sleepRise .65s cubic-bezier(.2,.9,.2,1) both; }
        .soft-float { animation: softFloat 8s ease-in-out infinite; }
        .depth-bar { animation: barIn .62s cubic-bezier(.2,.9,.2,1) forwards; transform-origin: bottom; }
      `}</style>

      <main className="relative mx-auto min-h-[900px] w-full max-w-[430px] overflow-hidden rounded-[44px] bg-[linear-gradient(150deg,rgba(255,255,255,.96),rgba(243,240,255,.88)_48%,rgba(235,246,250,.92))] p-[18px] shadow-[0_28px_90px_rgba(111,105,140,.25)] ring-1 ring-white">
        <div className="soft-float pointer-events-none absolute -right-28 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(183,169,255,.62),rgba(244,197,255,.30)_48%,transparent_72%)] blur-sm" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-[42%] bg-[linear-gradient(135deg,rgba(154,236,220,.32),rgba(155,140,255,.18))] blur-2xl" />

        <div className="relative z-10 flex h-7 items-center justify-between px-1.5 text-sm font-bold text-zinc-900">
          <span>9:41</span>
          <div className="flex items-center gap-2">
            <div className="grid h-3 w-5 grid-cols-4 items-end gap-0.5">
              <span className="h-1 rounded-full bg-zinc-900/45" />
              <span className="h-1.5 rounded-full bg-zinc-900/60" />
              <span className="h-2 rounded-full bg-zinc-900/75" />
              <span className="h-3 rounded-full bg-zinc-900" />
            </div>
            <Icon className="h-4 w-4 text-zinc-900">
              <path d="M1 8c5.2-4.2 11.8-4.2 17 0M4.4 11.2c3.1-2.3 7.1-2.3 10.2 0M7.7 14.2c1.1-.7 2.5-.7 3.6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </Icon>
            <div className="relative h-3 w-6 rounded border border-zinc-900/80 after:absolute after:-right-1 after:top-1 after:h-1.5 after:w-0.5 after:rounded-r after:bg-zinc-900/70">
              <div className="m-0.5 h-1.5 w-3.5 rounded-sm bg-zinc-900" />
            </div>
          </div>
        </div>

        <header className="relative z-10 mt-5 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_12px_30px_rgba(111,105,140,.14)] ring-1 ring-white/80 backdrop-blur-2xl">
              <div className="h-6 w-6 rotate-[-35deg] rounded-[9px_16px_9px_16px] bg-[linear-gradient(135deg,#9282ff,#f2bfff)] shadow-[8px_0_0_rgba(112,102,255,.82),-4px_5px_0_rgba(255,255,255,.65)]" />
            </div>
            <div>
              <p className="m-0 text-[13px] font-semibold text-zinc-500">Tonight's recovery</p>
              <h1 className="m-0 text-[26px] font-extrabold leading-none tracking-normal text-zinc-950">Sleep Tracker</h1>
            </div>
          </div>
          <button className="grid h-11 w-11 place-items-center rounded-full bg-white/58 text-zinc-800 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_16px_34px_rgba(111,105,140,.14)] ring-1 ring-white/80 backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-violet-200/70" aria-label="Open sleep settings">
            <Icon>
              <path d="M12 3v2.2M12 18.8V21M4.2 12H2M22 12h-2.2M6.5 6.5 5 5M19 19l-1.5-1.5M17.5 6.5 19 5M5 19l1.5-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
            </Icon>
          </button>
        </header>

        <section className="sleep-rise relative z-10 mt-5 overflow-hidden rounded-[34px] bg-white/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.92),0_24px_65px_rgba(111,105,140,.18)] ring-1 ring-white/80 backdrop-blur-3xl">
          <div className="pointer-events-none absolute -right-16 -top-14 h-56 w-56 rounded-full bg-[conic-gradient(from_210deg,rgba(155,140,255,0),rgba(155,140,255,.72),rgba(242,194,255,.62),rgba(155,140,255,0))] opacity-80" />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-zinc-600">Exact sleep duration</span>
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/62 px-3 text-sm font-bold text-zinc-700 shadow-inner ring-1 ring-white/80 backdrop-blur-xl">
              <Icon className="h-4 w-4 text-violet-500">
                <path d="M19 15.2A7.5 7.5 0 0 1 8.8 5 8.5 8.5 0 1 0 19 15.2Z" fill="currentColor" />
              </Icon>
              92% quality
            </span>
          </div>

          <div className="relative z-10 mt-4 flex items-end gap-2 whitespace-nowrap">
            <strong className="text-[88px] font-black leading-[.9] tracking-normal text-zinc-950 tabular-nums max-[380px]:text-[72px]">7:42</strong>
            <span className="pb-2.5 text-lg font-bold text-zinc-500">slept</span>
          </div>
          <p className="relative z-10 m-0 mt-3 text-[15px] leading-relaxed text-zinc-600">
            You slept exactly 7 hours and 42 minutes, from 23:18 to 07:00.
          </p>

          <div className="relative z-10 mt-5 h-20 overflow-hidden rounded-3xl bg-white/45 shadow-inner ring-1 ring-zinc-900/5">
            <svg className="h-full w-full" viewBox="0 0 390 82" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sleepWave" x1="0" x2="1">
                  <stop stopColor="#7de1cb" />
                  <stop offset=".52" stopColor="#9b8cff" />
                  <stop offset="1" stopColor="#e99cff" />
                </linearGradient>
              </defs>
              <path d="M0 53 C35 22, 61 78, 96 45 S152 26, 185 48 S236 75, 268 42 S330 18, 390 50" fill="none" stroke="url(#sleepWave)" strokeWidth="5" strokeLinecap="round" />
              <path d="M0 70 C36 37, 67 82, 104 56 S156 42, 196 61 S251 77, 291 50 S344 37, 390 57" fill="none" stroke="rgba(24,24,27,.14)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </section>

        <div className="relative z-10 mt-3 grid grid-cols-2 gap-3">
          <GlassButton className="h-[58px] bg-zinc-950 text-white shadow-[0_18px_38px_rgba(24,24,27,.18)] ring-0">
            <Icon className="h-5 w-5">
              <path d="M8 5v14l11-7L8 5Z" fill="currentColor" />
            </Icon>
            Start Sleep
          </GlassButton>
          <GlassButton className="h-[58px]">
            <Icon className="h-5 w-5">
              <path d="M7 3v3M17 3v3M4.5 9.5h15M6.8 5h10.4a2.3 2.3 0 0 1 2.3 2.3v10.4a2.3 2.3 0 0 1-2.3 2.3H6.8a2.3 2.3 0 0 1-2.3-2.3V7.3A2.3 2.3 0 0 1 6.8 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </Icon>
            Log Sleep
          </GlassButton>
        </div>

        <section className="relative z-10 mt-3 grid grid-cols-[1.05fr_.95fr] gap-3 max-[380px]:grid-cols-1">
          <article className="sleep-rise rounded-[28px] bg-white/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_18px_48px_rgba(111,105,140,.15)] ring-1 ring-white/80 backdrop-blur-3xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="m-0 text-xl font-extrabold leading-none tracking-normal">Sleep Debt</h2>
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/54 text-zinc-600 ring-1 ring-white/80">
                <Icon className="h-5 w-5">
                  <path d="M12 7v5l3.2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                </Icon>
              </span>
            </div>
            <div className="mt-5 flex items-baseline gap-1.5">
              <strong className="text-5xl font-black leading-none tabular-nums">2:18</strong>
              <span className="font-bold text-zinc-500">debt</span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-950/8">
              <div className="h-full w-[42%] rounded-full bg-[linear-gradient(90deg,#88ead5,#ffe58f,#b9a8ff)]" />
            </div>
            <p className="m-0 mt-4 text-[13px] leading-snug text-zinc-600">
              Recover with a 22:45 bedtime for the next two nights.
            </p>
          </article>

          <article className="sleep-rise rounded-[28px] bg-white/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_18px_48px_rgba(111,105,140,.15)] ring-1 ring-white/80 backdrop-blur-3xl [animation-delay:70ms]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="m-0 text-xl font-extrabold leading-none tracking-normal">Sleep Depth</h2>
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/54 text-zinc-600 ring-1 ring-white/80">
                <Icon className="h-5 w-5">
                  <path d="M5 17c2.2-5.8 4.5-8.8 7-8.8s4.8 3 7 8.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M8.2 17c1.1-3.2 2.4-4.8 3.8-4.8s2.7 1.6 3.8 4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".58" />
                </Icon>
              </span>
            </div>
            <div className="mt-4 flex h-24 items-end gap-2">
              {depthBars.map((height, index) => (
                <span
                  key={height + index}
                  className={`depth-bar flex-1 rounded-full bg-[linear-gradient(180deg,#b9a8ff,#8e7cff)] opacity-0 shadow-[0_8px_18px_rgba(142,124,255,.22)] ${height}`}
                  style={{ animationDelay: `${90 + index * 50}ms` }}
                />
              ))}
            </div>
            <p className="m-0 mt-2 text-[13px] leading-snug text-zinc-600">Deep sleep peaked around 03:10.</p>
          </article>

          <article className="sleep-rise col-span-full rounded-[28px] bg-white/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_18px_48px_rgba(111,105,140,.15)] ring-1 ring-white/80 backdrop-blur-3xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="m-0 text-xl font-extrabold leading-none tracking-normal">Sleep Stage Timeline</h2>
              <span className="rounded-full bg-white/54 px-3 py-2 text-sm font-semibold text-zinc-600 ring-1 ring-white/80">23:18 - 07:00</span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 max-[380px]:grid-cols-2">
              {stages.map((stage) => (
                <div key={stage.label} className="min-h-[62px] rounded-2xl bg-white/45 p-3 shadow-inner ring-1 ring-zinc-900/5">
                  <strong className="block text-[15px] font-extrabold leading-none">{stage.label}</strong>
                  <span className="mt-1.5 block text-xs font-bold text-zinc-500">{stage.value}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <nav className="relative z-10 mt-3 grid grid-cols-3 gap-2.5 rounded-[30px] bg-white/64 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_20px_55px_rgba(111,105,140,.18)] ring-1 ring-white/80 backdrop-blur-3xl" aria-label="Sleep page navigation">
          <GlassButton active className="h-[58px] flex-col gap-1 text-[11px]">
            <Icon>
              <path d="M4 10.7 12 4l8 6.7v7.1a2.2 2.2 0 0 1-2.2 2.2H6.2A2.2 2.2 0 0 1 4 17.8v-7.1Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
              <path d="M9.2 20v-6h5.6v6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            </Icon>
            Home
          </GlassButton>
          <GlassButton className="h-[58px] flex-col gap-1 text-[11px]">
            <Icon>
              <path d="M12 3.5 13.7 9l5.6 1.7-5.6 1.7L12 18l-1.7-5.6-5.6-1.7L10.3 9 12 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="m18 15 .7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7L18 15Z" fill="currentColor" />
            </Icon>
            AI Analysis
          </GlassButton>
          <GlassButton className="h-[58px] flex-col gap-1 text-[11px]">
            <Icon>
              <path d="M7 3.5v3M17 3.5v3M4.5 9.5h15M7 5h10a2.5 2.5 0 0 1 2.5 2.5V17A2.5 2.5 0 0 1 17 19.5H7A2.5 2.5 0 0 1 4.5 17V7.5A2.5 2.5 0 0 1 7 5Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            </Icon>
            Calendar
          </GlassButton>
        </nav>
      </main>
    </div>
  );
}
 