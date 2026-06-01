import { BankLogoDef } from '@/lib/bankLogos';
import { cn } from '@/lib/utils';

interface Props {
  logo: BankLogoDef;
  sizeClass: string; // e.g. 'w-11 h-11'
  rounded?: string; // e.g. 'rounded-2xl'
  glyphScale?: number; // 0..1 inner size ratio
  className?: string;
}

/** Renders a bundled bank glyph (SVG path or monogram) on top of the brand color. */
export default function BankLogo({ logo, sizeClass, rounded = 'rounded-2xl', glyphScale = 0.6, className }: Props) {
  const fg = logo.fg ?? '#fff';
  return (
    <div
      className={cn('flex items-center justify-center shrink-0 overflow-hidden', sizeClass, rounded, className)}
      style={{ backgroundColor: logo.hex, color: fg }}
    >
      {logo.svgPath ? (
        <svg
          viewBox="0 0 24 24"
          width="100%"
          height="100%"
          style={{ padding: `${(1 - glyphScale) * 50}%`, fill: fg }}
          aria-hidden="true"
        >
          <path d={logo.svgPath} />
        </svg>
      ) : (
        <span
          className="font-bold tracking-tight leading-none"
          style={{
            fontSize: `calc(100% * ${glyphScale * 1.3})`,
            // Better visual size — use the container's font-size via inherited CSS
          }}
        >
          {logo.monogram}
        </span>
      )}
    </div>
  );
}
