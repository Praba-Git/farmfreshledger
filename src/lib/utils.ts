import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSafeTime(date: any): number | null {
  if (!date) return null;
  if (date.toMillis) return date.toMillis();
  if (date instanceof Date) return date.getTime();
  if (typeof date === 'number') return date;
  if (typeof date === 'string') return new Date(date).getTime();
  return null;
}

/**
 * Formats a Date object as YYYY-MM-DD in local time.
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a Date object at midnight in local time.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
