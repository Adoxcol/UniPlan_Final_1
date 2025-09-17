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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTemplateData() {
  try {
    console.log('Checking degree templates...')
    
    // Get all degree templates
    const { data: templates, error: templatesError } = await supabase
      .from('degree_templates')
      .select('*')
    
    if (templatesError) {
      console.error('Error fetching templates:', templatesError)
      return
    }
    
    console.log(`Found ${templates?.length || 0} degree templates:`)
    templates?.forEach((template, index) => {
      console.log(`\nTemplate ${index + 1}:`)
      console.log(`  ID: ${template.id}`)
      console.log(`  Name: ${template.name}`)
      console.log(`  Description: ${template.description}`)
      console.log(`  University: ${template.university}`)
      console.log(`  Major: ${template.major}`)
      console.log(`  Total Credits: ${template.total_credits}`)
      console.log(`  Duration: ${template.duration_years} years`)
      console.log(`  Is Official: ${template.is_official}`)
    })
    
    // For each template, check its semesters
    for (const template of templates || []) {
      console.log(`\n--- Checking semesters for template: ${template.name} ---`)
      
      const { data: semesters, error: semestersError } = await supabase
        .from('degree_template_semesters')
        .select('*')
        .eq('degree_template_id', template.id)
        .order('year', { ascending: true })
        .order('season', { ascending: true })
      
      if (semestersError) {
        console.error('Error fetching semesters:', semestersError)
        continue
      }
      
      console.log(`Found ${semesters?.length || 0} semesters:`)
      
      for (const semester of semesters || []) {
        console.log(`\n  Semester: ${semester.name} (Year ${semester.year}, ${semester.season})`)
        console.log(`    ID: ${semester.id}`)
        console.log(`    Notes: ${semester.notes || 'None'}`)
        
        // Check courses for this semester
        const { data: courses, error: coursesError } = await supabase
          .from('degree_template_courses')
          .select('*')
          .eq('degree_template_semester_id', semester.id)
        
        if (coursesError) {
          console.error('    Error fetching courses:', coursesError)
          continue
        }
        
        console.log(`    Found ${courses?.length || 0} courses:`)
        courses?.forEach((course, courseIndex) => {
          console.log(`      Course ${courseIndex + 1}: ${course.name}`)
          console.log(`        Code: ${course.course_code || 'N/A'}`)
          console.log(`        Credits: ${course.credits}`)
          console.log(`        Prerequisites: ${course.prerequisites || 'None'}`)
          console.log(`        Required: ${course.is_required}`)
        })
      }
    }
    
  } catch (error) {
    console.error('Error checking template data:', error)
  }
}

checkTemplateData()