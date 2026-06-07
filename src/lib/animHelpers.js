/** Staggered card animation props — add to any card/module on page load */
export function animCard(index = 0, extraClass = '') {
  return {
    className: `anim-card ${extraClass}`.trim(),
    style: { '--anim-i': index },
  };
}

/** Bottom sheet visibility classes */
export function sheetClasses(visible, closing) {
  return {
    backdrop: `bottom-sheet-backdrop ${closing ? 'is-closing' : visible ? 'is-visible' : ''}`,
    panel: `bottom-sheet-panel ${closing ? 'is-closing' : visible ? 'is-visible' : ''}`,
  };
}
