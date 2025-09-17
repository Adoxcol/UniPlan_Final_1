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
    // First, clear existing templates to avoid duplicates
    console.log('Clearing existing templates...')
    await adminClient.from('degree_templates').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // Create or get system user
    console.log('Setting up system user...')
    const systemUserId = await createSystemUser()
    console.log('✓ System user ready:', systemUserId)

    // Define the complete BSCSE template following the exact curriculum
    const bscseTemplate: UniversityTemplateData = {
      name: "Bachelor of Science in Computer Science and Engineering (BSCSE)",
      description: "A comprehensive 4-year undergraduate program in Computer Science and Engineering following UGC approved curriculum. Effective from Spring 2018.",
      university: "North South University",
      major: "Computer Science and Engineering",
      totalCredits: 130, // Total from curriculum
      durationYears: 4,
      tags: ["Computer Science", "Engineering", "Programming", "Software Development", "Bangladesh", "UGC"],
      semesters: [
        // 1st Semester - 8 credits
        {
          name: "1st Semester",
          year: 1,
          season: "Autumn",
          courses: [
            { name: "ENG102: Introduction to Composition", code: "ENG102", credits: 3 },
            { name: "MAT116: Pre-Calculus", code: "MAT116", credits: 0 },
            { name: "EEE154: Engineering Drawing", code: "EEE154", credits: 1 },
            { name: "CSE115+CL: Programming Language I", code: "CSE115+CL", credits: 4 }
          ]
        },
        // 2nd Semester - 12 credits
        {
          name: "2nd Semester",
          year: 1,
          season: "Spring",
          courses: [
            { name: "ENG103: Intermediate Composition", code: "ENG103", credits: 3, prerequisites: "ENG102/Waiver" },
            { name: "MAT120: Calculus I", code: "MAT120", credits: 3, prerequisites: "MAT116" },
            { name: "MAT125: Linear Algebra", code: "MAT125", credits: 3, prerequisites: "MAT116" },
            { name: "CSE173: Discrete Mathematics", code: "CSE173", credits: 3, prerequisites: "CSE115" }
          ]
        },
        // 3rd Semester - 14 credits
        {
          name: "3rd Semester",
          year: 2,
          season: "Autumn",
          courses: [
            { name: "ENG111: Public Speaking", code: "ENG111", credits: 3 },
            { name: "MAT130: Calculus II", code: "MAT130", credits: 3, prerequisites: "MAT120" },
            { name: "PHY107+CL: Physics I", code: "PHY107+CL", credits: 4, prerequisites: "MAT120" },
            { name: "CSE215 + CL: Programming Language II", code: "CSE215+CL", credits: 4, prerequisites: "CSE173" }
          ]
        },
        // 4th Semester - 13 credits
        {
          name: "4th Semester",
          year: 2,
          season: "Spring",
          courses: [
            { name: "PHI104: Introduction to Ethics", code: "PHI104", credits: 3 },
            { name: "MAT250: Calculus III", code: "MAT250", credits: 3, prerequisites: "MAT130" },
            { name: "PHY108+CL: Physics II", code: "PHY108+CL", credits: 4, prerequisites: "MAT130 and PHY107" },
            { name: "CSE225 + IL: Data Structures and Algorithm", code: "CSE225+IL", credits: 3, prerequisites: "CSE215" }
          ]
        },
        // 5th Semester - 13 credits
        {
          name: "5th Semester",
          year: 3,
          season: "Autumn",
          courses: [
            { name: "BEN205: Bengali Language & Literature", code: "BEN205", credits: 3, prerequisites: "ENG103" },
            { name: "MAT350: Engineering Mathematics", code: "MAT350", credits: 3, prerequisites: "MAT250" },
            { name: "EEE141 + CL: Electric Circuit I", code: "EEE141+CL", credits: 4, prerequisites: "PHY107 and MAT120" },
            { name: "CSE231 + IL: Digital Logic Design", code: "CSE231+IL", credits: 3, prerequisites: "CSE173" }
          ]
        },
        // 6th Semester - 7 credits
        {
          name: "6th Semester",
          year: 3,
          season: "Spring",
          courses: [
            { name: "HIS102: Introduction to World Civilization", code: "HIS102", credits: 3 },
            { name: "MAT361: Probability and Statistics", code: "MAT361", credits: 3, prerequisites: "MAT250" },
            { name: "CSE299: Junior Design", code: "CSE299", credits: 1, prerequisites: "60 credits completed" }
          ]
        },
        // 7th Semester - 14 credits
        {
          name: "7th Semester",
          year: 4,
          season: "Autumn",
          courses: [
            { name: "HIS103: Emergence of Bangladesh", code: "HIS103", credits: 3 },
            { name: "CHE101+CL: Chemistry I", code: "CHE101+CL", credits: 4 },
            { name: "EEE111 + CL: Analog Electronics I", code: "EEE111+CL", credits: 4, prerequisites: "MAT350" },
            { name: "CSE332: Computer Organization and Architecture", code: "CSE332", credits: 3, prerequisites: "EEE141" },
            { name: "POL101/POL104: Introduction to Political Science/Governance", code: "POL101", credits: 3, prerequisites: "CSE231" }
          ]
        },
        // 8th Semester - 12 credits
        {
          name: "8th Semester",
          year: 4,
          season: "Spring",
          courses: [
            { name: "CSE311 + IL: Database Systems", code: "CSE311+IL", credits: 3, prerequisites: "CSE225" },
            { name: "CSE323: Operating Systems Design", code: "CSE323", credits: 3, prerequisites: "CSE332" },
            { name: "CSE373: Design and Analysis of Algorithms", code: "CSE373", credits: 3, prerequisites: "CSE225 and MAT361" },
            { name: "ECO101/ECO104: Introduction to Microeconomics/Macroeconomics", code: "ECO101", credits: 3 }
          ]
        },
        // 9th Semester - 13 credits
        {
          name: "9th Semester",
          year: 5,
          season: "Autumn",
          courses: [
            { name: "BIO103+CL: Biology I", code: "BIO103+CL", credits: 4 },
            { name: "CSE327: Software Engineering", code: "CSE327", credits: 3, prerequisites: "CSE311" },
            { name: "CSE331: Microprocessor Interfacing and Embedded System + IL", code: "CSE331+IL", credits: 3, prerequisites: "CSE323" },
            { name: "SOC101/ANT101/ENV203(GEO205): Introduction to Sociology/Anthropology/Bangladesh Geography", code: "SOC101", credits: 3 }
          ]
        },
        // 10th Semester - 9 credits
        {
          name: "10th Semester",
          year: 5,
          season: "Spring",
          courses: [
            { name: "CSE425: Concepts of Programming Language", code: "CSE425", credits: 3, prerequisites: "CSE327" },
            { name: "EEE452: Engineering Economics", code: "EEE452", credits: 3 },
            { name: "ELECT1", code: "ELECT1", credits: 3 }
          ]
        },
        // 11th Semester - 7.5 credits
        {
          name: "11th Semester",
          year: 6,
          season: "Autumn",
          courses: [
            { name: "ELECT2", code: "ELECT2", credits: 3 },
            { name: "CSE499A: Senior Design I", code: "CSE499A", credits: 1.5, prerequisites: "100 credits completed" },
            { name: "ELECT3", code: "ELECT3", credits: 3 }
          ]
        },
        // 12th Semester - 7.5 credits
        {
          name: "12th Semester",
          year: 6,
          season: "Spring",
          courses: [
            { name: "OPEN ELECT", code: "OPEN_ELECT", credits: 3 },
            { name: "CSE499B: Senior Design II", code: "CSE499B", credits: 1.5, prerequisites: "CSE499A" }
          ]
        }
      ]
    };

    // Seed the template
    const templateId = await seedTemplateBypass(bscseTemplate, systemUserId)
    console.log('\n🎉 BSCSE template seeded successfully!')
    console.log('Template ID:', templateId)
    console.log('Total semesters:', bscseTemplate.semesters.length)
    console.log('Total courses:', bscseTemplate.semesters.reduce((sum, sem) => sum + sem.courses.length, 0))

  } catch (error) {
    console.error('Main process failed:', error)
    process.exit(1)
  }
}

main()