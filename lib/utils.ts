import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to "DD MMM YYYY" format
 * @param date A Date object or timestamp (number)
 * @returns Formatted date string
 */
export function formatDate(date: Date | number) {
  return format(date, "dd MMM yyyy")
}
