import React, { useState } from "react";

const initialSupplements = [
  { name: "Vitamin D3", category: "Vitamin", time: "Morning", precise: "08:00", important: false, note: "With breakfast" },
  { name: "Ashwagandha", category: "Herbal", time: "Midday", precise: "14:00", important: false, note: "Stress support" },
  { name: "Metformin", category: "Medication", time: "Lunch", precise: "12:30", important: true, note: "Prescription medication" },
  { name: "Magnesium Glycinate", category: "Vitamin", time: "Evening", precise: "21:30", important: false, note: "Sleep support" },
];

const quickAdds = [
  { name: "Vitamin D3", category: "Vitamin", icon: "D", note: "Bone and immune support" },
  { name: "Vitamin B12", category: "Vitamin", icon: "B", note: "Energy and red blood cells" },
  { name: "Magnesium", category: "Vitamin", icon: "Mg", note: "Sleep, muscles, recovery" },
  { name: "Omega-3", category: "Superfood", icon: "O", note: "Heart and brain support" },
  { name: "Ashwagandha", category: "Herbal", icon: "A", note: "Stress and calm routine" },
  { name: "Prescription Med", category: "Medication", icon: "Rx", note: "Important medication" },
];

const timeOptions = [
  { label: "Morning", window: "06:00 - 10:59", symbol: "sun" },
  { label: "Lunch", window: "11:00 - 13:59", symbol: "mid" },
  { label: "Midday", window: "14:00 - 17:59", symbol: "day" },
  { label: "Evening", window: "18:00 - 23:00", symbol: "moon" },
];

const defaultForm = {
  step: 0,
  name: "",
  category: "",
  time: "",
  precise: "",
  important: null,
};

function defaultTimeFor(time) {
  return {
    Morning: "08:00",
    Lunch: "12:30",
    Midday: "15:00",
    Evening: "21:00",
  }[time] || "08:00";
}

function badgeClass(category) {
  if (category === "Medication") return "bg-[#ffd8e7]";
  if (category === "Herbal") return "bg-[#ccefdc]";
  if (category === "Superfood") return "bg-[#ffe49b]";
  return "bg-[#e9e2ff]";
}

function Face({ variant = "default", small = false }) {
  const bg = variant === "gold" ? "bg-[#f5dba9]" : variant === "cool" ? "bg-[#eadfff]" : "bg-[#ffe8d7]";

  return (
    <div
      className={`${small ? "h-[34px] w-[34px] border-[3px]" : "h-[30px] w-[30px]"} ${bg} relative rounded-full border-white shadow-[inset_8px_-10px_0_rgba(0,0,0,0.1)]`}
    >
      <span className="absolute left-[7px] top-[11px] h-1 w-1 rounded-full bg-[#111] shadow-[12px_0_0_#111]" />
      <span className="absolute bottom-[7px] left-[11px] h-[5px] w-[10px] rounded-b-full border-b-2 border-[#111]" />
    </div>
  );
}

function CircleIcon({ children, className = "" }) {
  return (
    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f1f0f4] text-[22px] text-[#101114] ${className}`}>
      {children}
    </span>
  );
}

function TimeSymbol({ type }) {
  if (type === "moon") return <span className="text-2xl">C</span>;
  if (type === "mid") return <span className="h-5 w-5 rounded-full border-[5px] border-[#101114] border-r-transparent" />;
  if (type === "day") return <span className="h-5 w-5 rounded-full border-[5px] border-[#101114] border-l-transparent" />;
  return <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-[#101114] text-xs">•</span>;
}

export default function SupplementTracker() {
  const [screen, setScreen] = useState("overview");
  const [supplements, setSupplements] = useState(initialSupplements);
  const [form, setForm] = useState(defaultForm);
  const [toast, setToast] = useState("");

  const canContinue =
    (form.step === 0 && Boolean(form.name)) ||
    (form.step === 1 && Boolean(form.time)) ||
    form.step === 2 ||
    (form.step === 3 && form.important !== null) ||
    form.step === 4;

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function openFlow() {
    setForm(defaultForm);
    setScreen("flow");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    if (form.step > 0) {
      setForm((current) => ({ ...current, step: current.step - 1 }));
    } else {
      setScreen("overview");
    }
  }

  function continueFlow() {
    if (!canContinue) return;

    if (form.step === 2 && !form.precise) {
      setForm((current) => ({ ...current, precise: defaultTimeFor(current.time), step: 3 }));
      return;
    }

    if (form.step < 4) {
      setForm((current) => ({ ...current, step: current.step + 1 }));
      return;
    }

    setSupplements((items) => [
      ...items,
      {
        name: form.name,
        category: form.category,
        time: form.time,
        precise: form.precise,
        important: form.important,
        note: form.important ? "Needs attention" : "Added routine",
      },
    ]);
    setScreen("overview");
    showToast(`${form.name} added to your supplement plan`);
  }

  return (
    <div
      className="min-h-screen bg-[#f6f5f8] text-[#101114] [font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',sans-serif]"
      style={{
        background:
          "radial-gradient(circle at 10% 0%, rgba(255, 228, 155, .28), transparent 27rem), radial-gradient(circle at 92% 8%, rgba(182, 164, 255, .25), transparent 29rem), #f6f5f8",
      }}
    >
      {screen === "overview" ? (
        <Overview supplements={supplements} onAdd={openFlow} onAnalyze={() => showToast("AI analysis queued from your past 7, 14, and 30 day food logs")} />
      ) : (
        <Flow form={form} setForm={setForm} canContinue={canContinue} onBack={goBack} onCancel={() => setScreen("overview")} onNext={continueFlow} />
      )}

      <div
        className={`pointer-events-none fixed bottom-6 left-1/2 z-50 flex min-h-[52px] -translate-x-1/2 items-center gap-2 rounded-full bg-[#121316] px-5 font-extrabold text-white shadow-[0_18px_44px_rgba(18,19,22,.22)] transition ${
          toast ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
        }`}
      >
        <span>✦</span>
        {toast}
      </div>
    </div>
  );
}

function Overview({ supplements, onAdd, onAnalyze }) {
  return (
    <main className="mx-auto w-[min(1220px,calc(100vw-32px))] py-[22px] pb-9 max-sm:w-[calc(100%-20px)] max-sm:pt-3">
      <header className="mb-[34px] flex items-center justify-between gap-[18px] max-lg:items-start max-sm:mb-6 max-sm:gap-2">
        <div className="flex min-w-[176px] items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[conic-gradient(from_180deg,#ffe49b,#b6a4ff,#dbeaff,#ffe49b)] font-black shadow-[inset_0_0_0_8px_#fff,0_24px_70px_rgba(20,20,25,.08)] max-sm:h-11 max-sm:w-11">
            S
          </div>
          <div className="max-lg:hidden">
            <strong className="block text-[15px]">NutriPath</strong>
            <span className="mt-px block text-[13px] text-[#6d7079]">Supplement care</span>
          </div>
        </div>

        <nav className="flex items-center gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["⌂ Dashboard", "⌁ Food Logs", "▤ Reports", "◌ Messages", "⚙ Settings"].map((item, index) => (
            <button
              key={item}
              className={`flex min-h-12 shrink-0 items-center gap-2 rounded-full px-6 text-[15px] shadow-[0_14px_38px_rgba(16,17,20,.05)] backdrop-blur-2xl max-sm:min-h-11 max-sm:px-4 max-sm:text-sm ${
                index === 0 ? "bg-[#121316] text-white" : "bg-white/80 text-[#464951]"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 max-lg:hidden">
          {["⌕", "◔", "☼"].map((icon) => (
            <button key={icon} className="grid h-12 w-12 place-items-center rounded-full bg-white/80 text-[21px] shadow-[0_14px_38px_rgba(16,17,20,.05)] backdrop-blur-2xl">
              {icon}
            </button>
          ))}
          <div className="grid h-[52px] w-[52px] place-items-center overflow-hidden rounded-full border-[3px] border-white bg-gradient-to-br from-[#ffe49b] to-[#b6a4ff] shadow-[0_14px_38px_rgba(16,17,20,.05)]">
            <Face />
          </div>
        </div>
      </header>

      <section className="mb-7 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6 max-lg:grid-cols-1 max-sm:gap-[18px]">
        <div>
          <p className="mb-2 text-[clamp(16px,2vw,20px)] text-[#6d7079]">Welcome back, Brenda</p>
          <h1 className="m-0 max-w-[850px] text-[clamp(48px,7vw,88px)] font-extrabold leading-[.91] tracking-normal max-sm:text-[clamp(44px,15vw,64px)]">
            Daily Supplement Plan
            <span className="ml-3.5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#d9cdfd] to-[#ffe49b] px-[18px] py-[11px] align-middle text-[15px] font-bold max-sm:mt-3.5 max-sm:flex max-sm:w-max max-sm:ml-0">
              ♕ AI health insight
            </span>
          </h1>
        </div>

        <div className="flex items-center justify-end gap-[13px] max-lg:justify-start">
          <div className="flex items-center rounded-full bg-white/80 py-2 pl-2.5 pr-3.5 shadow-[0_24px_70px_rgba(20,20,25,.08)] max-sm:hidden">
            <Face small />
            <div className="-ml-1.5">
              <Face small variant="gold" />
            </div>
            <div className="-ml-1.5">
              <Face small variant="cool" />
            </div>
            <strong className="ml-2.5">+2</strong>
          </div>

          <button
            onClick={onAdd}
            className="inline-flex min-h-[58px] items-center gap-3 rounded-full bg-[#121316] py-2 pl-2 pr-[22px] font-extrabold text-white shadow-[0_18px_44px_rgba(18,19,22,.18)] max-sm:w-full max-sm:justify-center max-sm:pr-[18px]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#2a2c31] text-[30px] font-normal leading-none">+</span>
            Add Supplement
          </button>
        </div>
      </section>

      <div className="mb-[18px] flex gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {["All", "Vitamins", "Herbal", "Medication", "Superfoods"].map((tab, index) => (
          <button
            key={tab}
            className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full shadow-[0_14px_38px_rgba(16,17,20,.05)] backdrop-blur-2xl ${
              index === 0 ? "bg-[#121316] py-0 pl-2 pr-[18px] text-white" : "bg-white/80 px-[18px] text-[#555963]"
            }`}
          >
            {index === 0 && <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10">✦</span>}
            {tab}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-[1.35fr_.95fr] items-start gap-[18px] max-lg:grid-cols-1">
        <article className="rounded-[30px] bg-white/80 p-7 shadow-[0_24px_70px_rgba(20,20,25,.08)] backdrop-blur-2xl max-sm:rounded-3xl max-sm:p-[18px]">
          <div className="mb-6 flex items-center justify-between gap-4 max-sm:items-start">
            <div className="flex min-w-0 items-center gap-3.5">
              <CircleIcon>◷</CircleIcon>
              <div>
                <h2 className="m-0 text-[clamp(24px,2.5vw,34px)] font-extrabold leading-none tracking-normal">Today&apos;s Intake</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-[#6d7079]">Organized by when you take it, what it is, and how important it is.</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button className="grid h-12 w-12 place-items-center rounded-full bg-[#f1f0f4] text-[22px]">••</button>
              <button className="grid h-12 w-12 place-items-center rounded-full bg-[#f1f0f4] text-[22px]">↗</button>
            </div>
          </div>

          <div className="grid gap-3.5">
            {supplements.map((item, index) => (
              <div key={`${item.name}-${index}`} className="grid grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-4 rounded-3xl border border-[#e7e5eb]/70 bg-white p-3.5 max-sm:grid-cols-[1fr_auto] max-sm:items-start">
                <div className="flex min-h-[76px] flex-col justify-center rounded-[20px] bg-[#f1f0f4] px-3.5 py-3 max-sm:col-span-2 max-sm:min-h-[58px]">
                  <strong className="text-xl leading-none">{item.precise || item.time}</strong>
                  <span className="mt-1 text-[13px] text-[#6d7079]">{item.time}</span>
                </div>
                <div className="min-w-0">
                  <div className="mb-2 flex min-w-0 items-center gap-2.5 max-sm:flex-col max-sm:items-start">
                    <h3 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-xl font-extrabold tracking-normal max-sm:whitespace-normal">{item.name}</h3>
                    <span className={`inline-flex min-h-[27px] items-center rounded-full px-2.5 text-xs font-extrabold text-[#262934] ${badgeClass(item.category)}`}>{item.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-[#6d7079]">
                    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[#f1f0f4] px-3 text-[#444851]">
                      <span className={`h-2 w-2 rounded-full ${item.important ? "bg-[#ff6d7a]" : "bg-[#b6a4ff]"}`} />
                      {item.important ? "Important medication" : "Standard routine"}
                    </span>
                    <span className="inline-flex min-h-8 items-center rounded-full bg-[#f1f0f4] px-3 text-[#444851]">{item.note}</span>
                  </div>
                </div>
                <button className="grid h-[58px] w-[58px] place-items-center rounded-full bg-[#121316] text-[28px] text-white shadow-[0_15px_34px_rgba(18,19,22,.16)]">✓</button>
              </div>
            ))}
          </div>
        </article>

        <aside className="grid gap-[18px]">
          <article className="relative min-h-[290px] overflow-hidden rounded-[30px] bg-white/80 p-7 shadow-[0_24px_70px_rgba(20,20,25,.08)] backdrop-blur-2xl before:absolute before:bottom-5 before:right-5 before:h-[210px] before:w-[210px] before:rounded-full before:bg-[repeating-linear-gradient(135deg,rgba(182,164,255,.3)_0_12px,rgba(255,255,255,.35)_12px_24px)] before:opacity-75 max-sm:rounded-3xl max-sm:p-[18px]">
            <div className="relative z-10 grid min-h-[234px]">
              <span className="inline-flex min-h-[38px] w-max items-center gap-2 rounded-full bg-white px-3.5 font-extrabold text-[#3e414a] shadow-[0_14px_28px_rgba(18,19,22,.07)]">7, 14, 30 day scan</span>
              <div className="self-end">
                <h2 className="m-0 max-w-[390px] text-[clamp(24px,2.5vw,34px)] font-extrabold leading-none tracking-normal">Find diet gaps before they become health risks.</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-[#6d7079]">Analyze your food logs and compare nutrient intake against your supplement routine.</p>
              </div>
              <button onClick={onAnalyze} className="inline-flex min-h-[54px] w-max items-center gap-2.5 self-end rounded-full bg-[#121316] px-[18px] font-extrabold text-white">
                ✦ Analyze with AI
              </button>
            </div>
          </article>

          <article className="grid grid-cols-[auto_1fr] items-center gap-[18px] rounded-[30px] bg-white/80 p-[22px] shadow-[0_24px_70px_rgba(20,20,25,.08)] backdrop-blur-2xl max-sm:grid-cols-1">
            <div className="grid h-[116px] w-[116px] place-items-center rounded-full bg-[radial-gradient(circle_closest-side,#fff_67%,transparent_68%),conic-gradient(#b6a4ff_0_78%,#eceaf1_78%_100%)] text-[32px] font-extrabold">78%</div>
            <div>
              <h3 className="mb-2 text-[23px] font-extrabold">Routine coverage</h3>
              <p className="m-0 leading-relaxed text-[#6d7079]">Vitamin D and magnesium are consistent. Omega-3 has been missed twice this week.</p>
            </div>
          </article>

          <article className="rounded-[30px] bg-white/80 p-6 shadow-[0_24px_70px_rgba(20,20,25,.08)] backdrop-blur-2xl max-sm:rounded-3xl max-sm:p-[18px]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <CircleIcon>▦</CircleIcon>
                <h2 className="m-0 text-[clamp(24px,2.5vw,34px)] font-extrabold leading-none">Streak</h2>
              </div>
              <button className="grid h-12 w-12 place-items-center rounded-full bg-[#f1f0f4] text-[22px]">↗</button>
            </div>
            <div className="mt-[18px] grid gap-3">
              {[
                ["M", "Morning complete", "4 of 4 taken", "✓"],
                ["L", "Lunch pending", "Iron at 12:30", "→"],
              ].map(([mark, title, subtitle, action]) => (
                <div key={title} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[20px] bg-white p-3">
                  <span className="grid h-[46px] w-[46px] place-items-center rounded-full bg-[#f1f0f4] font-black">{mark}</span>
                  <span>
                    <strong className="block text-[15px]">{title}</strong>
                    <span className="mt-1 block text-[13px] text-[#6d7079]">{subtitle}</span>
                  </span>
                  <span className={`grid h-[34px] w-[34px] place-items-center rounded-full font-black ${action === "✓" ? "bg-[#ccefdc]" : "bg-[#f1f0f4]"}`}>{action}</span>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}

function Flow({ form, setForm, canContinue, onBack, onCancel, onNext }) {
  return (
    <main className="mx-auto my-[22px] grid min-h-[calc(100vh-44px)] w-[min(840px,calc(100vw-32px))] grid-rows-[auto_1fr_auto] rounded-[42px] bg-white/80 p-[22px] shadow-[0_24px_70px_rgba(20,20,25,.08)] backdrop-blur-2xl max-sm:my-2.5 max-sm:min-h-[calc(100vh-20px)] max-sm:w-[calc(100%-20px)] max-sm:rounded-[30px] max-sm:p-3.5">
      <div className="flex items-center justify-between gap-3.5">
        <button onClick={onBack} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f1f0f4] px-4 pl-3 font-extrabold text-[#101114]">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3, 4].map((step) => (
            <span key={step} className={`h-[7px] w-[35px] rounded-full ${step <= form.step ? "bg-[#121316]" : "bg-[#dfdce5]"}`} />
          ))}
        </div>
      </div>

      <section className="grid content-center gap-[26px] px-2 py-[46px]">
        {form.step === 0 && <QuestionOne form={form} setForm={setForm} />}
        {form.step === 1 && <QuestionTwo form={form} setForm={setForm} />}
        {form.step === 2 && <QuestionThree form={form} setForm={setForm} />}
        {form.step === 3 && <QuestionFour form={form} setForm={setForm} />}
        {form.step === 4 && <Summary form={form} />}
      </section>

      <div className="flex items-center justify-between gap-3.5 border-t border-[#e7e5eb]/70 pt-[18px] max-sm:sticky max-sm:bottom-0 max-sm:bg-white/90 max-sm:backdrop-blur-2xl">
        <button onClick={form.step === 0 ? onCancel : onBack} className="min-h-[54px] rounded-full bg-[#f1f0f4] px-[18px] font-extrabold text-[#101114]">
          {form.step === 0 ? "Cancel" : "Previous"}
        </button>
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="min-h-[58px] rounded-full bg-[#121316] px-6 font-black text-white shadow-[0_16px_36px_rgba(18,19,22,.18)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {form.step === 4 ? "Add to plan" : "Continue →"}
        </button>
      </div>
    </main>
  );
}

function FlowKicker({ children }) {
  return <span className="inline-flex min-h-[38px] w-max items-center gap-2 rounded-full bg-[#e9e2ff] px-3.5 text-sm font-black text-[#322b58]">{children}</span>;
}

function FlowTitle({ children }) {
  return <h1 className="m-0 max-w-[720px] text-[clamp(38px,7vw,68px)] font-extrabold leading-[.96] tracking-normal max-sm:text-[clamp(38px,12vw,54px)]">{children}</h1>;
}

function QuestionOne({ form, setForm }) {
  const groups = ["Vitamin", "Herbal", "Medication", "Superfood"];

  return (
    <>
      <FlowKicker>Question 1 of 4</FlowKicker>
      <FlowTitle>What do you want to add?</FlowTitle>
      {groups.map((group) => (
        <div key={group} className="grid gap-3.5">
          <p className="mb-[-2px] mt-2 text-xs font-extrabold uppercase tracking-[.08em] text-[#6d7079]">{group}</p>
          <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
            {quickAdds
              .filter((item) => item.category === group)
              .map((item) => (
                <button
                  key={item.name}
                  onClick={() => setForm((current) => ({ ...current, name: item.name, category: item.category }))}
                  className={`grid min-h-28 grid-cols-[auto_1fr] items-center gap-3.5 rounded-[28px] border-2 bg-white p-4 text-left shadow-[0_18px_44px_rgba(18,19,22,.07)] max-sm:min-h-24 ${
                    form.name === item.name ? "border-[#121316] bg-[#f8f5ff]" : "border-transparent"
                  }`}
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-[#f1f0f4] text-[26px] font-black">{item.icon}</span>
                  <span>
                    <strong className="block text-xl leading-tight">{item.name}</strong>
                    <span className="mt-1.5 block text-sm leading-snug text-[#6d7079]">{item.note}</span>
                  </span>
                </button>
              ))}
          </div>
        </div>
      ))}
    </>
  );
}

function QuestionTwo({ form, setForm }) {
  return (
    <>
      <FlowKicker>Question 2 of 4</FlowKicker>
      <FlowTitle>When do you take it?</FlowTitle>
      <div className="grid max-w-[620px] gap-[13px]">
        {timeOptions.map((option) => (
          <button
            key={option.label}
            onClick={() => setForm((current) => ({ ...current, time: option.label }))}
            className={`grid min-h-[92px] grid-cols-[auto_1fr_auto] items-center gap-[15px] rounded-[28px] border-2 bg-white py-[15px] pl-[15px] pr-[18px] text-left shadow-[0_18px_44px_rgba(18,19,22,.07)] ${
              form.time === option.label ? "border-[#121316] bg-[#f8f5ff]" : "border-transparent"
            }`}
          >
            <CircleIcon className="h-[58px] w-[58px]">
              <TimeSymbol type={option.symbol} />
            </CircleIcon>
            <span>
              <strong className="block text-xl leading-tight">{option.label}</strong>
              <span className="mt-1.5 block text-sm leading-snug text-[#6d7079]">{option.window}</span>
            </span>
            <span className="grid h-[42px] w-[42px] place-items-center rounded-full bg-[#f1f0f4] text-xl font-black">→</span>
          </button>
        ))}
      </div>
    </>
  );
}

function QuestionThree({ form, setForm }) {
  const current = form.precise || defaultTimeFor(form.time);
  const [hour, minute] = current.split(":");

  function updatePrecise(nextHour, nextMinute) {
    const safeHour = String(Math.max(0, Math.min(23, Number(nextHour || 0)))).padStart(2, "0");
    const safeMinute = String(Math.max(0, Math.min(59, Number(nextMinute || 0)))).padStart(2, "0");
    setForm((currentForm) => ({ ...currentForm, precise: `${safeHour}:${safeMinute}` }));
  }

  return (
    <>
      <FlowKicker>Question 3 of 4</FlowKicker>
      <FlowTitle>Pick a precise time.</FlowTitle>
      <p className="max-w-[540px] text-[15px] leading-relaxed text-[#6d7079]">This is optional. Skip it if a general time of day is enough.</p>
      <div className="grid w-[min(560px,100%)] grid-cols-[1fr_auto_1fr] items-center gap-4 max-sm:gap-2">
        <input
          value={hour}
          onChange={(event) => updatePrecise(event.target.value.replace(/\D/g, "").slice(0, 2), minute)}
          className="h-32 min-w-0 rounded-[28px] border-0 bg-white text-center text-[clamp(42px,10vw,74px)] font-black text-[#101114] shadow-[0_18px_44px_rgba(18,19,22,.07)] outline-none max-sm:h-[104px]"
          inputMode="numeric"
          maxLength={2}
          aria-label="Hour"
        />
        <span className="text-[clamp(42px,10vw,72px)] font-black text-[#6d7079]">:</span>
        <input
          value={minute}
          onChange={(event) => updatePrecise(hour, event.target.value.replace(/\D/g, "").slice(0, 2))}
          className="h-32 min-w-0 rounded-[28px] border-0 bg-white text-center text-[clamp(42px,10vw,74px)] font-black text-[#101114] shadow-[0_18px_44px_rgba(18,19,22,.07)] outline-none max-sm:h-[104px]"
          inputMode="numeric"
          maxLength={2}
          aria-label="Minute"
        />
      </div>
      <button onClick={() => setForm((currentForm) => ({ ...currentForm, precise: "", step: 3 }))} className="inline-flex min-h-12 w-max items-center gap-2.5 rounded-full bg-[#f1f0f4] px-[18px] font-extrabold text-[#101114]">
        Skip exact time →
      </button>
    </>
  );
}

function QuestionFour({ form, setForm }) {
  return (
    <>
      <FlowKicker>Question 4 of 4</FlowKicker>
      <FlowTitle>Is this an important medication?</FlowTitle>
      <div className="grid max-w-[680px] grid-cols-2 gap-3.5 max-sm:grid-cols-1">
        {[
          { value: true, title: "Yes", icon: "!", copy: "Highlight this dose and keep it visible in your daily plan." },
          { value: false, title: "No", icon: "✓", copy: "Treat it like a normal supplement routine item." },
        ].map((option) => (
          <button
            key={option.title}
            onClick={() => setForm((current) => ({ ...current, important: option.value }))}
            className={`min-h-[186px] rounded-[28px] border-2 bg-white p-6 text-left shadow-[0_18px_44px_rgba(18,19,22,.07)] ${
              form.important === option.value ? "border-[#121316] bg-[#f8f5ff]" : "border-transparent"
            }`}
          >
            <span className="mb-7 grid h-16 w-16 place-items-center rounded-full bg-[#f1f0f4] text-[26px] font-black">{option.icon}</span>
            <strong className="block text-[31px] leading-tight">{option.title}</strong>
            <span className="mt-1.5 block text-sm leading-snug text-[#6d7079]">{option.copy}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function Summary({ form }) {
  const rows = [
    ["Name", form.name],
    ["Category", form.category],
    ["Time of day", form.time],
    ["Exact time", form.precise || "No exact time"],
    ["Importance", form.important ? "Important medication" : "Standard routine"],
  ];

  return (
    <>
      <FlowKicker>Ready to add</FlowKicker>
      <FlowTitle>Review your new routine item.</FlowTitle>
      <div className="grid max-w-[600px] gap-3.5 rounded-[30px] bg-white p-[22px] shadow-[0_18px_44px_rgba(18,19,22,.07)]">
        {rows.map(([label, value], index) => (
          <div key={label} className={`flex justify-between gap-[18px] py-3 text-[#6d7079] ${index !== rows.length - 1 ? "border-b border-[#e7e5eb]" : ""}`}>
            <span>{label}</span>
            <strong className="text-right text-[#101114]">{value}</strong>
          </div>
        ))}
      </div>
    </>
  );
}
