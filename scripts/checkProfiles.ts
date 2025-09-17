import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkProfiles() {
  console.log('🔍 Checking profiles in database...');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ Error fetching profiles:', error);
    return;
  }
  
  console.log(`✅ Found ${profiles?.length || 0} profiles:`);
  profiles?.forEach((profile, index) => {
    console.log(`${index + 1}. User ID: ${profile.user_id}`);
    console.log(`   Name: ${profile.display_name || profile.first_name || 'No name'}`);
    console.log(`   Admin: ${profile.is_admin ? 'Yes' : 'No'}`);
    console.log(`   Admin Level: ${profile.admin_level || 'None'}`);
    console.log(`   Created: ${profile.created_at}`);
    console.log('');
  });

  // Also check auth users
  console.log('🔍 Checking auth users...');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Error fetching auth users:', authError);
    return;
  }
  
  console.log(`✅ Found ${authUsers?.users?.length || 0} auth users:`);
  authUsers?.users?.forEach((user, index) => {
    console.log(`${index + 1}. User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Created: ${user.created_at}`);
    console.log('');
  });
}

checkProfiles().catch(console.error);