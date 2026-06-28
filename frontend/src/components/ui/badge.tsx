import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-100 text-primary-900 hover:bg-primary-200",
        secondary:
          "border-transparent bg-surface-100 text-text-900 hover:bg-surface-200",
        accent:
          "border-transparent bg-accent-100 text-accent-900 hover:bg-accent-200",
        destructive:
          "border-transparent bg-error-100 text-error-900 hover:bg-error-200",
        outline: "text-text-900 border-surface-300",
        success: "border-transparent bg-success-100 text-success-900 hover:bg-success-200",
        warning: "border-transparent bg-warning-100 text-warning-900 hover:bg-warning-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
