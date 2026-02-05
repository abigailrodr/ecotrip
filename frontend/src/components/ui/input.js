// Input Component
// A styled text input field

import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        // Base styles
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        // Focus styles
        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Placeholder and disabled styles
        "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        // File input styles
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
