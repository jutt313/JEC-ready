// Japanese date utilities for Reiwa era conversion
// Reiwa era started on May 1, 2019

const REIWA_START_DATE = new Date('2019-05-01');
const REIWA_START_YEAR = 2019;

/**
 * Converts a Western date to Japanese Reiwa era format
 * @param date - The date to convert
 * @returns String in format "R{year}/{month}/{day}" (e.g., "R7/09/23")
 */
export function toReiwaFormat(date: Date): string {
  if (date < REIWA_START_DATE) {
    throw new Error('Date is before Reiwa era (May 1, 2019)');
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();
  
  const reiwaYear = year - REIWA_START_YEAR + 1;
  
  return `R${reiwaYear}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
}

/**
 * Converts a Reiwa era format string to a Date object
 * @param reiwaString - String in format "R{year}/{month}/{day}" (e.g., "R7/09/23")
 * @returns Date object
 */
export function fromReiwaFormat(reiwaString: string): Date {
  const match = reiwaString.match(/^R(\d+)\/(\d{1,2})\/(\d{1,2})$/);
  
  if (!match) {
    throw new Error('Invalid Reiwa format. Expected format: R{year}/{month}/{day}');
  }

  const [, reiwaYear, month, day] = match;
  const westernYear = parseInt(reiwaYear) + REIWA_START_YEAR - 1;
  
  return new Date(westernYear, parseInt(month) - 1, parseInt(day));
}

/**
 * Gets the current date in Reiwa format
 * @returns String in format "R{year}/{month}/{day}"
 */
export function getCurrentReiwaDate(): string {
  return toReiwaFormat(new Date());
}

/**
 * Validates if a date is within the Reiwa era
 * @param date - The date to validate
 * @returns boolean
 */
export function isValidReiwaDate(date: Date): boolean {
  return date >= REIWA_START_DATE;
}

/**
 * Gets the current Reiwa year
 * @returns number representing the current Reiwa year
 */
export function getCurrentReiwaYear(): number {
  const currentYear = new Date().getFullYear();
  return currentYear - REIWA_START_YEAR + 1;
}