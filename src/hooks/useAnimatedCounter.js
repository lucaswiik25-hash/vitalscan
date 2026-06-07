import { useEffect, useRef, useState } from 'react';

/** Slide-out / slide-in number animation for hydration & meal counters */
export function useAnimatedCounter(value) {
  const [display, setDisplay] = useState(value);
  const [animClass, setAnimClass] = useState('');
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    setAnimClass('counter-out-up');
    const t1 = setTimeout(() => {
      setDisplay(value);
      setAnimClass('counter-in-up');
      prev.current = value;
      const t2 = setTimeout(() => setAnimClass(''), 200);
      return () => clearTimeout(t2);
    }, 150);
    return () => clearTimeout(t1);
  }, [value]);

  return { display, animClass };
}
