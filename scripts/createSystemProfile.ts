import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createSystemProfile() {
  console.log('🔍 Creating profile for system user...');
  
  const systemUserId = '58bb2509-f2b0-40eb-9efe-8cf904c2d75f';
  
  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', systemUserId)
    .single();
    
  if (existingProfile) {
    console.log('✅ System user profile already exists');
    return;
  }
  
  // Create the profile
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: systemUserId,
      display_name: 'System User',
      first_name: 'System',
      last_name: 'User',
      is_admin: true,
      admin_level: 'super_admin',
      profile_public: false,
      allow_plan_sharing: false,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) {
    console.error('❌ Error creating system profile:', error);
    return;
  }
  
  console.log('✅ System user profile created successfully!');
  console.log('Profile:', data);
}

createSystemProfile().catch(console.error);