import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState('input'); // 'input' | 'analyzing' | 'review'
  const [parsedProfile, setParsedProfile] = useState(null);

  const analyzeProfile = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setStep('analyzing');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze the following user description and extract their profile data for a nutrition/health tracking app. The user wrote:

"${text}"

Extract: name, age, weight (in kg), height (in cm), sex (male/female/other), activity level (sedentary/lightly_active/moderately_active/very_active/extra_active), goal (lose_weight/maintain/gain_muscle/lean_bulk), diet mode (none/vegan/vegetarian/keto/gluten_free/paleo/mediterranean), any food preferences or allergies.

Then calculate:
- Daily calorie target using Mifflin-St Jeor equation with their activity multiplier and goal adjustment
- Protein target (typically 1.6-2.2g per kg body weight based on activity)
- Fat target (about 25-30% of calories / 9)
- Carbs target (remaining calories / 4)
- Water target in ml (about 35ml per kg body weight adjusted for activity)

If any info is missing, make reasonable assumptions for a healthy individual.`,
      response_json_schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          weight: { type: 'number' },
          height: { type: 'number' },
          sex: { type: 'string' },
          activity_level: { type: 'string' },
          goal: { type: 'string' },
          diet_mode: { type: 'string' },
          preferences: { type: 'string' },
          allergens: { type: 'array', items: { type: 'string' } },
          calorie_target: { type: 'number' },
          protein_target: { type: 'number' },
          carbs_target: { type: 'number' },
          fat_target: { type: 'number' },
          water_target_ml: { type: 'number' },
        },
      },
    });

    setParsedProfile(result);
    setStep('review');
    setIsAnalyzing(false);
  };

  const saveProfile = async () => {
    setIsAnalyzing(true);
    await base44.entities.UserProfile.create({
      ...parsedProfile,
      fiber_target: 30,
      sugar_target: 50,
      sodium_target: 2300,
      streak: 1,
      last_active_date: new Date().toISOString().split('T')[0],
      onboarding_complete: true,
      appearance_mode: false,
    });
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-16 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl">🍏</span>
          <span className="text-2xl font-bold text-foreground">Cal AI</span>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mt-6">Tell us about yourself</h1>
        <p className="text-muted-foreground mt-2">Write freely — our AI will understand your goals, body metrics, and preferences.</p>
      </div>

      <div className="flex-1 px-6">
        {step === 'input' && (
          <div className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. My name is Lucas, I'm 68kg, 16 years old, I train 5-6 times a week. I sit a lot in school but I do train a lot. I want to gain muscle. I'm not vegan but I try to eat clean..."
              className="min-h-[200px] text-base rounded-[20px] border-border bg-white p-4 resize-none focus:ring-1 focus:ring-foreground"
            />
            <Button
              onClick={analyzeProfile}
              disabled={!text.trim()}
              className="w-full h-14 rounded-2xl bg-foreground text-white font-semibold text-base gap-2 glass-button hover:bg-foreground/90"
            >
              <Sparkles className="w-5 h-5" />
              Analyze with AI
            </Button>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-foreground animate-spin" />
            </div>
            <p className="text-lg font-semibold text-foreground">Analyzing your profile...</p>
            <p className="text-sm text-muted-foreground mt-1">Setting up your personalized plan</p>
          </div>
        )}

        {step === 'review' && parsedProfile && (
          <div className="space-y-4">
            <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4">Your Profile</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Name', parsedProfile.name],
                  ['Age', parsedProfile.age],
                  ['Weight', `${parsedProfile.weight} kg`],
                  ['Height', `${parsedProfile.height} cm`],
                  ['Sex', parsedProfile.sex],
                  ['Activity', parsedProfile.activity_level?.replace(/_/g, ' ')],
                  ['Goal', parsedProfile.goal?.replace(/_/g, ' ')],
                  ['Diet', parsedProfile.diet_mode === 'none' ? 'No restrictions' : parsedProfile.diet_mode],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold text-foreground capitalize">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4">Daily Targets</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['🔥 Calories', `${parsedProfile.calorie_target} kcal`],
                  ['🍖 Protein', `${parsedProfile.protein_target}g`],
                  ['🌾 Carbs', `${parsedProfile.carbs_target}g`],
                  ['🫒 Fat', `${parsedProfile.fat_target}g`],
                  ['💧 Water', `${parsedProfile.water_target_ml} ml`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={saveProfile}
              disabled={isAnalyzing}
              className="w-full h-14 rounded-2xl bg-foreground text-white font-semibold text-base gap-2"
            >
              {isAnalyzing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Let's go
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}