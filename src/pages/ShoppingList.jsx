import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Loader2, ShoppingCart, Check, RefreshCw, X, Search } from 'lucide-react';

const ALL_COUNTRIES = [
  { country: 'Afghanistan', currency: '؋', code: 'AFN' },
  { country: 'Albania', currency: 'L', code: 'ALL' },
  { country: 'Argentina', currency: '$', code: 'ARS' },
  { country: 'Australia', currency: '$', code: 'AUD' },
  { country: 'Austria', currency: '€', code: 'EUR' },
  { country: 'Belgium', currency: '€', code: 'EUR' },
  { country: 'Brazil', currency: 'R$', code: 'BRL' },
  { country: 'Canada', currency: '$', code: 'CAD' },
  { country: 'Chile', currency: '$', code: 'CLP' },
  { country: 'China', currency: '¥', code: 'CNY' },
  { country: 'Colombia', currency: '$', code: 'COP' },
  { country: 'Croatia', currency: '€', code: 'EUR' },
  { country: 'Czech Republic', currency: 'Kč', code: 'CZK' },
  { country: 'Denmark', currency: 'kr', code: 'DKK' },
  { country: 'Egypt', currency: '£', code: 'EGP' },
  { country: 'Estonia', currency: '€', code: 'EUR' },
  { country: 'Finland', currency: '€', code: 'EUR' },
  { country: 'France', currency: '€', code: 'EUR' },
  { country: 'Germany', currency: '€', code: 'EUR' },
  { country: 'Greece', currency: '€', code: 'EUR' },
  { country: 'Hungary', currency: 'Ft', code: 'HUF' },
  { country: 'Iceland', currency: 'kr', code: 'ISK' },
  { country: 'India', currency: '₹', code: 'INR' },
  { country: 'Indonesia', currency: 'Rp', code: 'IDR' },
  { country: 'Ireland', currency: '€', code: 'EUR' },
  { country: 'Israel', currency: '₪', code: 'ILS' },
  { country: 'Italy', currency: '€', code: 'EUR' },
  { country: 'Japan', currency: '¥', code: 'JPY' },
  { country: 'Kenya', currency: 'KSh', code: 'KES' },
  { country: 'Latvia', currency: '€', code: 'EUR' },
  { country: 'Lithuania', currency: '€', code: 'EUR' },
  { country: 'Malaysia', currency: 'RM', code: 'MYR' },
  { country: 'Mexico', currency: '$', code: 'MXN' },
  { country: 'Netherlands', currency: '€', code: 'EUR' },
  { country: 'New Zealand', currency: '$', code: 'NZD' },
  { country: 'Nigeria', currency: '₦', code: 'NGN' },
  { country: 'Norway', currency: 'kr', code: 'NOK' },
  { country: 'Pakistan', currency: '₨', code: 'PKR' },
  { country: 'Philippines', currency: '₱', code: 'PHP' },
  { country: 'Poland', currency: 'zł', code: 'PLN' },
  { country: 'Portugal', currency: '€', code: 'EUR' },
  { country: 'Romania', currency: 'lei', code: 'RON' },
  { country: 'Russia', currency: '₽', code: 'RUB' },
  { country: 'Saudi Arabia', currency: '﷼', code: 'SAR' },
  { country: 'Singapore', currency: '$', code: 'SGD' },
  { country: 'Slovakia', currency: '€', code: 'EUR' },
  { country: 'Slovenia', currency: '€', code: 'EUR' },
  { country: 'South Africa', currency: 'R', code: 'ZAR' },
  { country: 'South Korea', currency: '₩', code: 'KRW' },
  { country: 'Spain', currency: '€', code: 'EUR' },
  { country: 'Sweden', currency: 'kr', code: 'SEK' },
  { country: 'Switzerland', currency: 'CHF', code: 'CHF' },
  { country: 'Thailand', currency: '฿', code: 'THB' },
  { country: 'Turkey', currency: '₺', code: 'TRY' },
  { country: 'UAE', currency: 'د.إ', code: 'AED' },
  { country: 'UK', currency: '£', code: 'GBP' },
  { country: 'USA', currency: '$', code: 'USD' },
  { country: 'Ukraine', currency: '₴', code: 'UAH' },
  { country: 'Vietnam', currency: '₫', code: 'VND' },
];

function CountryPickerModal({ selected, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = ALL_COUNTRIES.filter(c =>
    c.country.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-[32px] pt-6 pb-4" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="text-lg font-bold text-foreground">Choose Your Country</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="px-5 mb-3">
          <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search country..."
              className="flex-1 text-sm focus:outline-none bg-transparent"
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-5 space-y-1 pb-6">
          {filtered.map(c => (
            <button key={c.country} onClick={() => { onSelect(c.country); onClose(); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
              style={{ background: selected === c.country ? 'hsl(var(--secondary))' : 'transparent' }}>
              <span className="text-sm font-medium text-foreground">{c.country}</span>
              <span className="text-xs text-muted-foreground">{c.currency} · {c.code}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ShoppingList() {
  const [budget, setBudget] = useState('');
  const [country, setCountry] = useState('Finland');
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState({});
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles[0] || {};
  const curr = ALL_COUNTRIES.find(c => c.country === country) || ALL_COUNTRIES.find(c => c.country === 'Finland');

  const generateList = async () => {
    if (!budget) return;
    setLoading(true);
    setList(null);
    setChecked({});

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a nutritionist and budget shopper. Create a weekly grocery shopping list for this user.

User profile:
- Diet: ${profile.diet_mode || 'standard'}
- Goal: ${profile.goal}
- Calorie target: ${profile.calorie_target} kcal/day
- Protein target: ${profile.protein_target}g/day
- Allergens to avoid: ${(profile.allergens || []).join(', ') || 'none'}
- Country: ${country} (use realistic ${country} grocery store prices in ${curr.currency})
- Weekly budget: ${curr.currency}${budget}

Create a realistic, complete weekly shopping list. Group items by category. Prices must be accurate for ${country}. Stay within the ${curr.currency}${budget} budget.
Include estimated cost per item and total cost. Make it practical — whole foods, easy to find in local supermarkets.`,
      response_json_schema: {
        type: 'object',
        properties: {
          categories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      quantity: { type: 'string' },
                      estimated_cost: { type: 'number' },
                      notes: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          total_cost: { type: 'number' },
          budget_note: { type: 'string' },
          diet_alignment: { type: 'string' },
        },
      },
    });

    setList(result);
    setLoading(false);
  };

  const toggleCheck = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  const totalItems = list?.categories?.reduce((s, c) => s + c.items.length, 0) || 0;
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Shopping List</h1>
        <p className="text-sm text-muted-foreground mt-0.5">AI-generated based on your diet & budget</p>
      </div>

      <div className="px-5 space-y-4">
        {/* Config */}
        <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Your Country</p>
            <button
              onClick={() => setShowCountryPicker(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-border bg-secondary/30 text-sm font-medium text-foreground active:scale-[0.98] transition-transform">
              <span>{country}</span>
              <span className="text-muted-foreground text-xs">{curr.currency} · {curr.code} — tap to change</span>
            </button>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Weekly Budget ({curr.currency})</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">{curr.currency}</span>
                <input
                  type="number"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="e.g. 80"
                  className="w-full border border-border rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>
              {['50', '80', '120', '200'].map(v => (
                <button key={v} onClick={() => setBudget(v)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-secondary text-foreground">
                  {curr.currency}{v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={generateList} disabled={loading || !budget}
          className="w-full h-14 rounded-2xl bg-foreground text-white font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50">
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Building your list...</> : <><ShoppingCart className="w-5 h-5" /> Generate Shopping List</>}
        </button>

        {list && (
          <>
            <div className="flex gap-3">
              <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm text-center">
                <p className="text-2xl font-extrabold text-foreground">{curr.currency}{list.total_cost?.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Total Cost</p>
              </div>
              <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm text-center">
                <p className="text-2xl font-extrabold text-foreground">{checkedCount}/{totalItems}</p>
                <p className="text-xs text-muted-foreground">Items checked</p>
              </div>
              <button onClick={generateList} className="w-14 bg-secondary border border-border rounded-[20px] flex items-center justify-center shadow-sm">
                <RefreshCw className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {list.diet_alignment && (
              <div className="bg-green-50 border border-green-100 rounded-[20px] px-4 py-3">
                <p className="text-xs text-green-700">{list.diet_alignment}</p>
              </div>
            )}

            {list.budget_note && (
              <div className="bg-secondary/50 border border-border rounded-[20px] px-4 py-3">
                <p className="text-xs text-muted-foreground">{list.budget_note}</p>
              </div>
            )}

            {(list.categories || []).map((cat, ci) => (
              <div key={ci} className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{cat.name}</p>
                <div className="space-y-2">
                  {(cat.items || []).map((item, ii) => {
                    const key = `${ci}-${ii}`;
                    return (
                      <button key={ii} onClick={() => toggleCheck(key)} className="w-full flex items-center gap-3 text-left">
                        <div className="w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all"
                          style={{ borderColor: checked[key] ? '#6CC5A0' : 'hsl(var(--border))', background: checked[key] ? '#6CC5A0' : 'transparent' }}>
                          {checked[key] && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${checked[key] ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.name}</p>
                          {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-foreground">{curr.currency}{item.estimated_cost?.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {showCountryPicker && (
        <CountryPickerModal
          selected={country}
          onSelect={setCountry}
          onClose={() => setShowCountryPicker(false)}
        />
      )}
    </div>
  );
}