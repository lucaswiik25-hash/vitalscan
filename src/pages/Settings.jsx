import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, User, Shield, Info, RefreshCw, Trash2, Pencil, Check, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { animCard, usePageVisible, pageRevealStyle } from '@/lib/animHelpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserProfile } from '../hooks/useUserProfile';
import { calculateTargets } from '../lib/calculateTargets';
import BodyProfileSection from '../components/settings/BodyProfileSection';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const DIET_OPTIONS = [
  { id: 'none', label: 'No restrictions' },
  { id: 'standard', label: 'Standard' },
  { id: 'calorie_deficit', label: 'Calorie Deficit' },
  { id: 'high_protein', label: 'High Protein' },
  { id: 'keto', label: 'Ketogenic' },
  { id: 'carnivore', label: 'Carnivore' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'pescatarian', label: 'Pescatarian' },
  { id: 'gluten_free', label: 'Gluten Free' },
  { id: 'dairy_free', label: 'Dairy Free' },
  { id: 'paleo', label: 'Paleo' },
  { id: 'mediterranean', label: 'Mediterranean' },
  { id: 'intermittent_fasting', label: 'Intermittent Fasting' },
  { id: 'low_sodium', label: 'Low Sodium' },
  { id: 'low_sugar', label: 'Low Sugar' },
  { id: 'appearance_mode', label: '✦ Appearance Mode' },
];

const GOAL_LABELS = {
  lose_weight: 'Lose Weight',
  maintain: 'Maintain',
  gain_muscle: 'Gain Muscle',
  lean_bulk: 'Lean Bulk',
};

const ACTIVITY_LABELS = {
  sedentary: 'Sedentary',
  lightly_active: 'Lightly Active',
  moderately_active: 'Moderately Active',
  very_active: 'Very Active',
  extra_active: 'Extra Active',
};

export default function Settings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [togglePress, setTogglePress] = useState(false);

  const { profile } = useUserProfile();
  const { logout } = useAuth();
  const pageVisible = usePageVisible();

  const startEdit = () => {
    setEditForm({ name: profile.name || '', age: profile.age || '', weight: profile.weight || '', height: profile.height || '' });
    setEditingProfile(true);
  };

  const upsert = async (updates) => {
    if (profile.id) {
      await base44.entities.UserProfile.update(profile.id, updates);
    } else {
      await base44.entities.UserProfile.create(updates);
    }
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  };

  const recalculateAndSave = async (updates) => {
    const merged = { ...profile, ...updates };
    const targets = calculateTargets(merged);
    await upsert({ ...updates, ...targets });
  };

  const saveEdit = async () => {
    if (!profile.id) return;
    setSaving(true);
    await recalculateAndSave({
      name: editForm.name,
      age: Number(editForm.age),
      weight: Number(editForm.weight),
      height: Number(editForm.height),
    });
    setSaving(false);
    setEditingProfile(false);
  };

  const updateField = async (field, value) => {
    if (!profile.id) return;
    setSaving(true);
    const needsRecalc = ['goal', 'weight', 'activity_level', 'age', 'height', 'sex'].includes(field);
    if (needsRecalc) {
      await recalculateAndSave({ [field]: value });
    } else {
      await upsert({ [field]: value });
    }
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
    <div className="min-h-screen pb-10" style={pageRevealStyle(pageVisible)}>
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>
      {/* Delete Account confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm glow-card">
            <h2 className="text-lg font-bold text-foreground mb-2">Delete Account</h2>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to permanently delete your account? All your data will be lost and this action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-12 rounded-2xl bg-secondary text-sm font-semibold text-foreground">
                Cancel
              </button>
              <button onClick={async () => { await logout(); }}
                className="flex-1 h-12 rounded-2xl bg-destructive text-sm font-semibold text-white">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 space-y-4">
        {/* Profile summary */}
        <div {...animCard(0, pageVisible)} className="bg-white rounded-[24px] p-5 glow-card">
          {!editingProfile ? (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-xl font-bold text-foreground shrink-0">
                {profile.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground">{profile.name || 'User'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {profile.age ? `${profile.age}y` : ''}{profile.age && profile.weight ? ' · ' : ''}{profile.weight ? `${profile.weight}kg` : ''}{profile.height ? ` · ${profile.height}cm` : ''}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{GOAL_LABELS[profile.goal] || profile.goal?.replace(/_/g, ' ')} · {DIET_OPTIONS.find(d => d.id === profile.diet_mode)?.label || profile.diet_mode?.replace(/_/g, ' ')}</p>
              </div>
              <button onClick={startEdit} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-foreground">Edit Profile</p>
                <button onClick={() => setEditingProfile(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              {[
                { label: 'Name', key: 'name', type: 'text' },
                { label: 'Age', key: 'age', type: 'number' },
                { label: 'Weight (kg)', key: 'weight', type: 'number' },
                { label: 'Height (cm)', key: 'height', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <input
                    type={type}
                    value={editForm[key]}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
              ))}
              <button onClick={saveEdit} disabled={saving}
                className="w-full h-11 rounded-2xl bg-foreground text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? 'Saving...' : <><Check className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          )}
        </div>

        {/* Diet & Goals */}
        <div {...animCard(1, pageVisible)} className="bg-white rounded-[24px] px-5 glow-card">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-4 pb-2">Diet & Goals</p>
          <SettingRow icon={User} label="Goal">
            <Select value={profile.goal || 'maintain'} onValueChange={v => updateField('goal', v)}>
              <SelectTrigger className="w-36 rounded-xl border-0 bg-secondary h-8 text-xs">
                <SelectValue>{GOAL_LABELS[profile.goal] || profile.goal?.replace(/_/g, ' ')}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GOAL_LABELS).map(([id, label]) => (
                  <SelectItem key={id} value={id} className="text-xs">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow icon={null} label="Activity Level">
            <Select value={profile.activity_level || 'moderately_active'} onValueChange={v => updateField('activity_level', v)}>
              <SelectTrigger className="w-40 rounded-xl border-0 bg-secondary h-8 text-xs">
                <SelectValue>{ACTIVITY_LABELS[profile.activity_level] || profile.activity_level?.replace(/_/g, ' ')}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTIVITY_LABELS).map(([id, label]) => (
                  <SelectItem key={id} value={id} className="text-xs">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow icon={null} label="Diet Mode">
            <Select value={profile.diet_mode || 'none'} onValueChange={v => updateField('diet_mode', v)}>
              <SelectTrigger className="w-36 rounded-xl border-0 bg-secondary h-8 text-xs">
                <SelectValue>{DIET_OPTIONS.find(d => d.id === (profile.diet_mode || 'none'))?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DIET_OPTIONS.map(d => (
                  <SelectItem key={d.id} value={d.id} className="text-xs">{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <div className="pb-1" />
        </div>

        {/* Appearance */}
        <div {...animCard(2, pageVisible)} className="bg-white rounded-[24px] px-5 glow-card">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-4 pb-2">Preferences</p>
          <SettingRow icon={Shield} label="Appearance Mode">
            <button
              onClick={() => updateField('appearance_mode', !profile.appearance_mode)}
              onMouseDown={() => setTogglePress(true)}
              onMouseUp={() => setTogglePress(false)}
              onMouseLeave={() => setTogglePress(false)}
              onTouchStart={() => setTogglePress(true)}
              onTouchEnd={() => setTogglePress(false)}
              className={`toggle-switch w-11 h-6 rounded-full relative ${profile.appearance_mode ? 'is-on' : ''} ${togglePress ? 'is-pressing' : ''}`}
              style={{ background: profile.appearance_mode ? '#1a1a1a' : 'hsl(var(--muted))' }}>
              <div className="toggle-thumb absolute top-0.5 w-5 h-5 bg-white rounded-full shadow" />
            </button>
          </SettingRow>
          <div className="pb-1" />
        </div>

        {/* Daily targets */}
        <div {...animCard(3, pageVisible)} className="bg-white rounded-[24px] p-5 glow-card">
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
        </div>

        {/* About */}
        <div {...animCard(4, pageVisible)} className="bg-white rounded-[24px] px-5 glow-card">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-4 pb-2">About</p>
          <SettingRow icon={Info} label="Version">
            <span className="text-xs text-muted-foreground">Scanly v1.0</span>
          </SettingRow>
          <div className="pb-1" />
        </div>

        {/* Body Profile */}
        <BodyProfileSection profile={profile} onSave={async (updates) => {
          if (!profile.id) return;
          await base44.entities.UserProfile.update(profile.id, updates);
          queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        }} pageVisible={pageVisible} />

        {/* Redo Onboarding */}
        <button {...animCard(5, pageVisible)}
          onClick={() => navigate('/onboarding')}
          className="press-scale w-full bg-white rounded-[24px] px-5 py-4 flex items-center gap-3 glow-card">
          <RefreshCw className="w-4 h-4 text-foreground" />
          <span className="text-sm font-semibold text-foreground">Redo Onboarding</span>
        </button>

        {/* Logout */}
        <button {...animCard(6, pageVisible)}
          onClick={() => logout()}
          className="press-scale w-full bg-white rounded-[24px] px-5 py-4 flex items-center gap-3 glow-card">
          <LogOut className="w-4 h-4 text-destructive" />
          <span className="text-sm font-semibold text-destructive">Log Out</span>
        </button>

        {/* Delete Account */}
        <button {...animCard(7, pageVisible)}
          onClick={() => setShowDeleteConfirm(true)}
          className="press-scale w-full bg-white rounded-[24px] px-5 py-4 flex items-center gap-3 glow-card">
          <Trash2 className="w-4 h-4 text-destructive" />
          <span className="text-sm font-semibold text-destructive">Delete Account</span>
        </button>
      </div>
    </div>
  );
}