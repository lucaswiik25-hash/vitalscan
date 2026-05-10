import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X, ScanLine, Leaf, Pill, ShieldCheck, Target, Clock, Smile, PersonStanding } from 'lucide-react';
import { format } from 'date-fns';

const BASE_SCAN_OPTIONS = [
  { title: 'Food Scanner', description: 'Scan any food or barcode to get full nutrition info', icon: ScanLine, path: '/food-scanner', gradient: 'from-orange-50 to-red-50', type: 'food' },
  { title: 'Skincare Analyzer', description: 'Analyze ingredients in any cosmetic product', icon: Leaf, path: '/skincare-scanner', gradient: 'from-pink-50 to-purple-50', type: 'skincare' },
  { title: 'Supplement Scanner', description: 'Check quality and dosage of any supplement', icon: Pill, path: '/supplement-scanner', gradient: 'from-blue-50 to-cyan-50', type: 'supplement' },
];

const typeLabels = { food: 'Food', skincare: 'Skincare', supplement: 'Supplement' };
const typeColors = { food: 'bg-orange-100 text-orange-700', skincare: 'bg-pink-100 text-pink-700', supplement: 'bg-blue-100 text-blue-700' };

function RecentScans() {
  const [activeTab, setActiveTab] = useState(0);
  const touchStartX = useRef(null);

  const { data: scans = [] } = useQuery({
    queryKey: ['scanResults'],
    queryFn: () => base44.entities.ScanResult.list('-created_date', 30),
  });

  const tabs = ['food', 'skincare', 'supplement'];
  const filtered = scans.filter(s => s.type === tabs[activeTab]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50 && activeTab < tabs.length - 1) setActiveTab(t => t + 1);
    if (diff < -50 && activeTab > 0) setActiveTab(t => t - 1);
    touchStartX.current = null;
  };

  return (
    <div className="mt-5 px-5">
      <h2 className="text-sm font-bold text-foreground mb-3">Recent Scans</h2>
      {/* Tab switcher */}
      <div className="flex gap-1 mb-3 bg-secondary rounded-2xl p-1">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: activeTab === i ? 'white' : 'transparent', color: activeTab === i ? '#1a1a1a' : 'hsl(var(--muted-foreground))' }}>
            {typeLabels[t]}
          </button>
        ))}
      </div>

      {/* Swipeable scan list */}
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {filtered.length === 0 ? (
          <div className="bg-white border border-border rounded-[20px] p-6 text-center shadow-sm">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No {typeLabels[tabs[activeTab]].toLowerCase()} scans yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.slice(0, 6).map(scan => (
              <div key={scan.id} className="bg-white border border-border rounded-[20px] p-4 shadow-sm flex items-center gap-3">
                {scan.image_url
                  ? <img src={scan.image_url} className="w-12 h-12 rounded-xl object-cover shrink-0" alt="" />
                  : <div className="w-12 h-12 rounded-xl bg-secondary shrink-0 flex items-center justify-center text-xl">
                      {tabs[activeTab] === 'food' ? '🍽️' : tabs[activeTab] === 'skincare' ? '🧴' : '💊'}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{scan.product_name || 'Unknown'}</p>
                  {scan.brand && <p className="text-xs text-muted-foreground">{scan.brand}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(scan.created_date), 'MMM d, h:mm a')}</p>
                </div>
                <div className="text-right shrink-0">
                  {scan.safety_score != null && (
                    <p className="text-sm font-bold" style={{ color: scan.safety_score >= 70 ? '#16a34a' : scan.safety_score >= 40 ? '#ca8a04' : '#dc2626' }}>
                      {scan.safety_score}
                    </p>
                  )}
                  {scan.verdict && <p className="text-[10px] text-muted-foreground capitalize">{scan.verdict}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScannerHub() {
  const navigate = useNavigate();

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles[0] || {};
  const isAppearanceMode = profile.diet_mode === 'appearance_mode';

  const scanOptions = [
    ...BASE_SCAN_OPTIONS,
    isAppearanceMode
      ? { title: 'Face Analysis', description: 'AI skin analysis linked to your food intake', icon: Smile, path: '/face-scanner', gradient: 'from-purple-50 to-pink-50', type: null }
      : { title: 'Body Analyser', description: 'Find the areas you need to work on most', icon: PersonStanding, path: '/body-scanner', gradient: 'from-green-50 to-teal-50', type: null },
  ];

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <X className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-lg font-bold text-foreground">Scanner</span>
        <div className="w-10" />
      </div>

      <div className="px-5 mt-4 space-y-3">
        {scanOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <Link key={opt.path} to={opt.path}
              className={`block bg-gradient-to-br ${opt.gradient} border border-border rounded-[20px] p-5 shadow-sm active:scale-[0.98] transition-transform`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center shadow-sm">
                  <Icon className="w-6 h-6 text-foreground" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{opt.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{opt.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="px-5 mt-4 flex gap-3">
        <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">Allergen Aware</p>
            <p className="text-xs text-muted-foreground">Auto-detects your allergens</p>
          </div>
        </div>
        <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm flex items-center gap-3">
          <Target className="w-5 h-5 text-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">Goal-Aligned</p>
            <p className="text-xs text-muted-foreground">Matches your diet plan</p>
          </div>
        </div>
      </div>

      <RecentScans />
    </div>
  );
}