'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, Cloud } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function SavingIndicator() {
  const { isSyncing } = useAppStore();

  return (
    <AnimatePresence>
      {isSyncing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SavedIndicator({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-4 right-4 z-50 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 shadow-lg"
        >
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <Check className="h-4 w-4" />
            <span>Saved</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}