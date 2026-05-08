import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Loader2, ShoppingCart, Check, RefreshCw } from 'lucide-react';

const CURRENCIES = [
  { country: 'Finland', currency: '€', code: 'EUR' },
  { country: 'USA', currency: '$', code: 'USD' },
  { country: 'UK', currency: '£', code: 'GBP' },
  { country: 'Sweden', currency: 'kr', code: 'SEK' },
  { country: 'Norway', currency: 'kr', code: 'NOK' },
  { country: 'Germany', currency: '€', code: 'EUR' },
  { country: 'Australia', currency: '$', code: 'AUD' },
  { country: 'Canada', currency: '$', code: 'CAD' },
];

export default function ShoppingList() {
  const [budget, setBudget] = useState('');
  const [country, setCountry] = useState('Finland');
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState({});

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles[0] || {};
  const curr = CURRENCIES.find(c => c.country === country) || CURRENCIES[0];

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
            <div className="flex flex-wrap gap-2">
              {CURRENCIES.map(c => (
                <button key={c.country} onClick={() => setCountry(c.country)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: country === c.country ? '#1a1a1a' : 'hsl(var(--secondary))', color: country === c.country ? 'white' : 'hsl(var(--foreground))' }}>
                  {c.country}
                </button>
              ))}
            </div>
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
            {/* Summary */}
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
    </div>
  );
}