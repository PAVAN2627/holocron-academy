'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps, useReducedMotion } from 'framer-motion';

import { cn } from '@/lib/utils';

type RevealProps = HTMLMotionProps<'div'> & {
  delay?: number;
};

// Shared fade-in + slide-up wrapper for page and card reveals.
export function Reveal({ className, delay = 0, ...props }: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              duration: 0.45,
              ease: 'easeOut',
              delay,
            }
      }
      className={cn(className)}
      {...props}
    />
  );
}
