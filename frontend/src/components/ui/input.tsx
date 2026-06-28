import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-surface-200 bg-surface-0 text-text-900 px-3 py-2 text-sm transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/20 focus-visible:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-error-500 focus-visible:ring-error-500/20 focus-visible:border-error-500",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
