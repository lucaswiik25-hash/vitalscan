import React, { useState } from "react";

const quickExercises = [
  {
    name: "Running",
    range: "Approx 600-900 Kcal Per Hour",
    kcal: 240,
    icon: "running",
  },
  {
    name: "Weight Training",
    range: "Approx 180-600 Kcal Per Hour",
    kcal: 160,
    icon: "weights",
  },
  {
    name: "Walking",
    range: "Approx 180-300 Kcal Per Hour",
    kcal: 95,
    icon: "walking",
  },
];

function Icon({ name, className = "h-6 w-6" }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M10 21v-6h4v6" />
      </svg>
    );
  }

  if (name === "running") {
    return (
      <svg {...common}>
        <path d="m13 4 2 2 2-2" />
        <path d="M11 7 8 12l4 2 3 6" />
        <path d="m6 20 3-5" />
        <path d="m14 10 4 2" />
        <path d="M3 9h4" />
        <path d="M2 13h3" />
      </svg>
    );
  }

  if (name === "weights") {
    return (
      <svg {...common}>
        <path d="M6.5 7v10" />
        <path d="M17.5 7v10" />
        <path d="M3.5 10v4" />
        <path d="M20.5 10v4" />
        <path d="M6.5 12h11" />
      </svg>
    );
  }

  if (name === "walking") {
    return (
      <svg {...common}>
        <circle cx="12" cy="4" r="2" />
        <path d="m11 8-2 5 3 2 1 5" />
        <path d="m7 20 2-5" />
        <path d="m13 10 4 2" />
      </svg>
    );
  }

  if (name === "bag") {
    return (
      <svg {...common}>
        <path d="M7 8h10l1 13H6L7 8Z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  return null;
}

function QuickAddRow({ exercise, faded, onAdd }) {
  return (
    <button
      onClick={() => onAdd(exercise)}
      className={[
        "group flex w-full items-center gap-4 rounded-full border-4 border-white bg-white/75 py-3 pl-7 pr-4 text-left shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-xl transition duration-200 active:scale-[0.985]",
        faded ? "scale-[0.88] opacity-45" : "hover:bg-white",
      ].join(" ")}
    >
      <Icon name={exercise.icon} className="h-9 w-9 shrink-0 text-black" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[26px] font-[780] leading-none text-[#1f2329]">
          {exercise.name}
        </div>
        <div className="mt-1 truncate text-[19px] font-[430] leading-none text-[#8e8e93]">
          {exercise.range}
        </div>
      </div>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#25272b] transition group-active:scale-90">
        <Icon name="plus" className="h-8 w-8" />
      </div>
    </button>
  );
}

export default function ExercisePage() {
  const goal = 600;
  const [burned, setBurned] = useState(250);
  const [exerciseCount, setExerciseCount] = useState(2);
  const [lastAdded, setLastAdded] = useState("");

  const remaining = Math.max(goal - burned, 0);
  const progress = Math.min(70 + Math.round(((burned - 250) / (goal - 250)) * 30), 100);

  function addExercise(exercise) {
    setBurned((value) => Math.min(value + exercise.kcal, goal));
    setExerciseCount((value) => value + 1);
    setLastAdded(`${exercise.name} logged`);
  }

  return (
    <main
      className="min-h-screen bg-[#f3f3f3] text-black"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', Inter, Arial, sans-serif",
      }}
    >
      <section className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-white">
        <header className="flex h-[106px] shrink-0 items-end justify-between border-b border-black/20 px-8 pb-6">
          <button aria-label="Home" className="grid h-12 w-12 place-items-center rounded-full active:scale-95">
            <Icon name="home" className="h-11 w-11 text-[#25272b]" />
          </button>

          <button className="grid h-[46px] w-[46px] place-items-center rounded-full bg-[#e5e5e5] text-[23px] font-[760] active:scale-95">
            AI
          </button>
        </header>

        <section className="relative flex min-h-[470px] flex-col rounded-b-[64px] bg-white px-6 pb-7 pt-6 shadow-[0_18px_0_rgba(188,197,205,0.98)]">
          <div className="flex items-start justify-between">
            <h1 className="text-[26px] font-[790] leading-none tracking-[-0.02em]">
              Todays Burn
            </h1>

            <button className="h-[31px] rounded-full bg-black px-7 text-[17px] font-[760] leading-none text-white active:scale-95">
              Log
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center pt-12">
            <div className="relative">
              <div className="absolute left-3 top-3 select-none text-[116px] font-[860] leading-none tracking-[-0.08em] text-[#d8eef8]">
                {progress}%
              </div>
              <div className="relative select-none text-[116px] font-[860] leading-none tracking-[-0.08em] text-black">
                {progress}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 items-end text-center">
            <div>
              <div className="text-[24px] font-[720] leading-none tracking-[-0.04em]">Exercises</div>
              <div className="mt-2 text-[42px] font-[360] leading-none">{exerciseCount}</div>
            </div>

            <div>
              <div className="text-[24px] font-[720] leading-none tracking-[-0.04em]">Burned</div>
              <div className="mt-2 flex items-end justify-center gap-1">
                <span className="text-[42px] font-[360] leading-none">{burned}</span>
                <span className="pb-1 text-[17px] font-[500]">Kcal</span>
              </div>
            </div>

            <div>
              <div className="text-[24px] font-[720] leading-none tracking-[-0.04em]">Remaining</div>
              <div className="mt-2 flex items-end justify-center gap-1">
                <span className="text-[42px] font-[360] leading-none">{remaining}</span>
                <span className="pb-1 text-[17px] font-[500]">Kcal</span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-1 flex-col bg-[linear-gradient(180deg,#bfc8d0_0%,#eef1f4_54%,#f9f9f9_100%)] px-6 pb-5 pt-9">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[25px] font-[800] leading-none text-white">Quick Add</h2>
            {lastAdded ? (
              <span className="rounded-full bg-white/65 px-3 py-1 text-xs font-bold text-[#6b737c]">
                {lastAdded}
              </span>
            ) : null}
          </div>

          <div className="grid gap-3">
            {quickExercises.map((exercise, index) => (
              <QuickAddRow
                key={exercise.name}
                exercise={exercise}
                faded={index === 2}
                onAdd={addExercise}
              />
            ))}
          </div>

          <div className="mx-auto mt-4 h-[28px] w-[156px] rounded-full bg-white/65" />

          <div className="mt-auto grid grid-cols-[1fr_76px] gap-3 pt-5">
            <nav className="grid h-[66px] grid-cols-3 items-center rounded-full bg-[#e6e1e6]/90 px-4 backdrop-blur-xl">
              <button className="grid place-items-center text-white active:scale-95">
                <Icon name="home" className="h-8 w-8" />
              </button>
              <button className="mx-auto grid h-[58px] w-[58px] place-items-center rounded-[22px] bg-white text-white shadow-[0_0_24px_rgba(127,157,255,0.52)] active:scale-95">
                <Icon name="bag" className="h-8 w-8 text-white drop-shadow-[0_1px_0_rgba(120,150,255,0.75)]" />
              </button>
              <span />
            </nav>

            <button className="grid h-[66px] place-items-center rounded-full bg-[#e7e2e8]/90 text-black backdrop-blur-xl active:scale-95">
              <Icon name="plus" className="h-10 w-10" />
            </button>
          </div>

          <div className="mx-auto mt-3 h-1 w-28 rounded-full bg-black/80" />
        </section>
      </section>
    </main>
  );
}
