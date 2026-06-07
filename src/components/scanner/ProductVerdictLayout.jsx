import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';

export const THEME = {
  primaryColor: '#7b9bd1',
  backgroundColor: '#f5f5f5',
  surfaceColor: '#ffffff',
  textColor: '#1a1a1a',
  secondaryTextColor: '#888888',
  mutedTextColor: '#bbbbbb',
  borderColor: '#eeeeee',
  successColor: '#2e7d32',
  successLight: '#e8f5e9',
  successBorder: '#c8e6c9',
  warningColor: '#ff9800',
  dangerColor: '#f44336',
  starColor: '#ffc107',
  fontHeading: 'var(--font-serif)',
  fontBody: 'var(--font-inter)',
};

export function TabNav({ tabs, activeTab, onTabChange }) {
  const trackRef = useRef(null);
  const tabRefs = useRef({});
  const [underline, setUnderline] = useState({ x: 0, width: 0 });

  useLayoutEffect(() => {
    const track = trackRef.current;
    const el = tabRefs.current[activeTab];
    if (!track || !el) return;
    const trackRect = track.getBoundingClientRect();
    const tabRect = el.getBoundingClientRect();
    setUnderline({
      x: tabRect.left - trackRect.left,
      width: tabRect.width,
    });
  }, [activeTab, tabs]);

  return (
    <div style={{ borderBottom: `1px solid ${THEME.borderColor}`, marginBottom: 24 }}>
      <div className="tab-nav-track flex relative" ref={trackRef}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[tab.id] = el; }}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="press-scale"
              style={{
                flex: 1,
                paddingBottom: 12,
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? THEME.textColor : THEME.mutedTextColor,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontFamily: THEME.fontBody,
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
        <div
          className="tab-nav-underline"
          style={{
            width: underline.width,
            transform: `translateX(${underline.x}px)`,
          }}
        />
      </div>
    </div>
  );
}

export function SectionHeading({ children, subtitle }) {
  return (
    <div style={{ marginBottom: subtitle ? 8 : 16 }}>
      <p
        style={{
          fontFamily: THEME.fontHeading,
          fontSize: 20,
          fontWeight: 500,
          color: THEME.textColor,
          marginBottom: subtitle ? 8 : 0,
        }}
      >
        {children}
      </p>
      {subtitle && (
        <p style={{ fontSize: 12, color: THEME.mutedTextColor, marginBottom: 16 }}>{subtitle}</p>
      )}
    </div>
  );
}

export function DetailRows({ items }) {
  return (
    <div>
      {items.filter((item) => item.value).map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between"
          style={{
            padding: '14px 0',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <span style={{ fontSize: 14, color: THEME.secondaryTextColor }}>{item.label}</span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: item.color || '#333333',
              textAlign: 'right',
              maxWidth: '55%',
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function NumberedSteps({ steps }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {steps.map((step, idx) => (
        <div key={idx} className="flex gap-3">
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: THEME.textColor,
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            {step.title && (
              <p style={{ fontSize: 15, fontWeight: 600, color: THEME.textColor, marginBottom: 4 }}>
                {step.title}
              </p>
            )}
            <p style={{ fontSize: 13, color: THEME.secondaryTextColor, lineHeight: 1.5 }}>
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function IngredientTag({ label, onClick, variant = 'good' }) {
  const styles = {
    good: { background: THEME.successLight, color: THEME.successColor, border: `1px solid ${THEME.successBorder}` },
    caution: { background: '#fff3e0', color: '#e65100', border: '1px solid #ffe0b2' },
    bad: { background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2' },
  };
  const s = styles[variant] || styles.good;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...s,
        borderRadius: 20,
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: 500,
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: THEME.fontBody,
      }}
    >
      {label}
    </button>
  );
}

export function IngredientListItem({ name, rating, ratingColor, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between"
      style={{
        background: '#f8f8f8',
        borderRadius: 16,
        padding: '14px 18px',
        marginBottom: 10,
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 500, color: '#333333' }}>{name}</span>
      {rating && (
        <span className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 500, color: ratingColor }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: ratingColor,
              display: 'inline-block',
            }}
          />
          {rating}
        </span>
      )}
    </button>
  );
}

export function IngredientDetailModal({ ingredient, onClose, benefitsLabel = 'Benefits' }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const badgeVariants = {
    beneficial: { background: THEME.successLight, color: THEME.successColor },
    caution: { background: '#fff3e0', color: '#e65100' },
    neutral: { background: '#f5f5f5', color: THEME.secondaryTextColor },
    avoid: { background: '#ffebee', color: '#c62828' },
  };
  const badgeStyle = badgeVariants[ingredient.badgeType] || badgeVariants.neutral;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className={`bottom-sheet-backdrop absolute inset-0 ${visible ? 'is-visible' : ''}`}
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className={`bottom-sheet-panel absolute bottom-0 left-0 right-0 overflow-y-auto ${visible ? 'is-visible' : ''}`}
        style={{
          background: THEME.surfaceColor,
          borderRadius: '32px 32px 0 0',
          maxHeight: '70%',
          padding: 24,
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <p
            style={{
              fontFamily: THEME.fontHeading,
              fontSize: 22,
              fontWeight: 600,
              color: THEME.textColor,
              flex: 1,
              paddingRight: 12,
            }}
          >
            {ingredient.title}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center shrink-0"
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: '#f5f5f5',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 18, color: '#666666', lineHeight: 1 }}>×</span>
          </button>
        </div>

        {ingredient.badge && (
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600,
              marginBottom: 12,
              ...badgeStyle,
            }}
          >
            {ingredient.badge}
          </span>
        )}

        {ingredient.description && (
          <p style={{ fontSize: 14, lineHeight: 1.6, color: '#555555', marginBottom: 20 }}>
            {ingredient.description}
          </p>
        )}

        {ingredient.function && (
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#999999',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 6,
              }}
            >
              Function
            </p>
            <p style={{ fontSize: 14, color: '#444444', lineHeight: 1.5 }}>{ingredient.function}</p>
          </div>
        )}

        {ingredient.benefits && (
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#999999',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 6,
              }}
            >
              {benefitsLabel}
            </p>
            <p style={{ fontSize: 14, color: '#444444', lineHeight: 1.5 }}>{ingredient.benefits}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductVerdictLayout({
  imageUrl,
  onBack,
  brand,
  productName,
  description,
  tabs,
  activeTab,
  onTabChange,
  children,
  footer,
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col bottom-sheet-panel ${visible ? 'is-visible' : ''}`}
      style={{ background: THEME.backgroundColor }}
    >
      {/* Hero background */}
      <div className="relative shrink-0" style={{ height: '32%', minHeight: 220 }}>
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(8px)', transform: 'scale(1.15)' }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, #e8ddd0 0%, #d4c4b0 50%, #c9b8a0 100%)',
                opacity: 0.55,
                mixBlendMode: 'multiply',
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #e8ddd0 0%, #d4c4b0 50%, #c9b8a0 100%)',
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.6) 100%)',
          }}
        />

        <button
          type="button"
          onClick={onBack}
          className="absolute flex items-center justify-center"
          style={{
            top: 55,
            left: 20,
            width: 36,
            height: 36,
            borderRadius: 18,
            background: 'rgba(255,255,255,0.25)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={18} color="#333333" />
        </button>
      </div>

      {/* Content card */}
      <div
        className="flex-1 flex flex-col min-h-0"
        style={{
          background: THEME.surfaceColor,
          borderRadius: '32px 32px 0 0',
          marginTop: -32,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: '28px 24px 20px' }}
        >
          {brand && (
            <p
              style={{
                fontFamily: THEME.fontHeading,
                fontSize: 18,
                fontWeight: 400,
                color: THEME.primaryColor,
                textAlign: 'center',
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              {brand}
            </p>
          )}
          <p
            style={{
              fontFamily: THEME.fontHeading,
              fontSize: 24,
              fontWeight: 500,
              color: THEME.textColor,
              textAlign: 'center',
              lineHeight: 1.3,
              marginBottom: 12,
            }}
          >
            {productName}
          </p>
          {description && (
            <p
              style={{
                fontFamily: THEME.fontBody,
                fontSize: 13,
                color: THEME.secondaryTextColor,
                textAlign: 'center',
                lineHeight: 1.5,
                paddingLeft: 20,
                paddingRight: 20,
                marginBottom: 24,
              }}
            >
              {description}
            </p>
          )}

          <TabNav tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
          {children}
        </div>
        {footer}
      </div>
    </div>
  );
}
