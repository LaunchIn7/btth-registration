/**
 * Format ISO date string to display format
 * @param isoDate - Date in ISO format (YYYY-MM-DD)
 * @returns Formatted date string (e.g., "11 January 2026")
 */
export function formatDisplayDate(isoDate: string): string {
  try {
    const date = new Date(isoDate + 'T00:00:00');
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (error) {
    return isoDate;
  }
}

/**
 * Get day of week from ISO date string
 * @param isoDate - Date in ISO format (YYYY-MM-DD)
 * @returns Day of week (e.g., "Sunday")
 */
export function getDayOfWeek(isoDate: string): string {
  try {
    const date = new Date(isoDate + 'T00:00:00');
    return date.toLocaleString('en-US', { weekday: 'long' });
  } catch (error) {
    return '';
  }
}

/**
 * Enrich exam date with computed fields
 */
export function enrichExamDate<T extends { value: string }>(examDate: T): T & { displayDate: string; dayOfWeek: string } {
  return {
    ...examDate,
    displayDate: formatDisplayDate(examDate.value),
    dayOfWeek: getDayOfWeek(examDate.value),
  };
}
