import React, { useState } from 'react';

const glassStyle = {
  background: 'rgba(255,255,255,0.82)',
  border: '1px solid rgba(0,0,0,0.12)',
  boxShadow: '0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.06)',
};

function GlassMacroCard({ value, unit = 'g', label, progress }) {
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <div className="flex-1 rounded-[22px] p-5 flex flex-col gap-3" style={glassStyle}>
      <p className="text-xs font-semibold text-foreground/50 leading-none">{label}</p>
      <p className="text-3xl font-light text-foreground leading-none">{Math.max(0, Math.round(value))}<span className="text-sm font-semibold text-foreground/50 ml-0.5">{unit}</span></p>
      <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: pct >= 90 ? '#F47C7C' : pct >= 60 ? '#F5C842' : '#6CC5A0' }} />
      </div>
    </div>
  );
}

function CircleProgress({ pct, color, size = 72, stroke = 7 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

function GlassCalorieCard({ caloriesLeft, caloriesTarget, caloriesConsumed }) {
  const pct = caloriesTarget > 0 ? Math.min(100, (caloriesConsumed / caloriesTarget) * 100) : 0;
  const color = pct >= 100 ? '#F47C7C' : pct >= 70 ? '#F5C842' : '#6CC5A0';
  return (
    <div className="rounded-[22px] p-5" style={glassStyle}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground/50">Calories left</p>
          <p className="leading-none mt-1" style={{ fontSize: 52, fontWeight: 800, color: 'hsl(var(--foreground))' }}>{Math.max(0, Math.round(caloriesLeft))}<span className="text-lg font-semibold text-foreground/40 ml-1">kcal</span></p>
          <p className="text-xs text-foreground/40 mt-1">of {caloriesTarget}</p>
        </div>
        <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
          <CircleProgress pct={pct} color={color} size={72} stroke={7} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold" style={{ color }}>{Math.round(pct)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlassCaffeineCard({ waterLogs = [] }) {
  // Count caffeinated drinks (coffee, energy_drink, tea) today
  const caffeinated = waterLogs.filter(l => ['coffee', 'energy_drink', 'tea'].includes(l.type));
  const coffeeCount = caffeinated.filter(l => l.type === 'coffee').length;
  const energyCount = caffeinated.filter(l => l.type === 'energy_drink').length;
  const teaCount = caffeinated.filter(l => l.type === 'tea').length;
  // Rough mg estimate
  const mgEstimate = coffeeCount * 95 + energyCount * 80 + teaCount * 40;
  const limit = 400;
  const pct = Math.min(100, (mgEstimate / limit) * 100);
  const color = pct >= 100 ? '#F47C7C' : pct >= 60 ? '#F5C842' : '#6CC5A0';
  const hasData = caffeinated.length > 0;
  return (
    <div className="flex-1 rounded-[22px] p-5 flex flex-col gap-3" style={glassStyle}>
      <p className="text-xs font-semibold text-foreground/50 leading-none">Caffeine</p>
      <p className="text-3xl font-light text-foreground leading-none">
        {hasData ? mgEstimate : '—'}<span className="text-sm font-semibold text-foreground/50 ml-0.5">{hasData ? 'mg' : ''}</span>
      </p>
      <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function GlassSleepCard({ profile }) {
  // Read from localStorage as fallback if UserProfile hasn't synced yet
  const today = new Date().toISOString().slice(0, 10);
  let localHours = null;
  try {
    const stored = JSON.parse(localStorage.getItem('scanly_sleep') || '{}');
    localHours = stored[today] ?? null;
  } catch (_) {}
  const hours = profile.last_sleep_hours ?? localHours;
  const hasData = hours != null;
  const color = !hasData ? '#aaa' : hours >= 7 ? '#6CC5A0' : hours >= 5 ? '#F5C842' : '#F47C7C';
  return (
    <div className="flex-1 rounded-[22px] p-5 flex flex-col gap-3" style={glassStyle}>
      <p className="text-xs font-semibold text-foreground/50 leading-none">Sleep</p>
      <p className="text-3xl font-light text-foreground leading-none" style={{ color: hasData ? color : undefined }}>
        {hasData ? hours : '—'}<span className="text-sm font-semibold text-foreground/50 ml-0.5">h</span>
      </p>
      <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${hasData ? Math.min(100, (hours / 9) * 100) : 0}%`, background: color }} />
      </div>
    </div>
  );
}

function GlassHealthScore({ consumed, profile }) {
  const cal = consumed.calories || 0;
  const calTarget = profile.calorie_target || 2000;
  const prot = consumed.protein || 0;
  const protTarget = profile.protein_target || 150;
  const hasMeals = cal > 0;
  const calScore = hasMeals ? Math.min(100, Math.max(0, 100 - Math.abs(cal - calTarget) / calTarget * 100)) : 0;
  const protScore = hasMeals ? Math.min(100, prot / protTarget * 100) : 0;
  const healthScore = hasMeals ? Math.round(calScore * 0.6 + protScore * 0.4) : null;
  const scoreColor = healthScore === null ? '#aaa' : healthScore >= 75 ? '#6CC5A0' : healthScore >= 45 ? '#F5C842' : '#F47C7C';
  return (
    <div className="rounded-[18px] p-5" style={glassStyle}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-foreground">Health Score</span>
        <span className="text-base font-extrabold" style={{ color: scoreColor }}>
          {healthScore !== null ? `${healthScore}/100` : 'N/A'}
        </span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${healthScore || 0}%`, background: scoreColor }} />
      </div>
      <p className="text-[10px] text-foreground/50 mt-2">
        {healthScore !== null ? 'Based on calories & protein' : 'Log food to see your score'}
      </p>
    </div>
  );
}

// ─── Diet-specific carousels ──────────────────────────────────────────────────

function AppearanceCarousel({ consumed, profile, waterLogs = [], todayMeals = [] }) {
  const sodiumConsumed = consumed.sodium || 0;
  const sodiumTarget = profile.sodium_target || 2300;
  const sugarConsumed = consumed.sugar || 0;
  const sugarTarget = profile.sugar_target || 50;
  const waterConsumed = waterLogs.filter(l => l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);
  const waterTarget = profile.water_target_ml || 2000;
  const potassiumConsumed = consumed.potassium || 0;

  const bloatRiskRaw = todayMeals
    .map(m => (m.bloat_risk || '').toLowerCase())
    .filter(Boolean);
  const bloatHigh = bloatRiskRaw.filter(r => r === 'high').length;
  const bloatMed = bloatRiskRaw.filter(r => r === 'medium').length;
  const bloatLabel = bloatHigh > 0 ? 'High' : bloatMed > 0 ? 'Medium' : bloatRiskRaw.length > 0 ? 'Low' : '—';
  const bloatColor = bloatHigh > 0 ? '#dc2626' : bloatMed > 0 ? '#ca8a04' : '#16a34a';

  // tomorrow prediction: calculated from today's data
  const sodiumBalance = sodiumConsumed - potassiumConsumed; // high = worse
  const waterPct = waterTarget > 0 ? (waterConsumed / waterTarget) * 100 : 0;
  const sugarPct = sugarTarget > 0 ? (sugarConsumed / sugarTarget) * 100 : 0;
  const sleepHours = profile.last_sleep_hours || 0;
  const hasMealsLogged = todayMeals.length > 0;

  let facePrediction = null;
  let faceReason = null;
  if (hasMealsLogged || waterConsumed > 0 || sleepHours > 0) {
    let score = 50;
    if (waterPct >= 80) score += 15; else if (waterPct >= 50) score += 5; else if (waterConsumed === 0) score -= 15; else score -= 10;
    if (sleepHours >= 7 && sleepHours <= 9) score += 15; else if (sleepHours >= 5) score += 5; else if (sleepHours > 0 && sleepHours < 5) score -= 20; else if (sleepHours === 0) score -= 5;
    if (sugarPct > 100) score -= 15; else if (sugarPct > 70) score -= 5; else if (sugarPct < 50 && hasMealsLogged) score += 5;
    if (sodiumBalance > 1000) score -= 10; else if (sodiumBalance < 200) score += 10;
    if (hasMealsLogged) score += 5;

    const reasons = [];
    if (waterConsumed === 0) reasons.push('no water logged today');
    else if (waterPct < 50) reasons.push(`low hydration (${Math.round(waterPct)}%)`);
    else if (waterPct >= 80) reasons.push(`great hydration (${Math.round(waterPct)}%)`);

    if (sleepHours === 0) reasons.push('no sleep logged');
    else if (sleepHours < 5) reasons.push(`poor sleep (${sleepHours}h)`);
    else if (sleepHours < 7) reasons.push(`short sleep (${sleepHours}h)`);
    else if (sleepHours >= 7) reasons.push(`good sleep (${sleepHours}h)`);

    if (sugarPct > 100) reasons.push('high sugar intake');
    if (sodiumBalance > 1000) reasons.push('high sodium');

    facePrediction = score >= 65 ? 'Slim Face' : score >= 45 ? 'Moderate' : 'Bloated';
    faceReason = reasons.length > 0 ? reasons.join(' · ') : 'Log food & water for a prediction';
  }
  const predColor = facePrediction === 'Slim Face' ? '#16a34a' : facePrediction === 'Bloated' ? '#dc2626' : '#ca8a04';

  return [
    <div key="a1" className="min-w-full px-5 space-y-3">
      <div className="flex gap-2">
        <GlassMacroCard value={sodiumConsumed} unit="mg" label="Sodium today" progress={(sodiumConsumed / sodiumTarget) * 100} />
        <GlassMacroCard value={potassiumConsumed} unit="mg" label="Potassium" progress={(potassiumConsumed / 3500) * 100} />
        <GlassSleepCard profile={profile} />
      </div>
      <div className="rounded-[22px] p-5" style={glassStyle}>
        <p className="text-xs font-semibold text-foreground/50">Bloat Risk Today</p>
        <p className="text-5xl font-light text-foreground leading-none mt-1" style={{ color: bloatColor }}>{bloatLabel}</p>
        <p className="text-xs text-foreground/40 mt-2">Based on {bloatRiskRaw.length} meals logged</p>
        <div className="w-full h-2.5 rounded-full overflow-hidden mt-3" style={{ background: 'rgba(0,0,0,0.08)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: bloatHigh > 0 ? '100%' : bloatMed > 0 ? '55%' : bloatRiskRaw.length > 0 ? '15%' : '0%', background: bloatColor }} />
        </div>
      </div>
    </div>,
    <div key="a2" className="min-w-full px-5 space-y-3">
      <div className="flex gap-2">
        <GlassMacroCard value={sugarConsumed} unit="g" label="Sugar today" progress={(sugarConsumed / sugarTarget) * 100} />
        <GlassMacroCard value={Math.round((waterConsumed / waterTarget) * 100)} unit="%" label="Water %" progress={(waterConsumed / waterTarget) * 100} />
        <GlassCaffeineCard waterLogs={waterLogs} />
      </div>
      <div className="rounded-[22px] p-5" style={glassStyle}>
        <p className="text-xs font-semibold text-foreground/50">Tomorrow Face Prediction</p>
        <p className="text-5xl font-light text-foreground leading-none mt-1" style={{ color: facePrediction ? predColor : undefined }}>{facePrediction || '—'}</p>
        {faceReason
          ? <p className="text-xs text-foreground/40 mt-2 leading-relaxed capitalize">{faceReason}</p>
          : <p className="text-xs text-foreground/40 mt-2">Log food & water to see prediction</p>
        }
      </div>
    </div>,
    <div key="a3" className="min-w-full px-5 space-y-3">
      <div className="flex gap-2">
        <GlassMacroCard value={consumed.protein || 0} unit="g" label="Protein" progress={((consumed.protein || 0) / (profile.protein_target || 150)) * 100} />
        <GlassMacroCard value={consumed.carbs || 0} unit="g" label="Carbs" progress={((consumed.carbs || 0) / (profile.carbs_target || 200)) * 100} />
        <GlassMacroCard value={consumed.fat || 0} unit="g" label="Fat" progress={((consumed.fat || 0) / (profile.fat_target || 80)) * 100} />
      </div>
      <GlassCalorieCard
        caloriesLeft={(profile.calorie_target || 2000) - (consumed.calories || 0)}
        caloriesTarget={profile.calorie_target || 2000}
        caloriesConsumed={consumed.calories || 0}
      />
    </div>,
  ];
}

function CarnivoreCarousel({ consumed, profile, todayMeals = [] }) {
  const proteinConsumed = consumed.protein || 0;
  const fatConsumed = consumed.fat || 0;
  const proteinTarget = profile.protein_target || 150;
  const fatTarget = profile.fat_target || 120;

  // Carnivore streak: check consecutive days all meals were approved
  const carnivoreMeals = todayMeals.filter(m => (m.diet_compatibility || '').toLowerCase().includes('carnivore approved'));
  const allApproved = todayMeals.length > 0 && carnivoreMeals.length === todayMeals.length;

  return [
    <div key="c1" className="min-w-full px-5 space-y-3">
      <div className="flex gap-2">
        <GlassMacroCard value={proteinConsumed} unit="g" label="Protein today" progress={(proteinConsumed / proteinTarget) * 100} />
        <GlassMacroCard value={fatConsumed} unit="g" label="Fat today" progress={(fatConsumed / fatTarget) * 100} />
      </div>
      <div className="rounded-[22px] p-5" style={glassStyle}>
        <p className="text-xs font-semibold text-foreground/50 mb-1">Meals Logged</p>
        <p className="text-3xl font-light text-foreground">{todayMeals.length}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: allApproved ? '#dcfce7' : '#fee2e2', color: allApproved ? '#16a34a' : '#dc2626' }}>
            {allApproved ? 'All Carnivore Approved' : `${carnivoreMeals.length}/${todayMeals.length} Approved`}
          </span>
        </div>
      </div>
    </div>,
  ];
}

function KetoCarousel({ consumed, profile }) {
  const netCarbs = Math.max(0, (consumed.carbs || 0) - (consumed.fiber || 0));
  const fat = consumed.fat || 0;
  const protein = consumed.protein || 0;
  const fatTarget = profile.fat_target || 150;
  const proteinTarget = profile.protein_target || 100;
  const ketosisRisk = netCarbs > 20;
  const nearLimit = netCarbs > 15;

  return [
    <div key="k1" className="min-w-full px-5 space-y-3">
      <div className="rounded-[22px] p-5" style={glassStyle}>
        <p className="text-xs font-semibold text-foreground/50 mb-1">Net Carbs Today</p>
        <div className="flex items-end gap-2">
          <p className="text-5xl font-light leading-none" style={{ color: ketosisRisk ? '#dc2626' : nearLimit ? '#ca8a04' : '#16a34a' }}>
            {Math.round(netCarbs)}
          </p>
          <span className="text-base font-semibold text-foreground/40 mb-1">g</span>
          <span className="text-xs text-foreground/40 mb-1">/ 25g limit</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden mt-3" style={{ background: 'rgba(0,0,0,0.08)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (netCarbs / 25) * 100)}%`, background: ketosisRisk ? '#dc2626' : nearLimit ? '#ca8a04' : '#16a34a' }} />
        </div>
        {ketosisRisk && (
          <p className="text-xs font-bold text-red-600 mt-2">Ketosis Risk — over 20g net carbs</p>
        )}
      </div>
      <div className="flex gap-2">
        <GlassMacroCard value={fat} unit="g" label="Fat today" progress={(fat / fatTarget) * 100} />
        <GlassMacroCard value={protein} unit="g" label="Protein today" progress={(protein / proteinTarget) * 100} />
      </div>
    </div>,
  ];
}

function HighProteinCarousel({ consumed, profile, todayMeals = [] }) {
  const protein = consumed.protein || 0;
  const proteinTarget = profile.protein_target || 150;
  const proteinLeft = Math.max(0, proteinTarget - protein);
  const pct = Math.min(100, (protein / proteinTarget) * 100);
  const color = pct >= 100 ? '#6CC5A0' : pct >= 60 ? '#F5C842' : '#F47C7C';

  const avgProteinPerMeal = todayMeals.length > 0
    ? Math.round(todayMeals.reduce((s, m) => s + (m.protein || 0), 0) / todayMeals.length)
    : 0;

  return [
    <div key="hp1" className="min-w-full px-5 space-y-3">
      <div className="rounded-[22px] p-5" style={glassStyle}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-foreground/50">Protein today</p>
            <p className="text-5xl font-light text-foreground leading-none mt-1">
              {Math.round(protein)}<span className="text-lg font-semibold text-foreground/40 ml-1">g</span>
            </p>
            <p className="text-xs text-foreground/40 mt-1">{Math.round(proteinLeft)}g remaining</p>
          </div>
          <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
            <CircleProgress pct={pct} color={color} size={72} stroke={7} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold" style={{ color }}>{Math.round(pct)}%</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 rounded-[20px] p-5" style={glassStyle}>
          <p className="text-xs text-foreground/50 mb-1">Avg per meal</p>
          <p className="text-2xl font-light text-foreground">{avgProteinPerMeal}<span className="text-sm text-foreground/40"> g</span></p>
        </div>
        <div className="flex-1 rounded-[20px] p-5" style={glassStyle}>
          <p className="text-xs text-foreground/50 mb-1">Meals logged</p>
          <p className="text-2xl font-light text-foreground">{todayMeals.length}</p>
        </div>
      </div>
    </div>,
  ];
}

// ─── Standard carousel (default) ──────────────────────────────────────────────

function StandardCarousel({ consumed, profile }) {
  const caloriesLeft = (profile.calorie_target || 2500) - (consumed.calories || 0);
  const proteinLeft = (profile.protein_target || 191) - (consumed.protein || 0);
  const carbsLeft = (profile.carbs_target || 438) - (consumed.carbs || 0);
  const fatLeft = (profile.fat_target || 93) - (consumed.fat || 0);
  const sugarLeft = (profile.sugar_target || 118) - (consumed.sugar || 0);
  const sodiumLeft = (profile.sodium_target || 2300) - (consumed.sodium || 0);

  return [
    <div key="s1" className="min-w-full px-5 space-y-3">
      <div className="flex gap-2">
        <GlassMacroCard value={Math.max(0, proteinLeft)} label="Protein left" progress={consumed.protein ? (consumed.protein / (profile.protein_target || 191)) * 100 : 0} />
        <GlassMacroCard value={Math.max(0, carbsLeft)} label="Carbs left" progress={consumed.carbs ? (consumed.carbs / (profile.carbs_target || 438)) * 100 : 0} />
        <GlassMacroCard value={Math.max(0, fatLeft)} label="Fat left" progress={consumed.fat ? (consumed.fat / (profile.fat_target || 93)) * 100 : 0} />
      </div>
      <GlassCalorieCard caloriesLeft={caloriesLeft} caloriesTarget={profile.calorie_target || 2500} caloriesConsumed={consumed.calories || 0} />
    </div>,
    <div key="s2" className="min-w-full px-5 space-y-3">
      <div className="flex gap-2">
        <GlassMacroCard value={Math.max(0, sugarLeft)} label="Sugar left" progress={consumed.sugar ? (consumed.sugar / (profile.sugar_target || 118)) * 100 : 0} />
        <GlassMacroCard value={Math.max(0, sodiumLeft)} unit="mg" label="Sodium left" progress={consumed.sodium ? (consumed.sodium / (profile.sodium_target || 2300)) * 100 : 0} />
        <GlassSleepCard profile={profile} />
      </div>
      <GlassHealthScore consumed={consumed} profile={profile} />
    </div>,
  ];
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function NutriCarousel({ profile = {}, consumed = {}, waterLogs = [], todayMeals = [] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const dietMode = profile.diet_mode || 'standard';

  let slides;
  if (dietMode === 'appearance_mode') {
    slides = AppearanceCarousel({ consumed, profile, waterLogs, todayMeals });
  } else if (dietMode === 'carnivore') {
    slides = CarnivoreCarousel({ consumed, profile, todayMeals });
  } else if (dietMode === 'keto') {
    slides = KetoCarousel({ consumed, profile });
  } else if (dietMode === 'high_protein') {
    slides = HighProteinCarousel({ consumed, profile, todayMeals });
  } else {
    slides = StandardCarousel({ consumed, profile });
  }

  // Reset slide if it's out of bounds after diet switch
  const safeSlide = Math.min(currentSlide, slides.length - 1);

  return (
    <div>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${safeSlide * 100}%)` }}
          onTouchStart={(e) => {
            const startX = e.touches[0].clientX;
            const handleEnd = (ev) => {
              const diff = startX - ev.changedTouches[0].clientX;
              if (diff > 50 && safeSlide < slides.length - 1) setCurrentSlide(c => Math.min(c + 1, slides.length - 1));
              if (diff < -50 && safeSlide > 0) setCurrentSlide(c => Math.max(c - 1, 0));
              document.removeEventListener('touchend', handleEnd);
            };
            document.addEventListener('touchend', handleEnd);
          }}
        >
          {slides}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)}
              className="rounded-full transition-all"
              style={{ width: i === safeSlide ? 16 : 6, height: 6, background: i === safeSlide ? '#1a1a1a' : 'rgba(0,0,0,0.15)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}