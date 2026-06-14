export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export const DEMO_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'demo@local.dev',
};

export function createDefaultProfile() {
  const now = new Date().toISOString();
  const today = now.split('T')[0];
  return {
    id: 'demo-profile',
    user_id: DEMO_USER.id,
    name: 'Demo User',
    age: 28,
    weight: 75,
    height: 175,
    sex: 'male',
    activity_level: 'moderately_active',
    goal: 'maintain',
    diet_mode: 'none',
    preferences: '',
    allergens: [],
    calorie_target: 2200,
    protein_target: 140,
    carbs_target: 250,
    fat_target: 70,
    fiber_target: 30,
    sugar_target: 50,
    sodium_target: 2300,
    water_target_ml: 2500,
    streak: 1,
    last_active_date: today,
    appearance_mode: false,
    onboarding_complete: true,
    skincare_onboarding_done: true,
    supplement_onboarding_done: true,
    skin_type: 'combination',
    skin_concerns: [],
    hair_type: 'straight',
    hair_concerns: [],
    health_conditions: [],
    created_at: now,
    updated_at: now,
  };
}
