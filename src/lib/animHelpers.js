import { useState, useEffect } from 'react';

const CARD_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const CARD_DURATION = 600;

/** Page reveal hook — sets visible 50ms after mount */
export function usePageVisible() {
  const [pageVisible, setPageVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPageVisible(true), 50);
    return () => clearTimeout(t);
  }, []);
  return pageVisible;
}

/** Full-page reveal style — apply to the page root wrapper */
export function pageRevealStyle(pageVisible) {
  return {
    opacity: pageVisible ? 1 : 0,
    transform: pageVisible ? 'translateY(0)' : 'translateY(24px)',
    transition: 'opacity 500ms cubic-bezier(0.22, 1, 0.36, 1), transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
  };
}

/** Staggered card fade-up — inline styles only, never removes from document flow */
export function animCard(index = 0, pageVisible = false, extraStyle = {}) {
  const delay = index * 100;
  return {
    style: {
      position: 'relative',
      opacity: pageVisible ? 1 : 0,
      transform: pageVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity ${CARD_DURATION}ms ${CARD_EASE} ${delay}ms, transform ${CARD_DURATION}ms ${CARD_EASE} ${delay}ms`,
      ...extraStyle,
    },
  };
}

/** Bottom sheet visibility classes */
export function sheetClasses(visible, closing) {
  return {
    backdrop: `bottom-sheet-backdrop ${closing ? 'is-closing' : visible ? 'is-visible' : ''}`,
    panel: `bottom-sheet-panel ${closing ? 'is-closing' : visible ? 'is-visible' : ''}`,
  };
}
