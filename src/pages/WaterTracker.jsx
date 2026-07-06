import React from "react";

const week = [
  { day: "Mon", amount: "1.8L", percent: 72 },
  { day: "Tue", amount: "2.1L", percent: 84 },
  { day: "Wed", amount: "1.6L", percent: 64 },
  { day: "Thu", amount: "2.4L", percent: 96 },
  { day: "Fri", amount: "2.0L", percent: 80 },
  { day: "Sat", amount: "1.3L", percent: 52 },
  { day: "Sun", amount: "2.25L", percent: 90, active: true },
];

function Icon({ children, className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

function NavButton({ children, active = false, className = "", ...props }) {
  return (
    <button
      className={[
        "flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold",
        "transition-all duration-300 ease-out active:scale-[0.98]",
        "hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-sky-200/70",
        active
          ? "bg-zinc-950 text-white shadow-[0_18px_34px_rgba(24,24,27,.18)]"
          : "bg-white/58 text-zinc-700 shadow-[inset_0_1px_0_rgba(255,255,255,.94),0_12px_30px_rgba(80,105,130,.09)] ring-1 ring-white/80 backdrop-blur-2xl",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

function GlassCard({ children, className = "" }) {
  return (
    <section
      className={[
        "water-rise rounded-[32px] bg-white/62 p-5",
        "shadow-[inset_0_1px_0_rgba(255,255,255,.96),0_22px_55px_rgba(86,120,150,.14)]",
        "ring-1 ring-white/80 backdrop-blur-3xl",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

function WaterMark({ className = "" }) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <div className="absolute inset-0 rotate-[-24deg] rounded-[38%_62%_42%_58%/48%_38%_62%_52%] bg-[linear-gradient(135deg,#79dfff,#8ea0ff)] shadow-[0_24px_60px_rgba(56,189,248,.24)]" />
      <div className="absolute left-[22%] top-[12%] h-[62%] w-[62%] rounded-full bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,.82),rgba(255,255,255,.18)_48%,transparent_70%)]" />
      <div className="absolute -right-[7%] bottom-[10%] h-[58%] w-[58%] rounded-full bg-[linear-gradient(135deg,rgba(183,169,255,.86),rgba(255,255,255,.22))]" />
    </div>
  );
}

export default function WaterTrackingPage() {
  const todayAmount = "2.25L";
  const dailyGoal = "2.5L";
  const progress = 90;

  return (
    <div
      className="min-h-screen w-full overflow-hidden bg-[#eef4f8] p-4 text-zinc-950 sm:p-6"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', Inter, system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes waterRise {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes liquidFloat {
          50% { transform: translate3d(-18px, 16px, 0) scale(1.045); }
        }
        @keyframes waveDrift {
          from { transform: translateX(-48px); }
          to { transform: translateX(0); }
        }
        @keyframes fillUp {
          from { height: 0; }
          to { height: var(--fill); }
        }
        @keyframes dotPulse {
          50% { transform: scale(1.45); opacity: .55; }
        }
        .water-rise { animation: waterRise .68s cubic-bezier(.2,.9,.2,1) both; }
        .liquid-float { animation: liquidFloat 8s ease-in-out infinite; }
        .wave-drift { animation: waveDrift 3.6s ease-in-out infinite alternate; }
        .fill-up { animation: fillUp .95s cubic-bezier(.2,.9,.2,1) both; }
        .dot-pulse { animation: dotPulse 1.8s ease-in-out infinite; }
      `}</style>

      <main className="relative mx-auto min-h-[900px] max-w-[1180px] overflow-hidden rounded-[38px] bg-[linear-gradient(145deg,rgba(255,255,255,.76),rgba(232,243,250,.72)_44%,rgba(239,235,255,.74))] p-4 shadow-[0_30px_90px_rgba(86,112,138,.22)] ring-1 ring-white/80 sm:p-6">
        <div className="liquid-float pointer-events-none absolute left-[42%] top-[-170px] h-[430px] w-[430px] rounded-full bg-[radial-gradient(circle,rgba(125,211,252,.36),rgba(183,169,255,.18)_46%,transparent_72%)] blur-sm" />
        <div className="pointer-events-none absolute -right-24 top-48 h-72 w-72 rounded-[42%] bg-[linear-gradient(135deg,rgba(255,231,150,.25),rgba(125,211,252,.18),rgba(183,169,255,.18))] blur-2xl" />

        <header className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,.95),0_14px_30px_rgba(56,189,248,.13)] ring-1 ring-white/80 backdrop-blur-2xl">
              <WaterMark className="h-7 w-7" />
            </div>
            <div>
              <p className="m-0 text-sm font-bold text-zinc-500">Hydration dashboard</p>
              <h1 className="m-0 text-3xl font-black leading-none tracking-normal">Water Tracker</h1>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2 rounded-full bg-white/46 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_16px_38px_rgba(86,112,138,.11)] ring-1 ring-white/75 backdrop-blur-3xl">
            <NavButton active>
              <Icon className="h-4 w-4">
                <path d="M4 10.7 12 4l8 6.7v7.1a2.2 2.2 0 0 1-2.2 2.2H6.2A2.2 2.2 0 0 1 4 17.8v-7.1Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
                <path d="M9.2 20v-6h5.6v6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              </Icon>
              Home Page
            </NavButton>
            <NavButton>
              <Icon className="h-4 w-4">
                <path d="M12 3.5 13.7 9l5.6 1.7-5.6 1.7L12 18l-1.7-5.6-5.6-1.7L10.3 9 12 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="m18 15 .7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7L18 15Z" fill="currentColor" />
              </Icon>
              AI Analysis
            </NavButton>
            <NavButton>
              <Icon className="h-4 w-4">
                <path d="M7 3.5v3M17 3.5v3M4.5 9.5h15M7 5h10a2.5 2.5 0 0 1 2.5 2.5V17A2.5 2.5 0 0 1 17 19.5H7A2.5 2.5 0 0 1 4.5 17V7.5A2.5 2.5 0 0 1 7 5Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              </Icon>
              Calendar
            </NavButton>
          </nav>
        </header>

        <section className="relative z-10 mt-8 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
          <GlassCard className="relative min-h-[360px] overflow-hidden">
            <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[conic-gradient(from_210deg,rgba(125,211,252,0),rgba(125,211,252,.78),rgba(183,169,255,.58),rgba(125,211,252,0))] opacity-80" />
            <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/64 px-4 py-2 text-sm font-black text-zinc-700 shadow-inner ring-1 ring-white/80">
                  <span className="dot-pulse h-2.5 w-2.5 rounded-full bg-sky-400" />
                  Today's water intake
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <strong className="text-[76px] font-black leading-[.9] tracking-normal tabular-nums sm:text-[108px]">
                    {todayAmount}
                  </strong>
                  <span className="pb-3 text-2xl font-black text-zinc-500">/ {dailyGoal}</span>
                </div>

                <p className="m-0 mt-5 max-w-lg text-base font-semibold leading-relaxed text-zinc-600">
                  You are 90% complete and 250 ml away from your daily goal. Keep the pace steady before evening.
                </p>

                <div className="mt-7 grid max-w-md grid-cols-3 gap-3">
                  <div className="rounded-3xl bg-white/54 p-4 ring-1 ring-white/80">
                    <p className="m-0 text-3xl font-black tabular-nums">250</p>
                    <p className="m-0 mt-1 text-xs font-bold text-zinc-500">ml left</p>
                  </div>
                  <div className="rounded-3xl bg-white/54 p-4 ring-1 ring-white/80">
                    <p className="m-0 text-3xl font-black tabular-nums">8</p>
                    <p className="m-0 mt-1 text-xs font-bold text-zinc-500">logs today</p>
                  </div>
                  <div className="rounded-3xl bg-white/54 p-4 ring-1 ring-white/80">
                    <p className="m-0 text-3xl font-black tabular-nums">5</p>
                    <p className="m-0 mt-1 text-xs font-bold text-zinc-500">day streak</p>
                  </div>
                </div>
              </div>

              <div className="relative mx-auto h-[246px] w-[164px] shrink-0 overflow-hidden rounded-[46px] bg-white/48 shadow-[inset_0_1px_0_rgba(255,255,255,.9),inset_0_-18px_35px_rgba(56,189,248,.08)] ring-1 ring-zinc-900/5">
                <div
                  className="fill-up absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-[46px] bg-[linear-gradient(180deg,#8ee7ff,#56bdff_58%,#8e8cff)]"
                  style={{ "--fill": `${progress}%` }}
                >
                  <svg className="wave-drift absolute -top-5 left-0 h-12 w-[226px]" viewBox="0 0 226 48" preserveAspectRatio="none">
                    <path d="M0 24 C27 4, 57 44, 86 24 S143 4, 172 24 S211 44, 226 24 V48 H0Z" fill="rgba(255,255,255,.58)" />
                  </svg>
                </div>
                <div className="absolute inset-x-7 top-7 h-10 rounded-full bg-white/38 blur-md" />
                <span className="absolute inset-0 grid place-items-center text-4xl font-black text-white drop-shadow-sm">{progress}%</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="min-h-[360px]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="m-0 text-2xl font-black tracking-normal">Goal Pace</h2>
                <p className="m-0 mt-1 text-sm font-semibold text-zinc-500">Daily rhythm</p>
              </div>
              <button className="grid h-12 w-12 place-items-center rounded-full bg-[#eaff63] text-zinc-950 shadow-[0_16px_30px_rgba(218,255,99,.28)] transition duration-300 hover:-translate-y-0.5" aria-label="Open pace details">
                <Icon>
                  <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Icon>
              </button>
            </div>

            <div className="mt-8 grid place-items-center">
              <div className="relative h-48 w-48">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(24,24,27,.06)" strokeWidth="14" />
                  <circle cx="60" cy="60" r="48" fill="none" stroke="url(#paceGradient)" strokeWidth="14" strokeLinecap="round" strokeDasharray="302" strokeDashoffset="30" />
                  <defs>
                    <linearGradient id="paceGradient" x1="0" x2="1">
                      <stop stopColor="#7dd3fc" />
                      <stop offset="1" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="m-0 text-5xl font-black tabular-nums">90%</p>
                    <p className="m-0 mt-1 text-sm font-bold text-zinc-500">of daily goal</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="m-0 mt-6 text-sm font-semibold leading-relaxed text-zinc-600">
              You are ahead of your usual afternoon hydration curve by 12%.
            </p>
          </GlassCard>
        </section>

        <section className="relative z-10 mt-4 grid gap-4 lg:grid-cols-[1fr_.72fr]">
          <GlassCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="m-0 text-2xl font-black tracking-normal">7 Day Overview</h2>
                <p className="m-0 mt-1 text-sm font-semibold text-zinc-500">Daily water intake compared to your 2.5L goal</p>
              </div>
              <span className="w-fit rounded-full bg-white/62 px-4 py-2 text-sm font-black text-zinc-600 ring-1 ring-white/80">This week</span>
            </div>

            <div className="mt-6 grid h-[300px] grid-cols-7 items-end gap-3 rounded-[28px] bg-white/36 p-4 shadow-inner ring-1 ring-white/70">
              {week.map((item, index) => (
                <div key={item.day} className="flex h-full min-w-0 flex-col items-center justify-end gap-3">
                  <div className="relative h-full w-full overflow-hidden rounded-full bg-zinc-950/5 shadow-inner">
                    <div
                      className={[
                        "fill-up absolute bottom-0 left-0 right-0 rounded-full",
                        item.active
                          ? "bg-[linear-gradient(180deg,#5ee3ff,#55b9ff_55%,#8f8cff)] shadow-[0_12px_26px_rgba(56,189,248,.24)]"
                          : "bg-[linear-gradient(180deg,#c7f4ff,#93d8ff_56%,#c3b8ff)]",
                      ].join(" ")}
                      style={{ "--fill": `${item.percent}%`, animationDelay: `${index * 65}ms` }}
                    />
                    {item.active && <span className="absolute left-1/2 top-4 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow" />}
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-black text-zinc-950">{item.day}</span>
                    <span className="block text-[11px] font-bold text-zinc-500">{item.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="grid gap-4">
            <GlassCard className="bg-[linear-gradient(145deg,rgba(221,247,255,.68),rgba(255,255,255,.54))]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="m-0 text-xl font-black tracking-normal">Next Sip</h2>
                  <p className="m-0 mt-4 text-5xl font-black leading-none tabular-nums">14m</p>
                  <p className="m-0 mt-3 text-sm font-semibold leading-snug text-zinc-600">Recommended 180 ml to stay on pace.</p>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/62 text-sky-600 ring-1 ring-white/80">
                  <Icon>
                    <path d="M12 7v5l3.2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                  </Icon>
                </span>
              </div>
            </GlassCard>

            <GlassCard className="bg-[linear-gradient(145deg,rgba(244,241,255,.78),rgba(255,255,255,.56))]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="m-0 text-xl font-black tracking-normal">AI Hydration Note</h2>
                  <p className="m-0 mt-4 text-sm font-semibold leading-relaxed text-zinc-600">
                    Your intake is strongest before lunch. Add one evening reminder to make the goal feel effortless.
                  </p>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/62 text-violet-600 ring-1 ring-white/80">
                  <Icon>
                    <path d="M12 3.5 13.7 9l5.6 1.7-5.6 1.7L12 18l-1.7-5.6-5.6-1.7L10.3 9 12 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  </Icon>
                </span>
              </div>
            </GlassCard>
          </div>
        </section>
      </main>
    </div>
  );
}
