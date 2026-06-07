import React, { useState } from 'react';
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
  { id: 'other', label: 'Other' },
];

const verdictConfig = {
  yes: { color: THEME.successColor, label: 'Recommended' },
  maybe: { color: '#e65100', label: 'Use with Caution' },
  no: { color: THEME.dangerColor, label: 'Avoid' },
  recommended: { color: THEME.successColor, label: 'Recommended' },
  'use with caution': { color: '#e65100', label: 'Use with Caution' },
  avoid: { color: THEME.dangerColor, label: 'Avoid' },
};

function flagToRating(flag) {
  const v = (flag || '').toLowerCase();
  if (v === 'correctly dosed' || v === 'none' || v === 'beneficial') {
    return { label: 'Good', color: '#4caf50', badgeType: 'beneficial', tagVariant: 'good' };
  }
  if (v === 'underdosed' || v === 'moderate' || v === 'medium' || v === 'caution') {
    return { label: 'Caution', color: '#ff9800', badgeType: 'caution', tagVariant: 'caution' };
  }
  if (v === 'overdose risk' || v === 'poor form') {
    return { label: 'Avoid', color: '#f44336', badgeType: 'avoid', tagVariant: 'bad' };
  }
  if (v === 'filler') {
    return { label: 'Filler', color: '#ff9800', badgeType: 'neutral', tagVariant: 'caution' };
  }
  return { label: 'Neutral', color: '#ff9800', badgeType: 'neutral', tagVariant: 'caution' };
}

function buildIngredientModal(ing) {
  const rating = flagToRating(ing.flag || ing.quality_rating);
  return {
    title: ing.name,
    badge: ing.flag && ing.flag !== 'None' ? ing.flag : rating.label,
    badgeType: rating.badgeType,
    description: [ing.amount && `Amount: ${ing.amount}`, ing.dri_percent && `${ing.dri_percent}% of daily value`]
      .filter(Boolean)
      .join(' · ') || 'No detailed description available for this ingredient.',
    function: ing.form_quality || ing.bioavailability
      ? [ing.form_quality, ing.bioavailability && `Bioavailability: ${ing.bioavailability}`].filter(Boolean).join(' · ')
      : null,
    benefits: ing.body_benefit || ing.body_risk || null,
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
        <p style={{ fontSize: 12, color: THEME.secondaryTextColor }}>Quality score out of 100</p>
      </div>
    </div>
  );
}

export default function SupplementVerdictPage({ result, onBack }) {
  const [activeTab, setActiveTab] = useState('ingredients');
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  const verdictKey = (result?.verdict || '').toLowerCase();
  const vc = verdictConfig[verdictKey] || verdictConfig['maybe'];
  const ingredients = result?.ingredients || [];
  const keyIngredients = ingredients
    .filter((i) => {
      const f = (i.flag || '').toLowerCase();
      return f === 'correctly dosed' || f === 'none' || !i.flag;
    })
    .slice(0, 5)
    .map((i) => i.name);

  const description = result?.verdict_reason || result?.marketing_claims?.[0] || null;

  const detailItems = [
    { label: 'Verdict', value: vc.label, color: vc.color },
    result?.quality_score != null && { label: 'Quality Score', value: `${result.quality_score}/100` },
    result?.format && { label: 'Format', value: result.format },
    result?.serving_size && { label: 'Serving Size', value: result.serving_size },
    result?.servings_per_container != null && {
      label: 'Servings',
      value: String(result.servings_per_container),
    },
    result?.estimated_duration && { label: 'Duration', value: result.estimated_duration },
    result?.primary_ingredient && { label: 'Primary Active', value: result.primary_ingredient },
  ].filter(Boolean);

  const howToSteps = [
    result?.best_time_to_take && { title: 'Best time', description: result.best_time_to_take },
    result?.food_note && { title: 'With food', description: result.food_note },
    result?.absorption_tip && { title: 'Absorption tip', description: result.absorption_tip },
    result?.cycle_recommendation && { title: 'Cycling', description: result.cycle_recommendation },
    result?.stack_with && { title: 'Stack with', description: result.stack_with },
    result?.results_timeline && { title: 'Results timeline', description: result.results_timeline },
    result?.interactions && { title: 'Interactions', description: result.interactions },
  ].filter(Boolean);

  return (
    <>
      <ProductVerdictLayout
        imageUrl={result?.image_url}
        onBack={onBack}
        brand={result?.brand}
        productName={result?.product_name || 'Supplement'}
        description={description}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <div key={activeTab} className="tab-content-enter">
        {activeTab === 'details' && (
          <div>
            {result?.quality_score != null && <ScoreDisplay score={result.quality_score} label={vc.label} />}
            <DetailRows items={detailItems} />
          </div>
        )}

        {activeTab === 'howtouse' && (
          <div>
            {howToSteps.length > 0 ? (
              <NumberedSteps steps={howToSteps} />
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
                    const ing = ingredients.find((i) => i.name === name);
                    const rating = ing ? flagToRating(ing.flag) : { tagVariant: 'good' };
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
                const rating = flagToRating(ing.flag || ing.quality_rating);
                return (
                  <IngredientListItem
                    key={idx}
                    name={ing.name}
                    rating={ing.flag && ing.flag !== 'None' ? ing.flag : rating.label}
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

        {activeTab === 'other' && (
          <div>
            {result?.other_ingredients_flags?.length > 0 ? (
              <>
                <SectionHeading>Other ingredients & additives</SectionHeading>
                <div className="flex flex-wrap gap-2">
                  {result.other_ingredients_flags.map((flag, idx) => (
                    <IngredientTag key={idx} label={flag} variant="caution" />
                  ))}
                </div>
              </>
            ) : (
              <>
                <SectionHeading>Other ingredients</SectionHeading>
                <p style={{ fontSize: 13, color: THEME.secondaryTextColor }}>
                  No additional flags or fillers detected.
                </p>
              </>
            )}
            {result?.secondary_ingredients?.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <SectionHeading>Secondary actives</SectionHeading>
                <div className="flex flex-wrap gap-2">
                  {result.secondary_ingredients.map((name, idx) => (
                    <IngredientTag key={idx} label={name} variant="good" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </ProductVerdictLayout>

      {selectedIngredient && (
        <IngredientDetailModal
          ingredient={selectedIngredient}
          onClose={() => setSelectedIngredient(null)}
          benefitsLabel="Body Effects"
        />
      )}
    </>
  );
}
