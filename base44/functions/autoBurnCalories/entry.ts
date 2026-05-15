import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Mifflin-St Jeor BMR
function calcBMR(profile) {
  const w = profile.weight || 70, h = profile.height || 170, a = profile.age || 25;
  const base = profile.sex === 'female'
    ? 10 * w + 6.25 * h - 5 * a - 161
    : 10 * w + 6.25 * h - 5 * a + 5;
  const multipliers = {
    sedentary: 1.2, lightly_active: 1.375,
    moderately_active: 1.55, very_active: 1.725, extra_active: 1.9,
  };
  return Math.round(base * (multipliers[profile.activity_level] || 1.55));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profiles = await base44.entities.UserProfile.list();
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'No profile found' }, { status: 404 });

    const tdee = calcBMR(profile);
    const today = new Date().toISOString().split('T')[0];

    // Check if we've already logged today's passive burn
    const existing = await base44.entities.Exercise.filter({ date: today });
    const alreadyLogged = existing.some(e => e.name === 'Passive Burn (BMR)');
    if (alreadyLogged) {
      return Response.json({ message: 'Already logged today', tdee });
    }

    // Log 40% of TDEE as passive burn (BMR minus exercise)
    const passiveBurn = Math.round(tdee * 0.4);
    await base44.entities.Exercise.create({
      name: 'Passive Burn (BMR)',
      date: today,
      duration_minutes: 1440,
      calories_burned: passiveBurn,
      category: 'other',
      intensity: 'low',
      notes: 'Automatically calculated from your profile (BMR × activity level)',
    });

    return Response.json({ success: true, tdee, passive_burn: passiveBurn });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});