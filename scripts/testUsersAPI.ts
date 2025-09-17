import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testUsersAPI() {
  console.log('🔍 Testing admin users API endpoint...');
  
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.log('❌ No valid session found. Need to be logged in.');
      return;
    }
    
    console.log('✅ Found session for user:', session.user.email);
    
    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/admin/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 API Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', error);
      return;
    }
    
    const result = await response.json();
    console.log('✅ API Success! Users returned:', result.users?.length || 0);
    
    result.users?.forEach((user: any, index: number) => {
      console.log(`${index + 1}. User ID: ${user.user_id}`);
      console.log(`   Name: ${user.display_name || user.first_name || 'No name'}`);
      console.log(`   Admin: ${user.is_admin ? 'Yes' : 'No'}`);
      console.log(`   Admin Level: ${user.admin_level || 'None'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testUsersAPI().catch(console.error);