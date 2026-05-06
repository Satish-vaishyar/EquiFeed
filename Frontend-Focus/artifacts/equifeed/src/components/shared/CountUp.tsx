import { useEffect, useState } from 'react';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

interface CountUpProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}

export function CountUp({ value, duration = 1200, format }: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, value, duration]);

  const display = format ? format(count) : count.toLocaleString();

  return (
    <span
      ref={ref}
      style={{ fontFamily: 'var(--app-font-mono)' }}
    >
      {display}
    </span>
  );
}
