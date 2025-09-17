#!/usr/bin/env tsx

/**
 * Migration Script - Add is_official Column
 * 
 * This script adds the is_official column to the degree_templates table.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const client = createClient(supabaseUrl, supabaseAnonKey);

async function addOfficialColumn() {
  console.log('🔧 Checking if is_official column needs to be added...');
  
  try {
    // First, let's check if the column already exists
    const { data: existingData, error: checkError } = await client
      .from('degree_templates')
      .select('is_official')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ is_official column already exists!');
      return;
    }
    
    console.log('📝 Column does not exist, manual migration needed.');
    console.log('');
    console.log('Please run the following SQL commands in your Supabase SQL editor:');
    console.log('');
    console.log('1. Add the is_official column:');
    console.log('   ALTER TABLE public.degree_templates ADD COLUMN is_official boolean DEFAULT false NOT NULL;');
    console.log('');
    console.log('2. Create the index:');
    console.log('   CREATE INDEX idx_degree_templates_official ON public.degree_templates(is_official) WHERE is_official = true;');
    console.log('');
    console.log('After running these commands, you can run the seeding script again.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addOfficialColumn();