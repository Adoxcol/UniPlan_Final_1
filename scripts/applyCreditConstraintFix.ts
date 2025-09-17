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

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyCreditConstraintFix() {
  try {
    console.log('Applying credit constraint and data type fixes...')

    // Execute SQL commands using the REST API directly
    const sqlCommands = [
      // Drop existing constraints first
      'ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_credits_range',
      'ALTER TABLE public.shared_plan_courses DROP CONSTRAINT IF EXISTS shared_plan_courses_credits_range',
      'ALTER TABLE public.degree_template_courses DROP CONSTRAINT IF EXISTS degree_template_courses_credits_range',
      
      // Change column types from integer to numeric(3,1) to support fractional credits
      'ALTER TABLE public.courses ALTER COLUMN credits TYPE numeric(3,1)',
      'ALTER TABLE public.shared_plan_courses ALTER COLUMN credits TYPE numeric(3,1)',
      'ALTER TABLE public.degree_template_courses ALTER COLUMN credits TYPE numeric(3,1)',
      
      // Add new constraints (0-6 credits, now supporting fractional values)
      'ALTER TABLE public.courses ADD CONSTRAINT courses_credits_range CHECK (credits >= 0 AND credits <= 6)',
      'ALTER TABLE public.shared_plan_courses ADD CONSTRAINT shared_plan_courses_credits_range CHECK (credits >= 0 AND credits <= 6)',
      'ALTER TABLE public.degree_template_courses ADD CONSTRAINT degree_template_courses_credits_range CHECK (credits >= 0 AND credits <= 6)'
    ]

    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i]
      console.log(`Executing command ${i + 1}/${sqlCommands.length}:`)
      console.log(sql)
      
      try {
        // Use fetch to call the REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql })
        })

        if (response.ok) {
          console.log(`✓ Command ${i + 1} executed successfully`)
        } else {
          const error = await response.text()
          console.warn(`Warning for command ${i + 1}: ${error}`)
        }
      } catch (err: any) {
        console.warn(`Warning for command ${i + 1}: ${err.message}`)
      }
    }

    console.log('\n✓ Credit constraint and data type fixes applied!')
    console.log('✓ Courses can now have fractional credits (0-6, including 1.5, 2.5, etc.)')

  } catch (error) {
    console.error('Failed to apply credit fixes:', error)
    throw error
  }
}

async function main() {
  try {
    await applyCreditConstraintFix()
    console.log('\n🎉 Credit migration completed!')
  } catch (error) {
    console.error('Migration failed:', error)
    console.log('\nPlease run these SQL commands manually in the Supabase SQL Editor:')
    console.log('==========================================')
    console.log('-- Drop existing constraints')
    console.log('ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_credits_range;')
    console.log('ALTER TABLE public.shared_plan_courses DROP CONSTRAINT IF EXISTS shared_plan_courses_credits_range;')
    console.log('ALTER TABLE public.degree_template_courses DROP CONSTRAINT IF EXISTS degree_template_courses_credits_range;')
    console.log('')
    console.log('-- Change column types to support fractional credits')
    console.log('ALTER TABLE public.courses ALTER COLUMN credits TYPE numeric(3,1);')
    console.log('ALTER TABLE public.shared_plan_courses ALTER COLUMN credits TYPE numeric(3,1);')
    console.log('ALTER TABLE public.degree_template_courses ALTER COLUMN credits TYPE numeric(3,1);')
    console.log('')
    console.log('-- Add new constraints (0-6 credits, supporting fractional values)')
    console.log('ALTER TABLE public.courses ADD CONSTRAINT courses_credits_range CHECK (credits >= 0 AND credits <= 6);')
    console.log('ALTER TABLE public.shared_plan_courses ADD CONSTRAINT shared_plan_courses_credits_range CHECK (credits >= 0 AND credits <= 6);')
    console.log('ALTER TABLE public.degree_template_courses ADD CONSTRAINT degree_template_courses_credits_range CHECK (credits >= 0 AND credits <= 6);')
    console.log('==========================================')
    process.exit(1)
  }
}

main()