'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';

export function useAutoSave() {
  const { semesters, notes, degree, saveAllToSupabase, isSyncing } = useAppStore();
  const { userId } = useAuth();
  const lastSaveRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only auto-save if user is authenticated
    if (!userId || isSyncing) return;

    // Create a hash of current state to detect changes
    const currentState = JSON.stringify({ semesters, notes, degree });
    
    // If state hasn't changed, don't save
    if (currentState === lastSaveRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      saveAllToSupabase();
      lastSaveRef.current = currentState;
    }, 30000); // 30 seconds

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [semesters, notes, degree, userId, saveAllToSupabase, isSyncing]);

  // Save immediately when component unmounts (page close/refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (userId && !isSyncing) {
        // Use sendBeacon for reliable saving on page unload
        const currentState = JSON.stringify({ semesters, notes, degree });
        if (currentState !== lastSaveRef.current) {
          saveAllToSupabase();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [semesters, notes, degree, userId, saveAllToSupabase, isSyncing]);
}