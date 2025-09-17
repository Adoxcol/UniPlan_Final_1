import * as React from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  withAnimation?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, withAnimation = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    
    const inputVariants = {
      initial: { scale: 1 },
      focus: { 
        scale: 1.02,
        transition: { type: "spring" as const, stiffness: 300, damping: 20 }
      },
      error: {
        x: [-2, 2, -2, 2, 0],
        transition: { duration: 0.4 }
      }
    };

    // Separate motion props from HTML props to avoid conflicts
    const { 
      onDrag, 
      onDragStart, 
      onDragEnd, 
      onAnimationStart,
      onAnimationEnd,
      onAnimationIteration,
      onTransitionEnd,
      ...htmlProps 
    } = props;

    const Component = withAnimation ? motion.input : 'input';
    
    return (
      <Component
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
          error && 'border-red-500 focus-visible:ring-red-500',
          isFocused && 'shadow-sm',
          className
        )}
        ref={ref}
        onFocus={(e) => {
          setIsFocused(true);
          htmlProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          htmlProps.onBlur?.(e);
        }}
        {...(withAnimation && {
          variants: inputVariants,
          initial: "initial",
          animate: error ? "error" : isFocused ? "focus" : "initial"
        })}
        {...htmlProps}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
