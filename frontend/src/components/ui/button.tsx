'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-md hover:shadow-lg',
        secondary:
          'bg-surface-100 text-text-700 hover:bg-surface-200 active:bg-surface-300 border border-surface-200',
        accent:
          'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 shadow-md hover:shadow-lg',
        cta:
          'bg-gradient-to-r from-primary-600 to-accent-500 text-white hover:from-primary-700 hover:to-accent-600 shadow-lg hover:shadow-xl',
        ghost:
          'text-text-600 hover:bg-surface-100 hover:text-text-900',
        destructive:
          'bg-error-500 text-white hover:bg-error-600 active:bg-red-700',
        outline:
          'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
