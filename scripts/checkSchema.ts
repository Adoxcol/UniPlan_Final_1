#!/usr/bin/env tsx

/**
 * Schema Check Script
 * 
 * This script checks the current database schema to verify columns exist.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const client = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('🔍 Checking database schema...');
  
  try {
    // Try to query the degree_templates table to see what columns exist
    const { data, error } = await client
      .from('degree_templates')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying degree_templates:', error.message);
      return;
    }
    
    console.log('✅ Successfully connected to degree_templates table');
    console.log('📊 Sample data structure:', data);
    
    // Try to specifically query for is_official column
    const { data: officialData, error: officialError } = await client
      .from('degree_templates')
      .select('id, name, is_official')
      .limit(1);
      
    if (officialError) {
      console.error('❌ Error querying is_official column:', officialError.message);
    } else {
      console.log('✅ is_official column exists and is accessible');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSchema();