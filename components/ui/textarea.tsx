import * as React from "react"
import { motion } from 'framer-motion';

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  withAnimation?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, withAnimation = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    
    const textareaVariants = {
      initial: { scale: 1 },
      focus: { 
        scale: 1.01,
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

    const Component = withAnimation ? motion.textarea : 'textarea';
    
    return (
      <Component
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none",
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
          variants: textareaVariants,
          initial: "initial",
          animate: error ? "error" : isFocused ? "focus" : "initial"
        })}
        {...htmlProps}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }