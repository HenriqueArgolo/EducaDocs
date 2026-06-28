'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ProgressStepsProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProgressSteps({ steps, currentStep, className }: ProgressStepsProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between relative">
        {/* Progress Bar Background */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-200 -translate-y-1/2 rounded-full z-0" />
        
        {/* Active Progress Bar */}
        <motion.div 
          className="absolute top-1/2 left-0 h-1 bg-primary-600 -translate-y-1/2 rounded-full z-0"
          initial={false}
          animate={{ width: `${(Math.max(0, currentStep) / (steps.length - 1)) * 100}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />

        {steps.map((step, index) => {
          const isCompleted = currentStep > index;
          const isActive = currentStep === index;
          
          return (
            <div key={step} className="relative z-10 flex flex-col items-center">
              <motion.div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors duration-300 overflow-hidden',
                  isCompleted ? 'bg-primary-600 border-primary-600 text-white' : 
                  isActive ? 'bg-surface-0 border-primary-500 text-primary-600 shadow-md' : 
                  'bg-surface-0 border-surface-300 text-surface-400'
                )}
                initial={false}
                animate={{
                  scale: isActive ? 1.2 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 45 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <motion.span
                      key="number"
                      initial={{ scale: 0, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0, y: -10 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      {index + 1}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
              <div className="absolute top-10 w-24 text-center">
                <span className={cn(
                  'text-xs font-medium transition-colors duration-300',
                  isActive ? 'text-primary-600 font-bold' : 
                  isCompleted ? 'text-text-900' : 
                  'text-text-500'
                )}>
                  {step}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
