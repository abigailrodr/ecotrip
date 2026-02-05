// Utility function for merging Tailwind CSS classes
// Combines clsx (for conditional classes) with tailwind-merge (for deduplication)

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// cn = "class names" - a common naming convention
// Example: cn("px-4 py-2", isActive && "bg-blue-500", "px-6")
// This would merge classes and handle conflicts (px-6 wins over px-4)
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
