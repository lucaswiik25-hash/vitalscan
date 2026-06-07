import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import ProductVerdictLayout, {
  THEME,
  SectionHeading,
  DetailRows,
  NumberedSteps,
  IngredientTag,
  IngredientListItem,
  IngredientDetailModal,
} from './ProductVerdictLayout';

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'howtouse', label: 'How to use' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'analysis', label: 'Analysis' },
];

const verdictConfig = {
  recommended: { color: THEME.successColor, label: 'Recommended', badgeType: 'beneficial' },
  'use with caution': { color: '#e65100', label: 'Use with Caution', badgeType: 'caution' },
  avoid: { color: THEME.dangerColor, label: 'Avoid', badgeType: 'avoid' },
};

function safetyToRating(rating) {
  const v = (rating || '').toLowerCase();
  if (v === 'safe') return { label: 'Good', color: '#4caf50', badgeType: 'beneficial', tagVariant: 'good' };
  if (v === 'caution') return { label: 'Caution', color: '#ff9800', badgeType: 'caution', tagVariant: 'caution' };
  return { label: 'Avoid', color: '#f44336', badgeType: 'avoid', tagVariant: 'bad' };
}

function buildIngredientModal(ing) {
  const rating = safetyToRating(ing.safety_rating);
  const flags = [
    ing.is_irritant && 'Potential irritant',
    ing.is_allergen && 'Known allergen',
    ing.is_comedogenic && `Comedogenic (${ing.comedogenic_rating || '?'}/5)`,
    ing.is_hormone_disruptor && 'Hormone disruptor',
  ].filter(Boolean);

  return {
    title: ing.name || ing.inci_name,
    badge: ing.is_active_beneficial ? 'Beneficial' : rating.label,
    badgeType: ing.is_active_beneficial ? 'beneficial' : rating.badgeType,
    description: ing.skin_effect || 'No detailed description available for this ingredient.',
    function: ing.body_benefit || ing.body_risk || null,
    benefits: flags.length > 0 ? flags.join(' · ') : (ing.body_benefit || null),
  };
}

function ScoreDisplay({ score, label }) {
  const pct = Math.min(100, Math.max(0, score || 0));
  const color = pct >= 70 ? THEME.successColor : pct >= 40 ? THEME.warningColor : THEME.dangerColor;
  return (
    <div
      className="flex items-center gap-4"
      style={{ background: '#f8f8f8', borderRadius: 16, padding: 16, marginBottom: 20 }}
    >
      <p style={{ fontFamily: THEME.fontHeading, fontSize: 36, fontWeight: 700, color: THEME.textColor }}>
        {pct}
      </p>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: color }}>{label}</p>
        <p style={{ fontSize: 12, color: THEME.secondaryTextColor }}>Safety score out of 100</p>
      </div>
    </div>
  );
}

export default function SkincareVerdictPage({ result, onBack }) {
  const [activeTab, setActiveTab] = useState('ingredients');
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  const vc = verdictConfig[(result?.verdict || '').toLowerCase()] || verdictConfig['use with caution'];
  const ingredients = result?.ingredients || [];
  const keyIngredients = [
    ...(result?.top_beneficial || []),
    ...ingredients.filter((i) => i.is_active_beneficial).map((i) => i.name || i.inci_name),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  const description = result?.verdict_reason || result?.marketing_claims?.[0] || null;

  const detailItems = [
    { label: 'Verdict', value: vc.label, color: vc.color },
    result?.safety_score != null && { label: 'Safety Score', value: `${result.safety_score}/100` },
    result?.skin_type_suitability && { label: 'Skin Type', value: result.skin_type_suitability },
    result?.eye_area_safe != null && {
      label: 'Eye Area',
      value: result.eye_area_safe ? 'Safe' : 'Avoid',
      color: result.eye_area_safe ? THEME.successColor : THEME.dangerColor,
    },
    result?.pregnancy_safe != null && {
      label: 'Pregnancy',
      value: result.pregnancy_safe ? 'Safe' : 'Not recommended',
      color: result.pregnancy_safe ? THEME.successColor : THEME.dangerColor,
    },
    result?.frequency && { label: 'Frequency', value: result.frequency },
    result?.product_type && { label: 'Product Type', value: result.product_type },
  ].filter(Boolean);

  const howToSteps = result?.routine_steps?.length
    ? result.routine_steps.map((s) => {
        const match = s.match(/^\d+\.\s*(.+?)(?::\s*(.+))?$/);
        return match
          ? { title: match[1], description: match[2] || '' }
          : { title: null, description: s };
      })
    : [
        result?.routine_step && { title: 'When to use', description: result.routine_step },
        result?.application_method && { title: 'Application', description: result.application_method },
        result?.apply_after && { title: 'Layering', description: result.apply_after },
        result?.do_not_combine && { title: 'Do not combine', description: result.do_not_combine },
        result?.results_timeline && { title: 'Results timeline', description: result.results_timeline },
      ].filter(Boolean);

  return (
    <>
      <ProductVerdictLayout
        imageUrl={result?.image_url}
        onBack={onBack}
        brand={result?.brand}
        productName={result?.product_name || 'Skincare Product'}
        description={description}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <div key={activeTab} className="tab-content-enter">
        {activeTab === 'details' && (
          <div>
            {result?._loadingDetails ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: THEME.mutedTextColor }} />
                <span style={{ fontSize: 13, color: THEME.mutedTextColor }}>Loading full analysis...</span>
              </div>
            ) : (
              <>
                {result?.safety_score != null && <ScoreDisplay score={result.safety_score} label={vc.label} />}
                <DetailRows items={detailItems} />
              </>
            )}
          </div>
        )}

        {activeTab === 'howtouse' && (
          <div>
            {howToSteps.length > 0 ? (
              <NumberedSteps steps={howToSteps} />
            ) : result?._loadingDetails ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: THEME.mutedTextColor }} />
                <span style={{ fontSize: 13, color: THEME.mutedTextColor }}>Loading usage instructions...</span>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: THEME.secondaryTextColor }}>No usage instructions available.</p>
            )}
          </div>
        )}

        {activeTab === 'ingredients' && (
          <div>
            {keyIngredients.length > 0 && (
              <>
                <SectionHeading subtitle="Tap on ingredient to see details">Key ingredients</SectionHeading>
                <div className="flex flex-wrap gap-2" style={{ marginBottom: 24 }}>
                  {keyIngredients.map((name) => {
                    const ing = ingredients.find(
                      (i) => (i.name || i.inci_name)?.toLowerCase() === name.toLowerCase()
                    );
                    const rating = ing ? safetyToRating(ing.safety_rating) : { tagVariant: 'good' };
                    return (
                      <IngredientTag
                        key={name}
                        label={name}
                        variant={rating.tagVariant}
                        onClick={() => ing && setSelectedIngredient(buildIngredientModal(ing))}
                      />
                    );
                  })}
                </div>
              </>
            )}

            <SectionHeading>All ingredients</SectionHeading>
            {ingredients.length > 0 ? (
              ingredients.map((ing, idx) => {
                const rating = safetyToRating(ing.safety_rating);
                return (
                  <IngredientListItem
                    key={idx}
                    name={ing.name || ing.inci_name}
                    rating={rating.label}
                    ratingColor={rating.color}
                    onClick={() => setSelectedIngredient(buildIngredientModal(ing))}
                  />
                );
              })
            ) : (
              <p style={{ fontSize: 13, color: THEME.secondaryTextColor }}>No ingredients found.</p>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div>
            {result?._loadingDetails ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: THEME.mutedTextColor }} />
                <span style={{ fontSize: 13, color: THEME.mutedTextColor }}>Loading analysis...</span>
              </div>
            ) : (
              <>
                {result?.top_beneficial?.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <SectionHeading>Beneficial highlights</SectionHeading>
                    <div className="flex flex-wrap gap-2">
                      {result.top_beneficial.map((item, idx) => (
                        <IngredientTag key={idx} label={item} variant="good" />
                      ))}
                    </div>
                  </div>
                )}
                {result?.top_concerning?.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <SectionHeading>Concerning ingredients</SectionHeading>
                    <div className="flex flex-wrap gap-2">
                      {result.top_concerning.map((item, idx) => (
                        <IngredientTag key={idx} label={item} variant="bad" />
                      ))}
                    </div>
                  </div>
                )}
                {result?.long_term_summary && (
                  <div>
                    <SectionHeading>Long-term use</SectionHeading>
                    <p style={{ fontSize: 14, color: '#555555', lineHeight: 1.6 }}>{result.long_term_summary}</p>
                  </div>
                )}
                {!result?.top_beneficial?.length && !result?.top_concerning?.length && !result?.long_term_summary && (
                  <p style={{ fontSize: 13, color: THEME.secondaryTextColor }}>No analysis available yet.</p>
                )}
              </>
            )}
          </div>
        )}
        </div>
      </ProductVerdictLayout>

      {selectedIngredient && (
        <IngredientDetailModal
          ingredient={selectedIngredient}
          onClose={() => setSelectedIngredient(null)}
          benefitsLabel="Notes"
        />
      )}
    </>
  );
}
