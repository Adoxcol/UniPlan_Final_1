import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client with proper configuration
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Add debug mode for development
    debug: process.env.NODE_ENV === 'development',
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
  },
  // Add retry configuration for network errors
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Add global error handler for auth events
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    // Only log auth events in development
    if (process.env.NODE_ENV === 'development') {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      } else if (event === 'SIGNED_IN') {
        console.log('User signed in');
      }
    }
  });
}

// Export a helper function for development logging
export const devLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Supabase] ${message}`, ...args);
  }
};

export const devError = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Supabase] ${message}`, ...args);
  }
};

// Export a helper function to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Export individual components for easier testing
export const supabaseAuth = supabase.auth;
export const supabaseStorage = supabase.storage;