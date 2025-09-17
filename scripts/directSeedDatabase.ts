import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedDatabase() {
  console.log('🌱 Starting database seeding...')
  
  try {
    // First, let's create a sample degree template
    console.log('📚 Creating sample degree template...')
    
    const templateData = {
      name: 'Bachelor of Science in Computer Science',
      description: 'A comprehensive 4-year program covering fundamental computer science concepts, programming, algorithms, and software engineering.',
      university: 'Sample University',
      major: 'Computer Science',
      total_credits: 120,
      duration_years: 4,
      tags: ['Computer Science', 'Programming', 'Software Engineering'],
      is_public: true,
      is_official: true,
      user_id: '00000000-0000-0000-0000-000000000000' // Placeholder user ID
    }
    
    const { data: template, error: templateError } = await supabase
      .from('degree_templates')
      .insert(templateData)
      .select()
      .single()
    
    if (templateError) {
      console.error('❌ Error creating template:', templateError)
      
      // If it's a foreign key constraint error, let's try to create a dummy user first
      if (templateError.message.includes('violates foreign key constraint')) {
        console.log('🔧 Foreign key constraint detected. This is expected with the anon key.')
        console.log('ℹ️  The database structure is correct, but we need proper authentication to seed data.')
        console.log('💡 Recommendation: Use the admin dashboard UI to create templates, or sign in first.')
        return
      }
    } else {
      console.log('✅ Template created successfully:', template.name)
      
      // Create sample semesters for the template
      const semesters = [
        { name: 'Fall Year 1', year: 1, season: 'Autumn', degree_template_id: template.id },
        { name: 'Spring Year 1', year: 1, season: 'Spring', degree_template_id: template.id },
        { name: 'Fall Year 2', year: 2, season: 'Autumn', degree_template_id: template.id },
        { name: 'Spring Year 2', year: 2, season: 'Spring', degree_template_id: template.id }
      ]
      
      const { data: createdSemesters, error: semesterError } = await supabase
        .from('degree_template_semesters')
        .insert(semesters)
        .select()
      
      if (semesterError) {
        console.error('❌ Error creating semesters:', semesterError)
      } else {
        console.log('✅ Created', createdSemesters.length, 'semesters')
        
        // Create sample courses
        const courses = [
          { name: 'Introduction to Programming', credits: 3, course_code: 'CS101', degree_template_semester_id: createdSemesters[0].id },
          { name: 'Calculus I', credits: 4, course_code: 'MATH101', degree_template_semester_id: createdSemesters[0].id },
          { name: 'English Composition', credits: 3, course_code: 'ENG101', degree_template_semester_id: createdSemesters[0].id },
          { name: 'Data Structures', credits: 3, course_code: 'CS201', degree_template_semester_id: createdSemesters[1].id },
          { name: 'Calculus II', credits: 4, course_code: 'MATH102', degree_template_semester_id: createdSemesters[1].id }
        ]
        
        const { data: createdCourses, error: courseError } = await supabase
          .from('degree_template_courses')
          .insert(courses)
          .select()
        
        if (courseError) {
          console.error('❌ Error creating courses:', courseError)
        } else {
          console.log('✅ Created', createdCourses.length, 'courses')
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
  
  console.log('🎉 Database seeding completed!')
}

seedDatabase().catch(console.error)