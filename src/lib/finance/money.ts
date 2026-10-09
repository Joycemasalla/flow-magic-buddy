/**
 * Utility functions for money parsing and formatting.
 */

/**
 * Parses a BRL formatted string (e.g. "1.234,56") into a float number (1234.56).
 * Handles user input robustly.
 */
export function parseBRL(value: string | number): number {
  if (typeof value === 'number') return Number(value.toFixed(2));
  if (!value) return 0;
  
  // Remove everything except digits, comma and minus sign
  const cleanStr = value.toString().replace(/[^\d,-]/g, '');
  
  // Replace comma with dot for JS float parsing
  const floatStr = cleanStr.replace(',', '.');
  
  const parsed = parseFloat(floatStr);
  return isNaN(parsed) ? 0 : Number(parsed.toFixed(2));
}

/**
 * Formats a number to BRL currency string (e.g. "R$ 1.234,56").
 */
export function formatBRL(value: number): string {
  if (isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
