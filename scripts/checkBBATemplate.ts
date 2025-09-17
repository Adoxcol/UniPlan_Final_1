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

async function checkBBATemplate() {
  try {
    console.log('🔍 Checking BBA template in database...\n')

    // Find the BBA template
    const { data: templates, error: templateError } = await adminClient
      .from('degree_templates')
      .select('*')
      .ilike('name', '%BBA%')
      .or('name.ilike.%Business Administration%')

    if (templateError) {
      throw new Error(`Failed to fetch templates: ${templateError.message}`)
    }

    if (!templates || templates.length === 0) {
      console.log('❌ No BBA template found in database')
      return
    }

    console.log(`✅ Found ${templates.length} BBA template(s):`)
    templates.forEach((template, index) => {
      console.log(`  ${index + 1}. ${template.name} (ID: ${template.id})`)
      console.log(`     University: ${template.university}`)
      console.log(`     Duration: ${template.duration_years} years`)
      console.log(`     Total Credits: ${template.total_credits}`)
      console.log(`     Created: ${new Date(template.created_at).toLocaleDateString()}`)
    })

    // Check semesters for each template
    for (const template of templates) {
      console.log(`\n📚 Checking semesters for "${template.name}"...`)
      
      const { data: semesters, error: semesterError } = await adminClient
        .from('degree_template_semesters')
        .select('*')
        .eq('degree_template_id', template.id)
        .order('year', { ascending: true })
        .order('season', { ascending: true })

      if (semesterError) {
        console.error(`❌ Failed to fetch semesters: ${semesterError.message}`)
        continue
      }

      console.log(`   Found ${semesters?.length || 0} semesters:`)
      
      if (semesters && semesters.length > 0) {
        for (const semester of semesters) {
          // Get courses for this semester
          const { data: courses, error: courseError } = await adminClient
            .from('degree_template_courses')
            .select('*')
            .eq('degree_template_semester_id', semester.id)

          const courseCount = courses?.length || 0
          const totalCredits = courses?.reduce((sum, course) => sum + course.credits, 0) || 0

          console.log(`     ${semester.name} (Year ${semester.year}, ${semester.season}): ${courseCount} courses, ${totalCredits} credits`)
          
          if (courseError) {
            console.warn(`       ⚠️ Warning: Could not fetch courses: ${courseError.message}`)
          }
        }
      } else {
        console.log('     ❌ No semesters found for this template')
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error)
  }
}

checkBBATemplate()