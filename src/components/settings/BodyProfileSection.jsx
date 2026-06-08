import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { animCard } from '@/lib/animHelpers';

const SKIN_TYPES = ['oily', 'dry', 'combination', 'normal', 'sensitive'];
const SKIN_CONCERNS_OPTIONS = ['acne', 'redness', 'aging', 'hyperpigmentation', 'dullness'];
const HAIR_TYPES = ['oily', 'dry', 'normal', 'damaged', 'curly', 'fine'];
const HAIR_CONCERNS_OPTIONS = ['dandruff', 'frizz', 'thinning', 'color-treated'];
const HEALTH_CONDITIONS_OPTIONS = ['digestive_issues', 'hormonal_imbalance', 'sleep_problems', 'anxiety', 'heart_health', 'joint_pain'];

const CONDITION_LABELS = {
  digestive_issues: 'Digestive issues',
  hormonal_imbalance: 'Hormonal imbalance',
  sleep_problems: 'Sleep problems',
  anxiety: 'Anxiety / Stress',
  heart_health: 'Heart health',
  joint_pain: 'Joint pain',
};

function ChipSelect({ options, selected, onChange, labels }) {
  const toggle = (v) => {
    if (selected.includes(v)) onChange(selected.filter(s => s !== v));
    else onChange([...selected, v]);
  };
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(o => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all capitalize"
            style={{
              borderColor: active ? '#111827' : 'hsl(var(--border))',
              background: active ? '#111827' : 'hsl(var(--secondary))',
              color: active ? 'white' : 'hsl(var(--foreground))',
            }}
          >
            {labels?.[o] || o.replace(/_/g, ' ')}
          </button>
        );
      })}
    </div>
  );
}

function ProfileField({ label, value, onEdit }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">
          {value || <span className="text-muted-foreground italic">Not set — tap to add</span>}
        </p>
      </div>
      <button onClick={onEdit} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 ml-3">
        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}

export default function BodyProfileSection({ profile, onSave, pageVisible }) {
  const [editing, setEditing] = useState(null); // 'skin_type' | 'skin_concerns' | 'hair_type' | 'hair_concerns' | 'health_conditions'
  const [tempValue, setTempValue] = useState(null);
  const [saving, setSaving] = useState(false);

  const startEdit = (field) => {
    setTempValue(profile[field] ?? (Array.isArray(profile[field]) ? [] : null));
    setEditing(field);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ [editing]: tempValue });
    setSaving(false);
    setEditing(null);
  };

  const formatArrayValue = (arr) => arr && arr.length > 0 ? arr.map(v => v.replace(/_/g, ' ')).join(', ') : null;

  return (
    <div {...animCard(3.5, pageVisible)} className="bg-white rounded-[24px] px-5 glow-card">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-4 pb-2">Body Profile</p>

      {editing ? (
        <div className="pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-foreground capitalize">{editing.replace(/_/g, ' ')}</p>
            <button onClick={() => setEditing(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>

          {/* Single select fields */}
          {(editing === 'skin_type' || editing === 'hair_type') && (
            <div className="flex flex-wrap gap-2">
              {(editing === 'skin_type' ? SKIN_TYPES : HAIR_TYPES).map(opt => (
                <button
                  key={opt}
                  onClick={() => setTempValue(opt)}
                  className="px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all capitalize"
                  style={{
                    borderColor: tempValue === opt ? '#111827' : 'hsl(var(--border))',
                    background: tempValue === opt ? '#111827' : 'hsl(var(--secondary))',
                    color: tempValue === opt ? 'white' : 'hsl(var(--foreground))',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Multi select fields */}
          {editing === 'skin_concerns' && (
            <ChipSelect
              options={SKIN_CONCERNS_OPTIONS}
              selected={tempValue || []}
              onChange={setTempValue}
            />
          )}
          {editing === 'hair_concerns' && (
            <ChipSelect
              options={HAIR_CONCERNS_OPTIONS}
              selected={tempValue || []}
              onChange={setTempValue}
            />
          )}
          {editing === 'health_conditions' && (
            <ChipSelect
              options={HEALTH_CONDITIONS_OPTIONS}
              selected={tempValue || []}
              onChange={setTempValue}
              labels={CONDITION_LABELS}
            />
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 mt-4 rounded-2xl bg-foreground text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? 'Saving...' : <><Check className="w-4 h-4" /> Save</>}
          </button>
        </div>
      ) : (
        <div>
          <ProfileField
            label="Skin Type"
            value={profile.skin_type ? profile.skin_type.charAt(0).toUpperCase() + profile.skin_type.slice(1) : null}
            onEdit={() => { setTempValue(profile.skin_type || null); setEditing('skin_type'); }}
          />
          <ProfileField
            label="Skin Concerns"
            value={formatArrayValue(profile.skin_concerns)}
            onEdit={() => { setTempValue(profile.skin_concerns || []); setEditing('skin_concerns'); }}
          />
          <ProfileField
            label="Hair Type"
            value={profile.hair_type ? profile.hair_type.charAt(0).toUpperCase() + profile.hair_type.slice(1) : null}
            onEdit={() => { setTempValue(profile.hair_type || null); setEditing('hair_type'); }}
          />
          <ProfileField
            label="Hair Concerns"
            value={formatArrayValue(profile.hair_concerns)}
            onEdit={() => { setTempValue(profile.hair_concerns || []); setEditing('hair_concerns'); }}
          />
          <ProfileField
            label="Health Conditions"
            value={formatArrayValue((profile.health_conditions || []).map(c => CONDITION_LABELS[c] || c))}
            onEdit={() => { setTempValue(profile.health_conditions || []); setEditing('health_conditions'); }}
          />
          <div className="pb-1" />
        </div>
      )}
    </div>
  );
}