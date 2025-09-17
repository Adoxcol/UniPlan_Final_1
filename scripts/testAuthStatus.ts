import { supabase } from '../lib/supabaseClient'
import { getCurrentUserAdminLevel, getCurrentUserPermissions, isCurrentUserAdmin } from '../lib/adminUtils'

async function testAuthStatus() {
  console.log('🔐 Testing authentication status...')
  
  try {
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ Error getting user:', userError.message)
      return
    }
    
    if (!user) {
      console.log('❌ No authenticated user found')
      console.log('💡 You need to sign in to access admin features')
      console.log('🌐 Go to http://localhost:3000 and sign in with your admin account')
      return
    }
    
    console.log('✅ User authenticated:', user.email)
    console.log('📧 User ID:', user.id)
    
    // Check admin status
    console.log('\n🛡️  Checking admin status...')
    const isAdmin = await isCurrentUserAdmin()
    console.log('Admin status:', isAdmin ? '✅ Admin' : '❌ Not admin')
    
    if (isAdmin) {
      const adminLevel = await getCurrentUserAdminLevel()
      console.log('Admin level:', adminLevel)
      
      const permissions = await getCurrentUserPermissions()
      console.log('Permissions:', permissions)
      
      // Test the specific queries that are failing
      console.log('\n📊 Testing admin stats queries...')
      
      try {
        const { count: userCount, error: userCountError } = await supabase
          .from('profiles')
          .select('user_id', { count: 'exact', head: true })
        
        if (userCountError) {
          console.error('❌ Error counting users:', userCountError.message)
        } else {
          console.log('✅ User count:', userCount)
        }
      } catch (err) {
        console.error('❌ Exception counting users:', err)
      }
      
      try {
        const { count: templateCount, error: templateCountError } = await supabase
          .from('degree_templates')
          .select('id', { count: 'exact', head: true })
        
        if (templateCountError) {
          console.error('❌ Error counting templates:', templateCountError.message)
        } else {
          console.log('✅ Template count:', templateCount)
        }
      } catch (err) {
        console.error('❌ Exception counting templates:', err)
      }
      
      try {
        const { count: planCount, error: planCountError } = await supabase
          .from('shared_plans')
          .select('id', { count: 'exact', head: true })
        
        if (planCountError) {
          console.error('❌ Error counting shared plans:', planCountError.message)
        } else {
          console.log('✅ Shared plan count:', planCount)
        }
      } catch (err) {
        console.error('❌ Exception counting shared plans:', err)
      }
      
      try {
        const { count: adminCount, error: adminCountError } = await supabase
          .from('profiles')
          .select('user_id', { count: 'exact', head: true })
          .eq('is_admin', true)
        
        if (adminCountError) {
          console.error('❌ Error counting admin users:', adminCountError.message)
        } else {
          console.log('✅ Admin user count:', adminCount)
        }
      } catch (err) {
        console.error('❌ Exception counting admin users:', err)
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testAuthStatus().catch(console.error)