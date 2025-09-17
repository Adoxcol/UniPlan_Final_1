#!/usr/bin/env tsx

import { TemplateSeeder } from '../lib/templateSeeder';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function seedNSUTemplate() {
  console.log('🏫 Seeding North South University Template...');
  console.log('📊 Template Details:');
  console.log('   - University: North South University');
  console.log('   - Program: Bachelor of Science in Computer Science and Engineering');
  console.log('   - Duration: 4 years (12 semesters)');
  console.log('   - Total Credits: 130');
  console.log('   - Structure: 3 semesters per year\n');

  try {
    await TemplateSeeder.seedNSUTemplate();
    
    console.log('✅ NSU template seeded successfully!');
    console.log('🎉 The template is now available in the template library');
    console.log('📝 Students can now use this template to plan their NSU CSE degree');
    
  } catch (error: any) {
    console.error('❌ Failed to seed NSU template:');
    console.error('Error message:', error.message);
    
    if (error.message?.includes('Insufficient permissions')) {
      console.error('\n🔐 Permission Error:');
      console.error('💡 You need admin privileges to seed official templates');
      console.error('💡 Please ensure you are signed in as an admin user');
      console.error('💡 Contact a system administrator if you need admin access');
    } else if (error.message?.includes('Missing Supabase environment variables')) {
      console.error('\n⚙️ Environment Configuration Error:');
      console.error('💡 Please check your .env.local file');
      console.error('💡 Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    } else {
      console.error('\n🔍 Unexpected Error:');
      console.error('💡 Please check the error details above');
      console.error('💡 Verify your database connection and template data');
    }
    
    process.exit(1);
  }
}

// Run the seeding
seedNSUTemplate();