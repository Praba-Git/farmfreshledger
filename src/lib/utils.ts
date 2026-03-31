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
