import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, User, Shield, Info, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserProfile } from '../hooks/useUserProfile';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut', delay },
});

export default function Settings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const { profile } = useUserProfile();

  const updateField = async (field, value) => {
    if (!profile.id) return;
    setSaving(true);
    await base44.entities.UserProfile.update(profile.id, { [field]: value });
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    setSaving(false);
  };

  const SettingRow = ({ icon: IconComp, label, children, danger }) => (
    <div className={`flex items-center justify-between py-3.5 border-b border-border last:border-0 ${danger ? 'text-destructive' : ''}`}>
      <div className="flex items-center gap-3">
        {IconComp && <IconComp className={`w-4 h-4 ${danger ? 'text-destructive' : 'text-muted-foreground'}`} />}
        <span className={`text-sm font-medium ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen pb-10">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="px-5 space-y-4">
        {/* Profile summary */}
        <motion.div {...fadeUp(0)} className="bg-white border border-border rounded-[24px] p-5 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-xl font-bold text-foreground">
            {profile.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-bold text-foreground">{profile.name || 'User'}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile.goal?.replace(/_/g, ' ')} · {profile.diet_mode?.replace(/_/g, ' ')}</p>
          </div>
        </motion.div>

        {/* Diet & Goals */}
        <motion.div {...fadeUp(0.12)} className="bg-white border border-border rounded-[24px] px-5 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-4 pb-2">Diet & Goals</p>
          <SettingRow icon={User} label="Goal">
            <Select value={profile.goal || 'maintain'} onValueChange={v => updateField('goal', v)}>
              <SelectTrigger className="w-36 rounded-xl border-0 bg-secondary h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['lose_weight', 'maintain', 'gain_muscle', 'lean_bulk'].map(g => (
                  <SelectItem key={g} value={g} className="text-xs capitalize">{g.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow icon={null} label="Activity Level">
            <Select value={profile.activity_level || 'moderately_active'} onValueChange={v => updateField('activity_level', v)}>
              <SelectTrigger className="w-40 rounded-xl border-0 bg-secondary h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'].map(a => (
                  <SelectItem key={a} value={a} className="text-xs capitalize">{a.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow icon={null} label="Diet Mode">
            <Select value={profile.diet_mode || 'none'} onValueChange={v => updateField('diet_mode', v)}>
              <SelectTrigger className="w-36 rounded-xl border-0 bg-secondary h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['none', 'standard', 'keto', 'vegan', 'vegetarian', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free', 'carnivore', 'low_sodium', 'low_sugar', 'high_protein', 'calorie_deficit'].map(d => (
                  <SelectItem key={d} value={d} className="text-xs capitalize">{d === 'none' ? 'No restrictions' : d.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <div className="pb-1" />
        </motion.div>

        {/* Appearance */}
        <motion.div {...fadeUp(0.24)} className="bg-white border border-border rounded-[24px] px-5 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-4 pb-2">Preferences</p>
          <SettingRow icon={Shield} label="Appearance Mode">
            <button
              onClick={() => updateField('appearance_mode', !profile.appearance_mode)}
              className="w-11 h-6 rounded-full transition-colors relative"
              style={{ background: profile.appearance_mode ? '#1a1a1a' : 'hsl(var(--muted))' }}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${profile.appearance_mode ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </SettingRow>
          <div className="pb-1" />
        </motion.div>

        {/* Daily targets */}
        <motion.div {...fadeUp(0.36)} className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Daily Targets</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Calories', `${profile.calorie_target || 0} kcal`],
              ['Protein', `${profile.protein_target || 0}g`],
              ['Carbs', `${profile.carbs_target || 0}g`],
              ['Fat', `${profile.fat_target || 0}g`],
              ['Water', `${profile.water_target_ml || 0} ml`],
              ['Sodium', `${profile.sodium_target || 2300} mg`],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-xs text-muted-foreground">{l}</p>
                <p className="text-sm font-bold text-foreground">{v}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* About */}
        <motion.div {...fadeUp(0.48)} className="bg-white border border-border rounded-[24px] px-5 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-4 pb-2">About</p>
          <SettingRow icon={Info} label="Version">
            <span className="text-xs text-muted-foreground">Scanly v1.0</span>
          </SettingRow>
          <div className="pb-1" />
        </motion.div>

        {/* Redo Onboarding */}
        <motion.button {...fadeUp(0.56)}
          onClick={() => navigate('/onboarding')}
          className="w-full bg-white border border-border rounded-[24px] px-5 py-4 flex items-center gap-3 shadow-sm active:scale-[0.98] transition-transform">
          <RefreshCw className="w-4 h-4 text-foreground" />
          <span className="text-sm font-semibold text-foreground">Redo Onboarding</span>
        </motion.button>

        {/* Logout */}
        <motion.button {...fadeUp(0.64)}
          onClick={() => base44.auth.logout()}
          className="w-full bg-white border border-destructive/20 rounded-[24px] px-5 py-4 flex items-center gap-3 shadow-sm active:scale-[0.98] transition-transform">
          <LogOut className="w-4 h-4 text-destructive" />
          <span className="text-sm font-semibold text-destructive">Log Out</span>
        </motion.button>
      </div>
    </div>
  );
}