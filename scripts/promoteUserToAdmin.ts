#!/usr/bin/env tsx

/**
 * Promote User to Admin Script
 * 
 * This script promotes an existing user to admin status by their email address.
 * Note: This requires you to have admin access or use the service role key.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function promoteUserToAdmin(email: string, adminLevel: 'moderator' | 'admin' | 'super_admin' = 'super_admin') {
  console.log(`🚀 Attempting to promote user ${email} to ${adminLevel}...\n`);
  
  try {
    console.log('⚠️  Note: This script requires either:');
    console.log('1. SUPABASE_SERVICE_ROLE_KEY in your .env.local file, OR');
    console.log('2. Manual database update through Supabase dashboard\n');

    // First, let's try to get all profiles to see what users exist
    console.log('📋 Checking existing profiles...');
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('user_id, display_name, first_name, last_name, admin_level')
      .limit(10);

    if (allError) {
      console.error('❌ Error fetching profiles:', allError.message);
    } else if (allProfiles && allProfiles.length > 0) {
      console.log('✅ Found existing profiles:');
      allProfiles.forEach(profile => {
        const name = profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        console.log(`  - User ID: ${profile.user_id} (${name || 'No name'}) - Admin Level: ${profile.admin_level}`);
      });
    } else {
      console.log('📝 No profiles found in the database yet.');
    }

    console.log('\n📋 Manual steps to promote user to admin:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Authentication > Users');
    console.log(`3. Find the user with email: ${email}`);
    console.log('4. Copy their User ID');
    console.log('5. Navigate to Table Editor > profiles');
    console.log('6. Find the row with that User ID (or create one if it doesn\'t exist)');
    console.log('7. Update the following columns:');
    console.log(`   - admin_level: ${adminLevel}`);
    console.log('   - updated_at: current timestamp');
    
    console.log('\n🔗 Quick links:');
    console.log('- Authentication Users: https://supabase.com/dashboard/project/[your-project-id]/auth/users');
    console.log('- Profiles Table: https://supabase.com/dashboard/project/[your-project-id]/editor/[table-id]');
    
    console.log('\n📝 If the user doesn\'t have a profile yet:');
    console.log('1. In the profiles table, click "Insert" > "Insert row"');
    console.log('2. Set the following values:');
    console.log('   - user_id: [the user ID from auth.users]');
    console.log(`   - admin_level: ${adminLevel}`);
    console.log('   - notes: (empty string)');
    console.log('   - profile_public: false');
    console.log('   - allow_plan_sharing: true');
    console.log('   - created_at: current timestamp');
    console.log('   - updated_at: current timestamp');

    console.log('\n🎯 Alternative: Use the admin dashboard');
    console.log('Once you have at least one admin user set up:');
    console.log('1. Go to http://localhost:3000/admin');
    console.log('2. Use the "Create Admin" feature in the User Management section');
    console.log('3. This will handle the profile creation automatically');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n📋 Manual promotion steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Authentication > Users');
    console.log(`3. Find the user with email: ${email}`);
    console.log('4. Copy their User ID');
    console.log('5. Navigate to Table Editor > profiles');
    console.log('6. Find or create a row with that User ID');
    console.log('7. Update the following columns:');
    console.log(`   - admin_level: ${adminLevel}`);
    console.log('   - updated_at: current timestamp');
  }
}

// Promote the specific user
const targetEmail = 'onelittle1221@gmail.com';
promoteUserToAdmin(targetEmail, 'super_admin').catch(console.error);