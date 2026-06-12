import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { animCard, usePageVisible, pageRevealStyle } from '@/lib/animHelpers';
import RecipesTab from '../components/tips/RecipesTab';
import SkincareTab from '../components/tips/SkincareTab';
import SupplementsTab from '../components/tips/SupplementsTab';
import { getProfileList } from '@/lib/db';

const TABS = [
  { key: 'recipes', label: 'Recipes', emoji: '🍽️' },
  { key: 'skincare', label: 'Skincare', emoji: '✨' },
  { key: 'supplements', label: 'Supplements', emoji: '💊' },
];

export default function Tips() {
  const [activeTab, setActiveTab] = useState('recipes');
  const pageVisible = usePageVisible();

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => getProfileList(),
  });
  const profile = profiles[0] || null;

  return (
    <div className="min-h-screen pb-24" style={pageRevealStyle(pageVisible)}>
      {/* Header */}
      <div {...animCard(0, pageVisible)} className="px-5 pt-14 pb-4">
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>Tips</h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>Personalised for you</p>
      </div>

      {/* Tab pills */}
      <div {...animCard(1, pageVisible)} className="px-5 mb-5 flex gap-2">
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
              border: activeTab === t.key ? '1px solid #1a2e1a' : '1px solid rgba(0, 0, 0, 0.13)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s',
            }}
          >
            <span>{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div {...animCard(2, pageVisible)} key={activeTab} className="tab-content-enter">
        {activeTab === 'recipes' && <RecipesTab profile={profile} pageVisible={pageVisible} />}
        {activeTab === 'skincare' && <SkincareTab profile={profile} />}
        {activeTab === 'supplements' && <SupplementsTab profile={profile} />}
      </div>
    </div>
  );
}
