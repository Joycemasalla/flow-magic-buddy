import { useLayoutEffect, useRef, useState, ReactNode } from 'react';
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

  useLayoutEffect(() => {
    let frame = 0;

    const fit = () => {
      const container = containerRef.current;
      const text = textRef.current;
      if (!container || !text) return;
      const available = Math.floor(container.getBoundingClientRect().width) - 2;
      if (available <= 0) return;

      // Measure at max size, then scale down with a small safety margin.
      text.style.fontSize = `${max}px`;
      const measured = Math.ceil(text.scrollWidth || text.getBoundingClientRect().width);
      if (measured <= available) {
        setSize((current) => (current === max ? current : max));
        return;
      }
      const next = Math.max(min, Math.floor(max * (available / measured) * 0.96));
      setSize((current) => (current === next ? current : next));
    };

    const scheduleFit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };

    fit();
    const ro = new ResizeObserver(fit);
    if (containerRef.current) ro.observe(containerRef.current);

    document.fonts?.ready.then(scheduleFit).catch(() => undefined);
    window.addEventListener('resize', scheduleFit);
    window.addEventListener('orientationchange', scheduleFit);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('resize', scheduleFit);
      window.removeEventListener('orientationchange', scheduleFit);
    };
  }, [children, max, min]);

  return (
    <div ref={containerRef} className="block w-full max-w-full min-w-0 overflow-hidden">
      <span
        ref={textRef}
        className={cn('inline-block max-w-none whitespace-nowrap leading-[1.05]', className)}
        style={{ fontSize: `${size}px`, letterSpacing: 0 }}
      >
        {children}
      </span>
    </div>
  );
}
