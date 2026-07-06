import React from "react";

const week = [
  { day: "Mon", amount: 1.8, percent: 72 },
  { day: "Tue", amount: 2.1, percent: 84 },
  { day: "Wed", amount: 1.6, percent: 64 },
  { day: "Thu", amount: 2.4, percent: 96 },
  { day: "Fri", amount: 2.0, percent: 80 },
  { day: "Sat", amount: 1.3, percent: 52 },
  { day: "Sun", amount: 2.25, percent: 90, active: true },
];

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
        "hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-sky-200/70",
        active
          ? "bg-white/82 text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,.95),0_16px_36px_rgba(56,189,248,.14)]"
          : "bg-white/48 text-zinc-700 shadow-[inset_0_1px_0_rgba(255,255,255,.84),0_14px_34px_rgba(24,24,27,.08)] ring-1 ring-white/70 backdrop-blur-2xl",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

function WaterDrop({ className = "" }) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <div className="absolute inset-0 rounded-[58%_42%_62%_38%/60%_42%_58%_40%] bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,.95),rgba(255,255,255,.24)_20%,transparent_38%),linear-gradient(145deg,#8ee7ff,#80b6ff_52%,#b7a4ff)] shadow-[0_24px_54px_rgba(56,189,248,.26)]" />
      <div className="absolute bottom-6 left-1/2 h-16 w-[78%] -translate-x-1/2 rounded-[50%] bg-white/28 blur-md" />
    </div>
  );
}

export default function WaterTrackingPage() {
  const todayAmount = 2.25;
  const dailyGoal = 2.5;
  const progress = Math.round((todayAmount / dailyGoal) * 100);

  return (
    <div
      className="min-h-screen w-full bg-[#f5f8ff] px-3 py-4 text-zinc-950"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', Inter, system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes waterRise {
          from { opacity: 0; transform: translateY(16px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes liquidFloat {
          50% { transform: translate3d(-16px, 18px, 0) scale(1.05); }
        }
        @keyframes waveDrift {
          from { transform: translateX(-42px); }
          to { transform: translateX(0); }
        }
        @keyframes fillUp {
          from { height: 0; }
          to { height: var(--fill); }
        }
        .water-rise { animation: waterRise .65s cubic-bezier(.2,.9,.2,1) both; }
        .liquid-float { animation: liquidFloat 8s ease-in-out infinite; }
        .wave-drift { animation: waveDrift 3.4s ease-in-out infinite alternate; }
        .fill-up { animation: fillUp .9s cubic-bezier(.2,.9,.2,1) both; }
      `}</style>

      <main className="relative mx-auto min-h-[900px] w-full max-w-[430px] overflow-hidden rounded-[44px] bg-[linear-gradient(150deg,rgba(255,255,255,.97),rgba(235,248,255,.9)_45%,rgba(244,241,255,.94))] p-[18px] shadow-[0_28px_90px_rgba(74,118,150,.22)] ring-1 ring-white">
        <div className="liquid-float pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(125,211,252,.48),rgba(183,169,255,.28)_48%,transparent_72%)] blur-sm" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-[42%] bg-[linear-gradient(135deg,rgba(125,231,255,.28),rgba(155,140,255,.16))] blur-2xl" />

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
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/64 shadow-[inset_0_1px_0_rgba(255,255,255,.96),0_12px_30px_rgba(56,189,248,.13)] ring-1 ring-white/80 backdrop-blur-2xl">
              <WaterDrop className="h-7 w-7" />
            </div>
            <div>
              <p className="m-0 text-[13px] font-semibold text-zinc-500">Daily hydration</p>
              <h1 className="m-0 text-[26px] font-extrabold leading-none tracking-normal text-zinc-950">Water Tracker</h1>
            </div>
          </div>
          <button className="grid h-11 w-11 place-items-center rounded-full bg-white/58 text-zinc-800 shadow-[inset_0_1px_0_rgba(255,255,255,.95),0_16px_34px_rgba(56,189,248,.12)] ring-1 ring-white/80 backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-sky-200/70" aria-label="Open water settings">
            <Icon>
              <path d="M12 3v2.2M12 18.8V21M4.2 12H2M22 12h-2.2M6.5 6.5 5 5M19 19l-1.5-1.5M17.5 6.5 19 5M5 19l1.5-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
            </Icon>
          </button>
        </header>

        <section className="water-rise relative z-10 mt-5 overflow-hidden rounded-[34px] bg-white/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.96),0_24px_65px_rgba(74,118,150,.16)] ring-1 ring-white/80 backdrop-blur-3xl">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[conic-gradient(from_210deg,rgba(125,211,252,0),rgba(125,211,252,.72),rgba(183,169,255,.56),rgba(125,211,252,0))] opacity-80" />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-zinc-600">Today's water intake</span>
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/62 px-3 text-sm font-bold text-zinc-700 shadow-inner ring-1 ring-white/80 backdrop-blur-xl">
              <Icon className="h-4 w-4 text-sky-500">
                <path d="M12 3.2s6.2 6.8 6.2 11.2a6.2 6.2 0 1 1-12.4 0C5.8 10 12 3.2 12 3.2Z" fill="currentColor" />
              </Icon>
              {progress}% complete
            </span>
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-[1fr_118px] items-center gap-4 max-[380px]:grid-cols-1">
            <div>
              <div className="flex items-end gap-2 whitespace-nowrap">
                <strong className="text-[78px] font-black leading-[.9] tracking-normal text-zinc-950 tabular-nums max-[380px]:text-[68px]">
                  {todayAmount}L
                </strong>
                <span className="pb-2.5 text-lg font-bold text-zinc-500">/ {dailyGoal}L</span>
              </div>
              <p className="m-0 mt-3 text-[15px] leading-relaxed text-zinc-600">
                You are 250 ml away from today's daily water goal.
              </p>
            </div>

            <div className="relative mx-auto h-[154px] w-[104px] overflow-hidden rounded-[34px] bg-white/44 shadow-inner ring-1 ring-zinc-900/5">
              <div
                className="fill-up absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-[34px] bg-[linear-gradient(180deg,#8ee7ff,#5bbcff_58%,#8f8cff)]"
                style={{ "--fill": `${progress}%` }}
              >
                <svg className="wave-drift absolute -top-4 left-0 h-9 w-[148px]" viewBox="0 0 148 36" preserveAspectRatio="none">
                  <path d="M0 18 C18 3, 37 33, 56 18 S93 3, 112 18 S136 33, 148 18 V36 H0Z" fill="rgba(255,255,255,.58)" />
                </svg>
              </div>
              <div className="absolute inset-x-4 top-4 h-8 rounded-full bg-white/36 blur-md" />
              <span className="absolute inset-0 grid place-items-center text-xl font-black text-white drop-shadow-sm">{progress}%</span>
            </div>
          </div>
        </section>

        <section className="water-rise relative z-10 mt-3 rounded-[30px] bg-white/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.96),0_18px_48px_rgba(74,118,150,.14)] ring-1 ring-white/80 backdrop-blur-3xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-xl font-extrabold leading-none tracking-normal">7 Day Overview</h2>
              <p className="m-0 mt-1 text-[13px] font-semibold text-zinc-500">Daily intake compared to your 2.5L goal</p>
            </div>
            <span className="rounded-full bg-white/58 px-3 py-2 text-sm font-bold text-zinc-600 ring-1 ring-white/80">This week</span>
          </div>

          <div className="mt-5 grid h-[210px] grid-cols-7 items-end gap-2">
            {week.map((item, index) => (
              <div key={item.day} className="flex h-full min-w-0 flex-col items-center justify-end gap-2">
                <div className="relative h-[150px] w-full overflow-hidden rounded-full bg-zinc-950/5 shadow-inner">
                  <div
                    className={[
                      "fill-up absolute bottom-0 left-0 right-0 rounded-full",
                      item.active
                        ? "bg-[linear-gradient(180deg,#65dfff,#5db7ff_55%,#958bff)] shadow-[0_10px_22px_rgba(56,189,248,.24)]"
                        : "bg-[linear-gradient(180deg,#c7f4ff,#96d7ff_58%,#c1b5ff)]",
                    ].join(" ")}
                    style={{ "--fill": `${item.percent}%`, animationDelay: `${index * 65}ms` }}
                  />
                  {item.active && <span className="absolute left-1/2 top-3 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white shadow" />}
                </div>
                <div className="text-center">
                  <span className="block text-[11px] font-black text-zinc-900">{item.day}</span>
                  <span className="block text-[10px] font-bold text-zinc-500">{item.amount}L</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative z-10 mt-3 grid grid-cols-2 gap-3">
          <article className="water-rise rounded-[28px] bg-white/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.96),0_18px_48px_rgba(74,118,150,.13)] ring-1 ring-white/80 backdrop-blur-3xl">
            <div className="flex items-center justify-between">
              <h2 className="m-0 text-lg font-extrabold leading-none tracking-normal">Next Sip</h2>
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/54 text-sky-600 ring-1 ring-white/80">
                <Icon>
                  <path d="M12 7v5l3.2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                </Icon>
              </span>
            </div>
            <p className="m-0 mt-5 text-4xl font-black leading-none tabular-nums">14m</p>
            <p className="m-0 mt-3 text-[13px] leading-snug text-zinc-600">Recommended 180 ml to stay on pace.</p>
          </article>

          <article className="water-rise rounded-[28px] bg-white/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.96),0_18px_48px_rgba(74,118,150,.13)] ring-1 ring-white/80 backdrop-blur-3xl [animation-delay:70ms]">
            <div className="flex items-center justify-between">
              <h2 className="m-0 text-lg font-extrabold leading-none tracking-normal">Streak</h2>
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/54 text-violet-600 ring-1 ring-white/80">
                <Icon>
                  <path d="M12 3.6 14.4 9l5.6.6-4.2 3.8 1.2 5.6-5-2.9-5 2.9 1.2-5.6L4 9.6 9.6 9 12 3.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </Icon>
              </span>
            </div>
            <p className="m-0 mt-5 text-4xl font-black leading-none tabular-nums">5 days</p>
            <p className="m-0 mt-3 text-[13px] leading-snug text-zinc-600">Keep the goal hit before 21:00.</p>
          </article>
        </section>

        <nav className="relative z-10 mt-3 grid grid-cols-3 gap-2.5 rounded-[30px] bg-white/64 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.96),0_20px_55px_rgba(74,118,150,.16)] ring-1 ring-white/80 backdrop-blur-3xl" aria-label="Water page navigation">
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
