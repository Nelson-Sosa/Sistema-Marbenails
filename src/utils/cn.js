import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility to merge Tailwind CSS classes safely, resolving conflicts.
 * Combines clsx (conditional classes) with tailwind-merge (conflict resolution).
 *
 * @param {...any} inputs - Class values (strings, arrays, objects)
 * @returns {string} Merged and deduplicated class string
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-rose-500', 'px-6')
 * // => 'py-2 bg-rose-500 px-6'  (px-4 is overridden by px-6)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
