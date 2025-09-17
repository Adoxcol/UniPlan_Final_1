import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, MotionProps } from "framer-motion"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:border-border/50 dark:hover:bg-accent/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-secondary/80 dark:hover:bg-secondary/60",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline",
        dashed: "border-dashed border-2 bg-transparent hover:border-primary/50 hover:bg-accent/50 transition-colors",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Enhanced micro-interaction animations
const buttonAnimations = {
  whileHover: { 
    scale: 1.02,
    transition: { type: "spring" as const, stiffness: 400, damping: 17 }
  },
  whileTap: { 
    scale: 0.98,
    transition: { type: "spring" as const, stiffness: 400, damping: 17 }
  },
  initial: { scale: 1 },
  animate: { scale: 1 }
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  disableAnimations?: boolean
  motionProps?: Partial<MotionProps>
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, disableAnimations = false, motionProps, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // If animations are disabled or it's a child component, use regular button
    if (disableAnimations || asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      )
    }
    
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
    
    // Use motion button with enhanced micro-interactions
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...buttonAnimations}
        {...motionProps}
        {...htmlProps}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }