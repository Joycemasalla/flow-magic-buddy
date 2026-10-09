/**
 * Utility functions for local dates handling without timezone shifting.
 */

/**
 * Parses a YYYY-MM-DD string into a Date object representing midnight in the local timezone.
 * This prevents the day from shifting backwards when parsed as UTC.
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  // if it's already a full ISO string, try to parse it safely
  if (dateString.includes('T')) {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return new Date();

  return new Date(year, month - 1, day);
}

/**
 * Formats a Date object to YYYY-MM-DD string in local timezone.
 */
export function formatLocalDate(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds months to a date, clamping the day to the last day of the target month if necessary.
 * (e.g., Jan 31 + 1 month = Feb 28/29)
 */
export function addMonthsClamped(date: Date, monthsToAdd: number): Date {
  const d = new Date(date.getTime());
  const expectedMonth = (d.getMonth() + monthsToAdd) % 12;
  d.setMonth(d.getMonth() + monthsToAdd);
  
  // If the month rolled over too far (e.g., Jan 31 -> Feb 31 -> Mar 3), clamp back
  if (d.getMonth() !== expectedMonth && d.getMonth() !== (expectedMonth + 12) % 12) {
    d.setDate(0); // Set to last day of previous month
  }
  return d;
}
