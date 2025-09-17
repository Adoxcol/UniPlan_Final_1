#!/usr/bin/env tsx

/**
 * Authentication Test Script
 * 
 * This script tests authentication options for seeding.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const client = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('🔐 Testing authentication options...');
  
  try {
    // Try to get current user
    const { data: { user }, error: userError } = await client.auth.getUser();
    
    if (userError) {
      console.log('❌ No authenticated user:', userError.message);
    } else if (user) {
      console.log('✅ Authenticated user found:', user.id);
      return user.id;
    } else {
      console.log('❌ No user session');
    }
    
    // Try to sign up a system user for seeding
    console.log('🔧 Attempting to create system user for seeding...');
    
    const { data: signUpData, error: signUpError } = await client.auth.signUp({
      email: 'system@example.com',
      password: 'SystemUser123!',
    });
    
    if (signUpError) {
      console.log('❌ Failed to create system user:', signUpError.message);
    } else if (signUpData.user) {
      console.log('✅ System user created:', signUpData.user.id);
      return signUpData.user.id;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return null;
  }
}

testAuth().then(userId => {
  if (userId) {
    console.log('🎉 User ID for seeding:', userId);
  } else {
    console.log('💡 Consider using a service role key for seeding official templates');
  }
});