'use client';

import { useEffect } from 'react';

// Helper function for development logging
const devLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ServiceWorker] ${message}`, ...args);
  }
};

const devError = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ServiceWorker] ${message}`, ...args);
  }
};

export function useServiceWorker() {
  useEffect(() => {
    const registerServiceWorker = async () => {
      // Skip service worker registration in development
      if (process.env.NODE_ENV === 'development') {
        devLog('Skipping service worker registration in development mode');
        return;
      }
      
      if ('serviceWorker' in navigator && typeof window !== 'undefined') {
        try {
          // Additional safety check for document state
          if (document.readyState !== 'complete') {
            devLog('Document not ready, skipping service worker registration');
            return;
          }
          
          // Check if already registered with additional error handling
          let existingRegistration;
          try {
            existingRegistration = await navigator.serviceWorker.getRegistration();
          } catch (getRegError) {
            devLog('Could not check existing registration, proceeding with new registration');
          }
          
          if (existingRegistration) {
            devLog('Service Worker already registered');
            return;
          }
          
          const registration = await navigator.serviceWorker.register('/sw.js');
          devLog('Service Worker registered successfully:', registration);
             
           // Listen for updates
           registration.addEventListener('updatefound', () => {
             const newWorker = registration.installing;
             if (newWorker) {
               newWorker.addEventListener('statechange', () => {
                 if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                   // New content is available, prompt user to refresh
                   if (confirm('New version available! Refresh to update?')) {
                     window.location.reload();
                   }
                 }
               });
             }
           });
           
        } catch (error) {
          devError('Service Worker registration failed:', error);
        }
      } else {
        devLog('Service Worker not supported');
      }
    };

    // Register service worker when component mounts
    registerServiceWorker();

    // Cleanup function
    return () => {
      // No cleanup needed for service worker registration
    };
  }, []);

  // Function to manually update service worker
  const updateServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          devLog('Service Worker update triggered');
        }
      } catch (error) {
        devError('Service Worker update failed:', error);
      }
    }
  };

  // Function to unregister service worker (useful for development)
  const unregisterServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
          devLog('Service Worker unregistered');
        }
      } catch (error) {
        devError('Service Worker unregistration failed:', error);
      }
    }
  };

  return {
    updateServiceWorker,
    unregisterServiceWorker,
  };
}