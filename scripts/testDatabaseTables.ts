import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseTables() {
  console.log('🔍 Testing database connection and tables...')
  console.log('📍 Supabase URL:', supabaseUrl)
  
  const tablesToTest = [
    'profiles',
    'degree_templates', 
    'shared_plans',
    'semesters',
    'courses'
  ]
  
  for (const table of tablesToTest) {
    try {
      console.log(`\n📋 Testing table: ${table}`)
      
      // Try to query the table
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.error(`❌ Error accessing ${table}:`, error.message)
        console.error('   Details:', error.details)
        console.error('   Hint:', error.hint)
      } else {
        console.log(`✅ ${table} table exists and is accessible`)
        console.log(`📊 Row count: ${count}`)
      }
    } catch (err) {
      console.error(`❌ Exception testing ${table}:`, err)
    }
  }
  
  // Test authentication
  console.log('\n🔐 Testing authentication...')
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.log('ℹ️  No authenticated user (this is normal for this test)')
    } else {
      console.log('✅ Authenticated user found:', user?.email)
    }
  } catch (err) {
    console.error('❌ Auth test error:', err)
  }
}

testDatabaseTables().catch(console.error)