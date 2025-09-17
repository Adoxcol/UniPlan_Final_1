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

async function createSystemUser(): Promise<string> {
  // First, try to find existing system user
  const { data: existingUsers } = await adminClient.auth.admin.listUsers()
  const existingSystemUser = existingUsers?.users?.find(user => user.email === 'system@uniplan.local')
  
  if (existingSystemUser) {
    console.log('Using existing system user:', existingSystemUser.id)
    return existingSystemUser.id
  }

  // Create a system user for templates
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: 'system@uniplan.local',
    password: 'system-password-123',
    email_confirm: true
  })

  if (authError) {
    throw new Error(`Failed to create system user: ${authError.message}`)
  }

  // Create profile for the system user
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert([{
      user_id: authUser.user.id,
      first_name: 'System',
      last_name: 'User',
      is_admin: true,
      admin_level: 'super_admin',
      notes: 'System user for template seeding'
    }])

  if (profileError) {
    console.warn('Profile creation warning:', profileError.message)
  }

  return authUser.user.id
}

async function seedTemplateBypass(templateData: UniversityTemplateData, systemUserId: string) {
  try {
    console.log('Starting template seeding bypass...')
    console.log('Template:', templateData.name)
    console.log('Semesters:', templateData.semesters.length)
    console.log('Total courses:', templateData.semesters.reduce((sum, sem) => sum + sem.courses.length, 0))
    console.log('Total credits:', templateData.totalCredits)

    // First, create the degree template
    console.log('\n1. Creating degree template...')
    const degreeTemplateData = {
      name: templateData.name,
      description: templateData.description,
      university: templateData.university,
      major: templateData.major,
      minor: templateData.minor,
      total_credits: templateData.totalCredits,
      duration_years: templateData.durationYears,
      tags: templateData.tags,
      is_public: true,
      is_official: true,
      user_id: systemUserId,
    };

    const { data: templateResult, error: templateError } = await adminClient
      .from('degree_templates')
      .insert([degreeTemplateData])
      .select('id')
      .single();

    if (templateError) {
      throw new Error(`Failed to create template: ${templateError.message}`);
    }

    const templateId = templateResult.id;
    console.log('✓ Template created with ID:', templateId)

    // Create semesters and courses
    console.log('\n2. Creating semesters and courses...')
    for (let i = 0; i < templateData.semesters.length; i++) {
      const semester = templateData.semesters[i];
      console.log(`\n  Processing semester ${i + 1}/${templateData.semesters.length}: ${semester.name}`)
      
      // Insert semester
      const semesterData = {
        degree_template_id: templateId,
        name: semester.name,
        year: semester.year,
        season: semester.season || 'Autumn',
        notes: null
      };

      const { data: semesterResult, error: semesterError } = await adminClient
        .from('degree_template_semesters')
        .insert([semesterData])
        .select('id')
        .single();

      if (semesterError) {
        throw new Error(`Failed to create semester: ${semesterError.message}`);
      }

      const semesterId = semesterResult.id;
      console.log(`    ✓ Semester created with ID: ${semesterId}`)

      // Insert courses for this semester
      if (semester.courses.length > 0) {
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

        const { error: coursesError } = await adminClient
          .from('degree_template_courses')
          .insert(coursesData);

        if (coursesError) {
          throw new Error(`Failed to create courses: ${coursesError.message}`);
        }

        console.log(`    ✓ ${semester.courses.length} courses created successfully`)
      } else {
        console.log('    No courses to create for this semester')
      }
    }

    console.log('\n✓ Template seeding completed successfully!')
    return templateId

  } catch (error) {
    console.error('Template seeding failed:', error)
    throw error
  }
}

async function main() {
  try {
    // Create or get system user
    console.log('Setting up system user...')
    const systemUserId = await createSystemUser()
    console.log('✓ System user ready:', systemUserId)

    // Define the complete BBA template following the exact curriculum
    const bbaTemplate: UniversityTemplateData = {
      name: "Bachelor of Business Administration (BBA)",
      description: "A comprehensive 4-year undergraduate program in Business Administration from North South University. The program provides students with a solid foundation in business principles and practices.",
      university: "North South University",
      major: "Business Administration",
      totalCredits: 132, // Corrected total: 132 credits across 12 semesters
      durationYears: 4,
      tags: ["Business", "Administration", "Management", "Finance", "Marketing", "Bangladesh", "NSU"],
      semesters: [
        // 1st Semester (Year 1, Autumn)
        {
          name: "Semester 1 (Year 1)",
          year: 1,
          season: "Autumn",
          courses: [
            { name: "ENG102: English Composition II", code: "ENG102", credits: 3 },
            { name: "BUS112: Introduction to Business", code: "BUS112", credits: 3 },
            { name: "MIS107: Management Information Systems", code: "MIS107", credits: 3 }
          ]
        },
        // 2nd Semester (Year 1, Spring)
        {
          name: "Semester 2 (Year 1)",
          year: 1,
          season: "Spring",
          courses: [
            { name: "ECO101: Principles of Economics I", code: "ECO101", credits: 3 },
            { name: "ENG103: English Composition III", code: "ENG103", credits: 3 },
            { name: "Humanities - 1", code: "HUM101", credits: 3 },
            { name: "Social Science - 1", code: "SOC101", credits: 3 }
          ]
        },
        // 3rd Semester (Year 1, Summer)
        {
          name: "Semester 3 (Year 1)",
          year: 1,
          season: "Summer",
          courses: [
            { name: "BUS172: Business Statistics", code: "BUS172", credits: 3 },
            { name: "ECO104: Microeconomics", code: "ECO104", credits: 3 },
            { name: "ENG105: Advanced English", code: "ENG105", credits: 3 },
            { name: "Humanities - 2", code: "HUM102", credits: 3 }
          ]
        },
        // 4th Semester (Year 2, Autumn)
        {
          name: "Semester 4 (Year 2)",
          year: 2,
          season: "Autumn",
          courses: [
            { name: "ACT201: Principles of Accounting I", code: "ACT201", credits: 3 },
            { name: "BEN205: Bengali/ENG115/CHN101", code: "BEN205", credits: 3 },
            { name: "MKT202: Principles of Marketing", code: "MKT202", credits: 3 },
            { name: "BUS173: Business Mathematics", code: "BUS173", credits: 3 }
          ]
        },
        // 5th Semester (Year 2, Spring)
        {
          name: "Semester 5 (Year 2)",
          year: 2,
          season: "Spring",
          courses: [
            { name: "ACT202: Principles of Accounting II", code: "ACT202", credits: 3 },
            { name: "FIN254: Business Finance", code: "FIN254", credits: 3 },
            { name: "MGT212: Principles of Management", code: "MGT212", credits: 3 },
            { name: "Science - 1", code: "SCI101", credits: 3 }
          ]
        },
        // 6th Semester (Year 2, Summer)
        {
          name: "Semester 6 (Year 2)",
          year: 2,
          season: "Summer",
          courses: [
            { name: "BUS251: Business Law", code: "BUS251", credits: 3 },
            { name: "BUS135: Business Communication", code: "BUS135", credits: 3 },
            { name: "INB372: International Business", code: "INB372", credits: 3 },
            { name: "Science - 2", code: "SCI102", credits: 3 }
          ]
        },
        // 7th Semester (Year 3, Autumn)
        {
          name: "Semester 7 (Year 3)",
          year: 3,
          season: "Autumn",
          courses: [
            { name: "Major - 1", code: "MAJ101", credits: 3 },
            { name: "MGT314: Organizational Behavior", code: "MGT314", credits: 3 },
            { name: "MIS207: Database Management", code: "MIS207", credits: 3 },
            { name: "Science - 3", code: "SCI103", credits: 3 }
          ]
        },
        // 8th Semester (Year 3, Spring)
        {
          name: "Semester 8 (Year 3)",
          year: 3,
          season: "Spring",
          courses: [
            { name: "Major - 2", code: "MAJ102", credits: 3 },
            { name: "Free Elective - 1", code: "ELE101", credits: 3 },
            { name: "Business Law II", code: "LAW200", credits: 3 },
            { name: "MGT351: Strategic Management", code: "MGT351", credits: 3 }
          ]
        },
        // 9th Semester (Year 3, Summer)
        {
          name: "Semester 9 (Year 3)",
          year: 3,
          season: "Summer",
          courses: [
            { name: "Major - 3", code: "MAJ103", credits: 3 },
            { name: "Free Elective - 2", code: "ELE102", credits: 3 },
            { name: "MGT368: Operations Management", code: "MGT368", credits: 3 },
            { name: "Science - 4", code: "SCI104", credits: 3 }
          ]
        },
        // 10th Semester (Year 4, Autumn)
        {
          name: "Semester 10 (Year 4)",
          year: 4,
          season: "Autumn",
          courses: [
            { name: "Major - 4", code: "MAJ104", credits: 3 },
            { name: "Major Elective - 1", code: "MAJE101", credits: 3 },
            { name: "Free Elective - 3", code: "ELE103", credits: 3 },
            { name: "Humanities - 3", code: "HUM103", credits: 3 }
          ]
        },
        // 11th Semester (Year 4, Spring)
        {
          name: "Semester 11 (Year 4)",
          year: 4,
          season: "Spring",
          courses: [
            { name: "Social Science - 2", code: "SOC102", credits: 3 },
            { name: "Major Elective - 2", code: "MAJE102", credits: 3 },
            { name: "GED Elective", code: "GED101", credits: 3 },
            { name: "MGT489: Business Capstone", code: "MGT489", credits: 3 }
          ]
        },
        // 12th Semester (Year 4, Summer)
        {
          name: "Semester 12 (Year 4)",
          year: 4,
          season: "Summer",
          courses: [
            { name: "BUS498: Business Internship", code: "BUS498", credits: 3 }
          ]
        }
      ]
    };

    // Seed the template
    const templateId = await seedTemplateBypass(bbaTemplate, systemUserId)
    console.log('\n🎉 BBA template seeded successfully!')
    console.log('Template ID:', templateId)
    console.log('Total semesters:', bbaTemplate.semesters.length)
    console.log('Total courses:', bbaTemplate.semesters.reduce((sum, sem) => sum + sem.courses.length, 0))

  } catch (error) {
    console.error('Main process failed:', error)
    process.exit(1)
  }
}

main()