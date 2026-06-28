'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { useMotionValue, useMotionTemplate } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
  highlighted?: boolean;
  spotlight?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, glass = false, highlighted = false, spotlight = false, children, ...props }, ref) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    const classes = cn(
      'relative rounded-xl border bg-surface-50 p-6 shadow-sm transition-colors overflow-hidden group/card',
      glass && 'glass',
      highlighted && 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/20',
      !highlighted && 'border-surface-200',
      hover && 'cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all',
      className
    );
    const spotlightBackground = useMotionTemplate`
      radial-gradient(
        450px circle at ${mouseX}px ${mouseY}px,
        rgba(99, 102, 241, 0.1),
        transparent 80%
      )
    `;

    const content = (
      <>
        {spotlight && (
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover/card:opacity-100"
            style={{ background: spotlightBackground }}
          />
        )}
        <div className="relative z-10">{children}</div>
      </>
    );

    return (
      <div
        ref={ref}
        onMouseMove={spotlight ? handleMouseMove : undefined}
        className={classes}
        {...props}
      >
        {content}
      </div>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold text-text-900', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-text-500 mt-1', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
