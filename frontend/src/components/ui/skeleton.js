// Skeleton Component
// Loading placeholder that shows while content is being fetched
// Creates a pulsing animation effect

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        // Animated pulse effect with muted background
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
