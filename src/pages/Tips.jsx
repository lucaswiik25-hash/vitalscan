import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { animCard, usePageVisible } from '@/lib/animHelpers';
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
    <div className="min-h-screen pb-24 font-[Inter,ui-sans-serif,system-ui,-apple-system,sans-serif]">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-[28px] font-extrabold text-[#101114]">Tips</h1>
        <p className="text-sm text-[#6d7079] mt-1">Personalised for you</p>
      </div>

      {/* Tab pills */}
      <div className="px-4 mb-5 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="inline-flex shrink-0 items-center gap-1.5 min-h-11 px-4 rounded-full text-sm font-extrabold transition-all shadow-[0_14px_38px_rgba(16,17,20,.05)] backdrop-blur-2xl"
            style={{
              background: activeTab === t.key ? '#121316' : 'rgba(255,255,255,0.8)',
              color: activeTab === t.key ? '#fff' : '#464951',
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