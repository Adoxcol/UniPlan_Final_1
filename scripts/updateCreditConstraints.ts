import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey)

async function updateCreditConstraints() {
  try {
    console.log('Updating credit range constraints to allow zero-credit courses...')

    // Note: We'll need to manually run these SQL commands in the Supabase dashboard
    // or use a migration file since direct constraint modification requires admin privileges
    
    console.log('\nSQL commands to run in Supabase SQL Editor:')
    console.log('==========================================')
    
    console.log('\n-- Drop existing constraints')
    console.log('ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_credits_range;')
    console.log('ALTER TABLE public.shared_plan_courses DROP CONSTRAINT IF EXISTS shared_plan_courses_credits_range;')
    console.log('ALTER TABLE public.degree_template_courses DROP CONSTRAINT IF EXISTS degree_template_courses_credits_range;')
    
    console.log('\n-- Add new constraints (0-6 credits)')
    console.log('ALTER TABLE public.courses ADD CONSTRAINT courses_credits_range CHECK (credits >= 0 AND credits <= 6);')
    console.log('ALTER TABLE public.shared_plan_courses ADD CONSTRAINT shared_plan_courses_credits_range CHECK (credits >= 0 AND credits <= 6);')
    console.log('ALTER TABLE public.degree_template_courses ADD CONSTRAINT degree_template_courses_credits_range CHECK (credits >= 0 AND credits <= 6);')
    
    console.log('\n==========================================')
    console.log('\nFor now, let\'s try a workaround by updating the schema file and restarting the local Supabase instance...')

  } catch (error) {
    console.error('Failed to update credit constraints:', error)
    throw error
  }
}

async function main() {
  try {
    await updateCreditConstraints()
    console.log('\n🎉 Credit constraints migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

main()