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

interface CourseData {
  name: string;
  code: string;
  credits: number;
  prerequisites?: string;
  isRequired?: boolean;
}

interface SemesterData {
  name: string;
  year: number;
  season?: string;
  courses: CourseData[];
}

interface UniversityTemplateData {
  name: string;
  description: string;
  university: string;
  major: string;
  minor?: string;
  totalCredits: number;
  durationYears: number;
  tags: string[];
  semesters: SemesterData[];
}

async function debugTemplateSeeding() {
  try {
    console.log('Starting debug template seeding...')
    
    // Create a simple test template with just 2 semesters
    const testTemplate: UniversityTemplateData = {
      name: "Test BSCSE Template",
      description: "A test template for debugging",
      university: "Test University",
      major: "Computer Science",
      totalCredits: 150,
      durationYears: 4,
      tags: ["Test"],
      semesters: [
        {
          name: "1st Semester",
          year: 1,
          season: "Autumn",
          courses: [
            { name: "Introduction to Programming", code: "CSE101", credits: 3 },
            { name: "Calculus I", code: "MAT101", credits: 3 }
          ]
        },
        {
          name: "2nd Semester",
          year: 1,
          season: "Spring",
          courses: [
            { name: "Data Structures", code: "CSE201", credits: 3 },
            { name: "Calculus II", code: "MAT201", credits: 3 }
          ]
        }
      ]
    };

    console.log('Template data prepared:', {
      name: testTemplate.name,
      semesterCount: testTemplate.semesters.length,
      totalCourses: testTemplate.semesters.reduce((sum, sem) => sum + sem.courses.length, 0)
    })

    // First, create the degree template
    console.log('\n1. Creating degree template...')
    const degreeTemplateData = {
      name: testTemplate.name,
      description: testTemplate.description,
      university: testTemplate.university,
      major: testTemplate.major,
      minor: testTemplate.minor,
      total_credits: testTemplate.totalCredits,
      duration_years: testTemplate.durationYears,
      tags: testTemplate.tags,
      is_public: true,
      is_official: true,
      user_id: '00000000-0000-0000-0000-000000000000', // Use a dummy UUID for testing
    };

    const { data: templateResult, error: templateError } = await adminClient
      .from('degree_templates')
      .insert([degreeTemplateData])
      .select('id')
      .single();

    if (templateError) {
      console.error('Template creation error:', templateError)
      throw new Error(`Failed to create template: ${templateError.message}`);
    }

    const templateId = templateResult.id;
    console.log('✓ Template created with ID:', templateId)

    // Create semesters and courses
    console.log('\n2. Creating semesters and courses...')
    for (let i = 0; i < testTemplate.semesters.length; i++) {
      const semester = testTemplate.semesters[i];
      console.log(`\n  Processing semester ${i + 1}: ${semester.name}`)
      
      // Insert semester
      const semesterData = {
        degree_template_id: templateId,
        name: semester.name,
        year: semester.year,
        season: semester.season || 'Autumn',
        notes: null
      };

      console.log('    Semester data:', semesterData)

      const { data: semesterResult, error: semesterError } = await adminClient
        .from('degree_template_semesters')
        .insert([semesterData])
        .select('id')
        .single();

      if (semesterError) {
        console.error('    Semester creation error:', semesterError)
        throw new Error(`Failed to create semester: ${semesterError.message}`);
      }

      const semesterId = semesterResult.id;
      console.log('    ✓ Semester created with ID:', semesterId)

      // Insert courses for this semester
      console.log(`    Creating ${semester.courses.length} courses...`)
      const coursesData = semester.courses.map(course => ({
        degree_template_semester_id: semesterId,
        name: course.name,
        course_code: course.code,
        credits: course.credits,
        prerequisites: course.prerequisites || null,
        description: null,
        is_required: course.isRequired ?? true
      }));

      console.log('    Courses data:', coursesData)

      const { error: coursesError } = await adminClient
        .from('degree_template_courses')
        .insert(coursesData);

      if (coursesError) {
        console.error('    Courses creation error:', coursesError)
        throw new Error(`Failed to create courses: ${coursesError.message}`);
      }

      console.log('    ✓ All courses created successfully')
    }

    console.log('\n✓ Debug template seeding completed successfully!')
    
    // Verify the data
    console.log('\n3. Verifying created data...')
    const { data: verifyTemplate } = await adminClient
      .from('degree_templates')
      .select('*')
      .eq('id', templateId)
      .single()
    
    const { data: verifySemesters } = await adminClient
      .from('degree_template_semesters')
      .select('*')
      .eq('degree_template_id', templateId)
    
    const { data: verifyCourses } = await adminClient
      .from('degree_template_courses')
      .select('*')
      .in('degree_template_semester_id', verifySemesters?.map(s => s.id) || [])
    
    console.log('Verification results:')
    console.log('  Template:', verifyTemplate?.name)
    console.log('  Semesters:', verifySemesters?.length)
    console.log('  Courses:', verifyCourses?.length)

  } catch (error) {
    console.error('Debug seeding failed:', error)
  }
}

debugTemplateSeeding()