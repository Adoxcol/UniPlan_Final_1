'use client';

import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    const registerServiceWorker = async () => {
      // Skip service worker registration in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Skipping service worker registration in development mode');
        return;
      }
      
      if ('serviceWorker' in navigator && typeof window !== 'undefined') {
        try {
          // Additional safety check for document state
          if (document.readyState !== 'complete') {
            console.log('Document not ready, skipping service worker registration');
            return;
          }
          
          // Check if already registered with additional error handling
          let existingRegistration;
          try {
            existingRegistration = await navigator.serviceWorker.getRegistration();
          } catch (getRegError) {
            console.log('Could not check existing registration, proceeding with new registration');
          }
          
          if (existingRegistration) {
            console.log('Service Worker already registered');
            return;
          }
          
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered successfully:', registration);
             
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
           console.error('Service Worker registration failed:', error);
         }

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SYNC_COMPLETE') {
            console.log('Data sync completed');
          }
        });
      }
    };

    if (document.readyState === 'complete') {
       // Add a small delay to ensure browser is fully ready
       setTimeout(registerServiceWorker, 100);
     } else {
       const handleLoad = () => {
         setTimeout(registerServiceWorker, 100);
       };
       window.addEventListener('load', handleLoad);
       return () => window.removeEventListener('load', handleLoad);
     }
  }, []);

  // Function to store data for offline sync
  const storeOfflineData = (data: any) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'STORE_OFFLINE_DATA',
        payload: data
      });
    }
  };

  // Function to check if app is online
  const isOnline = () => navigator.onLine;

  return {
    storeOfflineData,
    isOnline
  };
}