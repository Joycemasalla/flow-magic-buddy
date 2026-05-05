import { useEffect, useRef, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AutoFitTextProps {
  children: ReactNode;
  /** Maximum font size in px */
  max?: number;
  /** Minimum font size in px */
  min?: number;
  className?: string;
}

/**
 * Shrinks text font-size to fit its parent's width without overflowing.
 * Keeps content on a single line and avoids truncation that would hide digits.
 */
export function AutoFitText({ children, max = 72, min = 20, className }: AutoFitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(max);

  useEffect(() => {
    const fit = () => {
      const container = containerRef.current;
      const text = textRef.current;
      if (!container || !text) return;
      const available = container.clientWidth;
      if (available <= 0) return;

      // Reset to max, then measure and scale down
      text.style.fontSize = `${max}px`;
      const measured = text.scrollWidth;
      if (measured <= available) {
        setSize(max);
        return;
      }
      const ratio = available / measured;
      const next = Math.max(min, Math.floor(max * ratio));
      setSize(next);
    };

    fit();
    const ro = new ResizeObserver(fit);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [children, max, min]);

  return (
    <div ref={containerRef} className="w-full min-w-0 overflow-hidden">
      <span
        ref={textRef}
        className={cn('block whitespace-nowrap leading-[1.05]', className)}
        style={{ fontSize: `${size}px` }}
      >
        {children}
      </span>
    </div>
  );
}
