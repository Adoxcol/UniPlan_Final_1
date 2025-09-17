import { createClient } from '@supabase/supabase-js';
import { seedDegreeTemplates } from '../lib/templateSeeder';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

async function testAdminSeeding() {
  console.log('🧪 Testing admin seeding functionality...');
  
  try {
    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('✅ Admin client created successfully');

    // Test seeding with admin privileges
    console.log('🌱 Attempting to seed degree templates...');
    
    const result = await seedDegreeTemplates();
    
    console.log('✅ Seeding completed successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Seeding failed with error:');
    console.error('Error message:', error.message);
    console.error('Error details:', error);
    
    // Check if it's an RLS policy error
    if (error.message?.includes('row-level security policy')) {
      console.error('🔒 This appears to be a Row Level Security (RLS) policy error');
      console.error('💡 The authenticated user may not have permission to insert into the tables');
    }
    
    // Check if it's an authentication error
    if (error.message?.includes('auth') || error.message?.includes('session')) {
      console.error('🔐 This appears to be an authentication error');
      console.error('💡 The user session may be missing or invalid');
    }
  }
}

testAdminSeeding();