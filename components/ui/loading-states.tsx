'use client';

import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  withPulse?: boolean;
}

export function LoadingSpinner({ size = 'md', className, withPulse = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        rotate: 360
      }}
      transition={{
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
        rotate: { duration: 1, repeat: Infinity, ease: "linear" }
      }}
      className={cn(sizeClasses[size], className)}
    >
      <Loader2 
        className={cn('w-full h-full', withPulse && 'animate-pulse')}
      />
    </motion.div>
  );
}

interface ActionFeedbackProps {
  type: 'success' | 'error' | 'info';
  message: string;
  className?: string;
}

export function ActionFeedback({ type, message, className }: ActionFeedbackProps) {
  const variants = {
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
  }

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: AlertCircle
  }

  const Icon = icons[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20,
          duration: 0.4
        }
      }}
      exit={{ 
        opacity: 0, 
        y: -20, 
        scale: 0.95,
        transition: { duration: 0.2 }
      }}
      whileHover={{
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 17 }
      }}
      className={cn(
        'flex items-center gap-2 p-3 rounded-md border text-sm font-medium shadow-sm',
        variants[type],
        className
      )}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ 
          scale: 1, 
          rotate: 0,
          transition: { delay: 0.1, type: "spring", stiffness: 300 }
        }}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
      </motion.div>
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ 
          opacity: 1, 
          x: 0,
          transition: { delay: 0.15, duration: 0.3 }
        }}
      >
        {message}
      </motion.span>
    </motion.div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}

export function LoadingOverlay({ 
  isLoading, 
  message = 'Loading...', 
  children, 
  className 
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-md"
        >
          <div className="flex flex-col items-center space-y-2">
            <LoadingSpinner size="lg" />
            <span className="text-sm text-gray-600 font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-gray-200 rounded-md h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full',
            className
          )}
        />
      ))}
    </div>
  );
}

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export function ButtonLoading({ 
  isLoading, 
  children, 
  loadingText,
  className 
}: ButtonLoadingProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {isLoading && <LoadingSpinner size="sm" />}
      <span>{isLoading && loadingText ? loadingText : children}</span>
    </div>
  );
}

interface ProgressIndicatorProps {
  progress: number // 0-100
  className?: string
  showPercentage?: boolean
  animated?: boolean
}

export function ProgressIndicator({ progress, className, showPercentage = true, animated = true }: ProgressIndicatorProps) {
  return (
    <motion.div 
      className={cn('w-full', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-2">
        <motion.span 
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          Progress
        </motion.span>
        {showPercentage && (
          <motion.span 
            className="text-sm text-gray-500 dark:text-gray-400 font-mono"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            key={Math.round(progress)}
          >
            {Math.round(progress)}%
          </motion.span>
        )}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className="bg-primary h-2 rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ 
            duration: animated ? 0.8 : 0.3, 
            ease: "easeOut",
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
        >
          {animated && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
                delay: 0.5
              }}
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}