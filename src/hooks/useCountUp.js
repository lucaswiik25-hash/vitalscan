import { useState, useEffect } from 'react';

export function useCountUp(target, duration = 800, deps = []) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const end = Math.round(Number(target) || 0);
    if (end === 0) {
      setValue(0);
      return;
    }
    const startTime = performance.now();
    let raf;
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      setValue(Math.round(end * progress));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    setValue(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, ...deps]);

  return value;
}
