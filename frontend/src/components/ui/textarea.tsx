import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-surface-200 bg-surface-0 text-text-900 px-3 py-2 text-sm transition-all duration-300 placeholder:text-text-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/20 focus-visible:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm resize-y",
          error && "border-error-500 focus-visible:ring-error-500/20 focus-visible:border-error-500",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
