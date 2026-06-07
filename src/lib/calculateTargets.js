const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

const GOAL_ADJUSTMENTS = {
  lose_weight: -400,
  maintain: 0,
  gain_muscle: 300,
  lean_bulk: 200,
};

export function calculateTargets(profile) {
  const weight = Number(profile.weight) || 70;
  const height = Number(profile.height) || 170;
  const age = Number(profile.age) || 30;
  const sex = profile.sex || 'male';
  const activity = profile.activity_level || 'moderately_active';
  const goal = profile.goal || 'maintain';

  const bmr = sex === 'female'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5;

  const tdee = bmr * (ACTIVITY_MULTIPLIERS[activity] || 1.55);
  const calorie_target = Math.round(tdee + (GOAL_ADJUSTMENTS[goal] ?? 0));

  const proteinPerKg = goal === 'gain_muscle' || goal === 'lean_bulk' ? 2.0 : goal === 'lose_weight' ? 1.8 : 1.6;
  const protein_target = Math.round(weight * proteinPerKg);
  const fat_target = Math.round((calorie_target * 0.28) / 9);
  const carbs_target = Math.round((calorie_target - protein_target * 4 - fat_target * 9) / 4);
  const water_target_ml = Math.round(weight * 35 * (activity === 'very_active' || activity === 'extra_active' ? 1.15 : 1));

  return {
    calorie_target,
    protein_target,
    carbs_target: Math.max(carbs_target, 50),
    fat_target,
    water_target_ml,
  };
}
