import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getProfileList, upsertProfile } from '@/lib/db';
import { signOut } from '@/lib/auth';

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => getProfileList(),
  });

  const profile = profiles[0] || {};
  const [saving, setSaving] = useState(false);

  const updateField = async (field, value) => {
    if (!profile.id) return;
    setSaving(true);
    await upsertProfile({ [field]: value });
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <Settings className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="px-5 space-y-4">
        {/* User info */}
        <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-foreground">
              {profile.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{profile.name || 'User'}</h2>
              <p className="text-sm text-muted-foreground">
                {profile.age && `${profile.age} yrs`} {profile.weight && `• ${profile.weight} kg`} {profile.height && `• ${profile.height} cm`}
              </p>
            </div>
          </div>
        </div>

        {/* Diet mode */}
        <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">Diet Mode</h3>
          <Select value={profile.diet_mode || 'none'} onValueChange={(v) => updateField('diet_mode', v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['none', 'vegan', 'vegetarian', 'keto', 'gluten_free', 'paleo', 'mediterranean'].map(d => (
                <SelectItem key={d} value={d}>{d === 'none' ? 'No restrictions' : d.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Activity level */}
        <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">Activity Level</h3>
          <Select value={profile.activity_level || 'moderately_active'} onValueChange={(v) => updateField('activity_level', v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'].map(a => (
                <SelectItem key={a} value={a}>{a.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Goal */}
        <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">Goal</h3>
          <Select value={profile.goal || 'maintain'} onValueChange={(v) => updateField('goal', v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['lose_weight', 'maintain', 'gain_muscle', 'lean_bulk'].map(g => (
                <SelectItem key={g} value={g}>{g.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Daily targets */}
        <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">Daily Targets</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['🔥 Calories', `${profile.calorie_target || 0} kcal`],
              ['🍖 Protein', `${profile.protein_target || 0}g`],
              ['🌾 Carbs', `${profile.carbs_target || 0}g`],
              ['🫒 Fat', `${profile.fat_target || 0}g`],
              ['💧 Water', `${profile.water_target_ml || 0} ml`],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-bold text-foreground">{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Appearance mode toggle */}
        <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Appearance Mode</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Track skin & bloat impacts</p>
          </div>
          <button
            onClick={() => updateField('appearance_mode', !profile.appearance_mode)}
            className={`w-12 h-7 rounded-full transition-colors ${profile.appearance_mode ? 'bg-foreground' : 'bg-muted'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${profile.appearance_mode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-between text-destructive h-12 rounded-xl"
          onClick={() => signOut()}
        >
          <span>Log out</span>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}