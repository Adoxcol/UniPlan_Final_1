#!/usr/bin/env tsx

/**
 * Create First Admin Script
 * 
 * This script helps you create your first admin account for the UniPlan application.
 * Run this script when you need to set up the initial admin user.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import * as readline from 'readline';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function createFirstAdmin() {
  console.log('🚀 UniPlan - Create First Admin Account\n');
  
  try {
    // Get admin details from user
    const email = await askQuestion('Enter admin email: ');
    const password = await askQuestion('Enter admin password (min 6 characters): ');
    const firstName = await askQuestion('Enter first name: ');
    const lastName = await askQuestion('Enter last name: ');
    
    if (!email || !password || password.length < 6) {
      console.error('❌ Invalid input. Email and password (min 6 chars) are required.');
      process.exit(1);
    }

    console.log('\n🔄 Creating admin account...');

    // Create the user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create user: ${authError?.message}`);
    }

    console.log('✅ User account created');

    // Update the profile to set admin status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        is_admin: true,
        admin_level: 'super_admin', // Make them super admin for full access
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', authData.user.id);

    if (profileError) {
      throw new Error(`Failed to set admin status: ${profileError.message}`);
    }

    console.log('✅ Admin privileges granted');
    console.log('\n🎉 Admin account created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${firstName} ${lastName}`);
    console.log(`🛡️  Level: Super Admin`);
    console.log('\n📋 Next Steps:');
    console.log('1. Visit your application and log in with these credentials');
    console.log('2. Access the admin dashboard at /admin');
    console.log('3. You can now create additional admin users through the UI');

  } catch (error) {
    console.error('❌ Error creating admin account:', error);
  } finally {
    rl.close();
  }
}

// Run the script
createFirstAdmin().catch(console.error);