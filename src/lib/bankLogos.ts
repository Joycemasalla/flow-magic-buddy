// Bundled bank logos — no external requests.
// Uses real SVG paths from simple-icons when available, otherwise a clean monogram on the brand color.
import { siNubank, siPicpay, siMercadopago, siPagseguro } from 'simple-icons';

export interface BankLogoDef {
  hex: string;
  /** SVG path (24x24 viewBox) for real brand glyphs. */
  svgPath?: string;
  /** Fallback monogram text when no path is bundled. */
  monogram?: string;
  /** Light contrast color used on top of `hex`. Defaults to white. */
  fg?: string;
}

export const BANK_LOGOS: Record<string, BankLogoDef> = {
  nubank: { hex: '#820AD1', svgPath: siNubank.path },
  itau: { hex: '#EC7000', monogram: 'i' },
  bradesco: { hex: '#CC092F', monogram: 'B' },
  bb: { hex: '#FAE128', monogram: 'BB', fg: '#003DA5' },
  caixa: { hex: '#0070AF', monogram: 'C' },
  santander: { hex: '#EC0000', monogram: 'S' },
  inter: { hex: '#FF7A00', monogram: 'I' },
  c6: { hex: '#242424', monogram: 'C6' },
  picpay: { hex: '#21C25E', svgPath: siPicpay.path },
  mercadopago: { hex: '#00B1EA', svgPath: siMercadopago.path },
  pagbank: { hex: '#048138', svgPath: siPagseguro.path, fg: '#FFC801' },
};

export const BANK_PREFIX = 'bank:';

export const isBankSlug = (value?: string | null): value is string =>
  !!value && value.startsWith(BANK_PREFIX);

export const getBankSlug = (value?: string | null): string | null =>
  isBankSlug(value) ? value.slice(BANK_PREFIX.length) : null;

export const getBankLogo = (slug?: string | null): BankLogoDef | null => {
  if (!slug) return null;
  return BANK_LOGOS[slug] ?? null;
};

export const bankLogoValue = (slug: string): string => `${BANK_PREFIX}${slug}`;
