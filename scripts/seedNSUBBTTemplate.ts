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
        season: semester.season || 'Spring',
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

    // Define the NSU BBT template following the exact curriculum
    const nsuBBTTemplate: UniversityTemplateData = {
      name: "NSU BBT Degree Template",
      description: "North South University Bachelor of Biotechnology (BBT) - 4 years, 3 semesters per year, 120-130 total credits",
      university: "North South University",
      major: "Bachelor of Biotechnology (BBT)",
      minor: "",
      totalCredits: 130,
      durationYears: 4,
      tags: ["Biochemistry", "Biotechnology", "Life Sciences", "Molecular Biology", "Bangladesh", "NSU"],
      semesters: [
        // YEAR 1
        {
          name: "1st Semester",
          year: 1,
          season: "Spring",
          courses: [
            { name: "ENG102/ENG103 - English", code: "ENG102", credits: 3, isRequired: true },
            { name: "BIO103 - Biology", code: "BIO103", credits: 3, isRequired: true },
            { name: "CHE101 - Chemistry", code: "CHE101", credits: 3, isRequired: true }
          ]
        },
        {
          name: "2nd Semester",
          year: 1,
          season: "Summer",
          courses: [
            { name: "ENG103/ENG105 - English", code: "ENG103", credits: 3, isRequired: true },
            { name: "MAT116 - Mathematics", code: "MAT116", credits: 3, isRequired: true },
            { name: "BEN205 - Bangladesh Studies", code: "BEN205", credits: 2, isRequired: true },
            { name: "CHE101L - Chemistry Lab", code: "CHE101L", credits: 1, isRequired: true },
            { name: "BIO103L - Biology Lab", code: "BIO103L", credits: 2, isRequired: true }
          ]
        },
        {
          name: "3rd Semester",
          year: 1,
          season: "Autumn",
          courses: [
            { name: "CHE201 - Organic Chemistry", code: "CHE201", credits: 3, isRequired: true },
            { name: "BIO201 - Advanced Biology", code: "BIO201", credits: 3, isRequired: true },
            { name: "BIO201L - Advanced Biology Lab", code: "BIO201L", credits: 2, isRequired: true },
            { name: "MIS107 - Computer Applications", code: "MIS107", credits: 3, isRequired: true },
            { name: "POL101/POL104/ECO101/ECO104/SOC101/ANT101 - Social Science", code: "POL101", credits: 2, isRequired: true }
          ]
        },

        // YEAR 2
        {
          name: "4th Semester",
          year: 2,
          season: "Spring",
          courses: [
            { name: "BUS172 - Business Fundamentals", code: "BUS172", credits: 2, isRequired: true },
            { name: "CHE202 - Advanced Chemistry", code: "CHE202", credits: 3, isRequired: true },
            { name: "CHE202L - Advanced Chemistry Lab", code: "CHE202L", credits: 2, isRequired: true },
            { name: "HIS103 - History", code: "HIS103", credits: 3, isRequired: true }
          ]
        },
        {
          name: "5th Semester",
          year: 2,
          season: "Summer",
          courses: [
            { name: "BIO202 - Molecular Biology", code: "BIO202", credits: 3, isRequired: true },
            { name: "BBT221 - Introduction to Biotechnology", code: "BBT221", credits: 3, isRequired: true },
            { name: "CHE203 - Biochemistry", code: "CHE203", credits: 3, isRequired: true },
            { name: "CHE203L - Biochemistry Lab", code: "CHE203L", credits: 2, isRequired: true },
            { name: "BBT230 - Biostatistics", code: "BBT230", credits: 2, isRequired: true }
          ]
        },
        {
          name: "6th Semester",
          year: 2,
          season: "Autumn",
          courses: [
            { name: "BBT312 - Molecular Genetics", code: "BBT312", credits: 3, isRequired: true },
            { name: "BBT312L - Molecular Genetics Lab", code: "BBT312L", credits: 1, isRequired: true },
            { name: "BBT314 - Microbiology", code: "BBT314", credits: 3, isRequired: true },
            { name: "BBT314L - Microbiology Lab", code: "BBT314L", credits: 2, isRequired: true },
            { name: "BBT315 - Enzymology", code: "BBT315", credits: 3, isRequired: true },
            { name: "BIO202L - Molecular Biology Lab", code: "BIO202L", credits: 0, isRequired: true }
          ]
        },

        // YEAR 3
        {
          name: "7th Semester",
          year: 3,
          season: "Spring",
          courses: [
            { name: "BBT316 - Immunology", code: "BBT316", credits: 3, isRequired: true },
            { name: "BBT316L - Immunology Lab", code: "BBT316L", credits: 1, isRequired: true },
            { name: "BBT317 - Cell Biology", code: "BBT317", credits: 3, isRequired: true },
            { name: "BBT335 - Bioinformatics", code: "BBT335", credits: 3, isRequired: true }
          ]
        },
        {
          name: "8th Semester",
          year: 3,
          season: "Summer",
          courses: [
            { name: "BBT318 - Genetic Engineering", code: "BBT318", credits: 3, isRequired: true },
            { name: "BBT413 - Advanced Biotechnology", code: "BBT413", credits: 3, isRequired: true },
            { name: "BBT413L - Advanced Biotechnology Lab", code: "BBT413L", credits: 2, isRequired: true },
            { name: "BBT423 - Industrial Biotechnology", code: "BBT423", credits: 2, isRequired: false }
          ]
        },
        {
          name: "9th Semester",
          year: 3,
          season: "Autumn",
          courses: [
            { name: "BBT415 - Protein Chemistry", code: "BBT415", credits: 3, isRequired: true },
            { name: "BBT416 - Environmental Biotechnology", code: "BBT416", credits: 3, isRequired: true },
            { name: "BBT419 - Medical Biotechnology", code: "BBT419", credits: 3, isRequired: false }
          ]
        },

        // YEAR 4
        {
          name: "10th Semester",
          year: 4,
          season: "Spring",
          courses: [
            { name: "BBT415L - Protein Chemistry Lab", code: "BBT415L", credits: 2, isRequired: true },
            { name: "BBT417 - Plant Biotechnology", code: "BBT417", credits: 3, isRequired: true },
            { name: "BBT418 - Animal Biotechnology", code: "BBT418", credits: 3, isRequired: false },
            { name: "BBT424 - Research Methodology", code: "BBT424", credits: 2, isRequired: true }
          ]
        },
        {
          name: "11th Semester",
          year: 4,
          season: "Summer",
          courses: [
            { name: "BBT421 - Bioprocess Engineering", code: "BBT421", credits: 3, isRequired: false },
            { name: "BBT425 - Food Biotechnology", code: "BBT425", credits: 3, isRequired: false },
            { name: "BBT427 - Pharmaceutical Biotechnology", code: "BBT427", credits: 3, isRequired: false }
          ]
        },
        {
          name: "12th Semester",
          year: 4,
          season: "Autumn",
          courses: [
            { name: "BBT426 - Biosafety & Bioethics", code: "BBT426", credits: 3, isRequired: false },
            { name: "BBT422 - Thesis/Project", code: "BBT422", credits: 4, isRequired: true }
          ]
        }
      ]
    };

    // Seed the template
    console.log('\n🌱 Starting NSU BBT template seeding...')
    const templateId = await seedTemplateBypass(nsuBBTTemplate, systemUserId)
    console.log(`\n🎉 NSU BBT template created successfully with ID: ${templateId}`)
    
  } catch (error) {
    console.error('❌ Error seeding NSU BBT template:', error)
    process.exit(1)
  }
}

// Run the seeding script
if (require.main === module) {
  main()
}

export { main as seedNSUBBTTemplate }