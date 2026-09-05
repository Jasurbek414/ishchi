import { useEffect, useState } from 'react';
import { useReveal } from './useReveal.js';

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Animates the leading integer inside a raw stat string (e.g. "14" or "0 so'm") once
 *  it scrolls into view, keeping any prefix/suffix text static. */
export function useCounter(raw) {
  const [ref, visible] = useReveal(0.4);
  const [text, setText] = useState(raw);

  useEffect(() => {
    const match = String(raw).match(/^(\D*)(\d+)(.*)$/);
    if (!visible || !match || prefersReducedMotion) {
      setText(raw);
      return;
    }
    const [, prefix, digits, suffix] = match;
    const target = parseInt(digits, 10);
    const duration = 900;
    let start = null;
    let frame;
    function step(ts) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setText(`${prefix}${Math.round(target * eased)}${suffix}`);
      if (progress < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [raw, visible]);

  return [ref, text];
}
