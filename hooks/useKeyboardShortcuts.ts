'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export function useKeyboardShortcuts() {
  const { saveAllToSupabase, undo, redo } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S - Save
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveAllToSupabase();
        return;
      }

      // Ctrl+Z - Undo
      if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      // Ctrl+Shift+Z or Ctrl+Y - Redo
      if ((event.ctrlKey && event.shiftKey && event.key === 'Z') || 
          (event.ctrlKey && event.key === 'y')) {
        event.preventDefault();
        redo();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveAllToSupabase, undo, redo]);
}