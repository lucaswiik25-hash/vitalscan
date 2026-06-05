import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RecipesTab from '../components/tips/RecipesTab';
import SkincareTab from '../components/tips/SkincareTab';
import SupplementsTab from '../components/tips/SupplementsTab';

const TABS = [
  { key: 'recipes', label: 'Recipes', emoji: '🍽️' },
  { key: 'skincare', label: 'Skincare', emoji: '✨' },
  { key: 'supplements', label: 'Supplements', emoji: '💊' },
];

export default function Tips() {
  const [activeTab, setActiveTab] = useState('recipes');

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles[0] || null;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F2F4F8' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>Tips</h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>Personalised for you</p>
      </div>

      {/* Tab pills */}
      <div className="px-5 mb-5 flex gap-2">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: activeTab === t.key ? '#1a2e1a' : '#fff',
              color: activeTab === t.key ? '#fff' : '#4a5568',
              fontSize: 13, fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s',
            }}
          >
            <span>{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'recipes' && <RecipesTab profile={profile} />}
      {activeTab === 'skincare' && <SkincareTab profile={profile} />}
      {activeTab === 'supplements' && <SupplementsTab profile={profile} />}
    </div>
  );
}