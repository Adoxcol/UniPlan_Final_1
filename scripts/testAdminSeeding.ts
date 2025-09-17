#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { TemplateSeeder } from '../lib/templateSeeder';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('\n💡 Please ensure these are set in your .env.local file');
  process.exit(1);
}

async function testAdminSeeding() {
  console.log('🧪 Testing admin seeding functionality...');
  
  try {
    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl as string, supabaseServiceKey as string, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('✅ Admin client created successfully');

    // Test database connection
    console.log('🔗 Testing database connection...');
    const { data: testData, error: testError } = await adminClient
      .from('degree_templates')
      .select('count')
      .limit(1);

    if (testError) {
      throw new Error(`Database connection failed: ${testError.message}`);
    }

    console.log('✅ Database connection successful');

    // Test seeding with admin privileges
    console.log('🌱 Attempting to seed NSU degree template...');
    
    await TemplateSeeder.seedNSUTemplate();
    
    console.log('✅ Seeding completed successfully!');
    
    // Verify the template was created
    console.log('🔍 Verifying template creation...');
    const { data: templates, error: verifyError } = await adminClient
      .from('degree_templates')
      .select('id, name, university, is_official')
      .eq('is_official', true)
      .limit(5);

    if (verifyError) {
      console.warn('⚠️ Could not verify template creation:', verifyError.message);
    } else {
      console.log('✅ Found official templates:', templates?.length || 0);
      templates?.forEach(template => {
        console.log(`  - ${template.name} (${template.university})`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ Seeding failed with error:');
    console.error('Error message:', error.message);
    console.error('Error details:', error);
    
    // Check if it's an RLS policy error
    if (error.message?.includes('row-level security policy') || error.message?.includes('RLS')) {
      console.error('\n🔒 This appears to be a Row Level Security (RLS) policy error');
      console.error('💡 The authenticated user may not have permission to insert into the tables');
      console.error('💡 Make sure you are using the SUPABASE_SERVICE_ROLE_KEY, not the anon key');
    }
    
    // Check if it's an authentication error
    if (error.message?.includes('auth') || error.message?.includes('session')) {
      console.error('\n🔐 This appears to be an authentication error');
      console.error('💡 The user session may be missing or invalid');
    }

    // Check if it's a permission error
    if (error.message?.includes('permission') || error.message?.includes('Insufficient')) {
      console.error('\n🚫 This appears to be a permission error');
      console.error('💡 Make sure the user has admin privileges to seed templates');
    }

    // Check if it's an environment variable error
    if (error.message?.includes('Missing Supabase environment variables')) {
      console.error('\n⚙️ Environment variables are not properly configured');
      console.error('💡 Check your .env.local file and ensure all required variables are set');
    }

    process.exit(1);
  }
}

// Run the test
testAdminSeeding();