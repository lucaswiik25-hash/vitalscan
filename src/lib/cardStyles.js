/** Thin black stroke for cards/modules app-wide */
export const MODULE_BORDER = '1px solid #000000';

export const moduleCardShadow = '0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)';

export const moduleCardStyle = {
  border: MODULE_BORDER,
  boxShadow: moduleCardShadow,
};

export const glassModuleStyle = {
  background: 'rgba(255,255,255,0.60)',
  backdropFilter: 'blur(24px) saturate(200%)',
  WebkitBackdropFilter: 'blur(24px) saturate(200%)',
  border: MODULE_BORDER,
};
