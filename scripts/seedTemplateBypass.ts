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

    // Define the Finance template following the exact curriculum
    const financeTemplate: UniversityTemplateData = {
      name: "Bachelor of Business Administration - Major in Finance",
      description: "A comprehensive 4-year undergraduate program in Finance from North South University. The program provides students with a solid foundation in financial principles, investment analysis, and corporate finance.",
      university: "North South University",
      major: "Finance",
      totalCredits: 127,
      durationYears: 4,
      tags: ["Finance", "Business", "Investment", "Banking", "Corporate Finance", "Bangladesh", "NSU"],
      semesters: [
        // 1st Semester (Year 1)
        {
          name: "Semester 1",
          year: 1,
          season: "Autumn",
          courses: [
            { name: "ENG102: English Composition II", code: "ENG102", credits: 3 },
            { name: "BUS112: Introduction to Business", code: "BUS112", credits: 3 },
            { name: "MIS107: Management Information Systems", code: "MIS107", credits: 3 }
          ]
        },
        // 2nd Semester (Year 1)
        {
          name: "Semester 2",
          year: 1,
          season: "Spring",
          courses: [
            { name: "ACT202: Principles of Accounting II", code: "ACT202", credits: 3 },
            { name: "ENG103: English Composition III", code: "ENG103", credits: 3 },
            { name: "ECO104: Microeconomics", code: "ECO104", credits: 3 },
            { name: "MIS107: Management Information Systems", code: "MIS107", credits: 3 }
          ]
        },
        // 3rd Semester (Year 1)
        {
          name: "Semester 3",
          year: 1,
          season: "Summer",
          courses: [
            { name: "FIN254: Business Finance", code: "FIN254", credits: 3 },
            { name: "BUS172: Business Statistics", code: "BUS172", credits: 3 },
            { name: "BUS173: Business Mathematics", code: "BUS173", credits: 3 },
            { name: "Humanities 1", code: "HUM101", credits: 3 }
          ]
        },
        // 4th Semester (Year 2)
        {
          name: "Semester 4",
          year: 2,
          season: "Autumn",
          courses: [
            { name: "FIN318: Corporate Finance", code: "FIN318", credits: 3 },
            { name: "BUS251: Business Law", code: "BUS251", credits: 3 },
            { name: "Social Science 1", code: "SOC101", credits: 3 },
            { name: "Humanities 2", code: "HUM102", credits: 3 }
          ]
        },
        // 5th Semester (Year 2)
        {
          name: "Semester 5",
          year: 2,
          season: "Spring",
          courses: [
            { name: "FIN433: Investment Analysis", code: "FIN433", credits: 3 },
            { name: "BEN205: Bengali/ENG115/CHN101", code: "BEN205", credits: 3 },
            { name: "BUS135: Business Communication", code: "BUS135", credits: 3 },
            { name: "Open Elective 1", code: "OE101", credits: 3 }
          ]
        },
        // 6th Semester (Year 2)
        {
          name: "Semester 6",
          year: 2,
          season: "Summer",
          courses: [
            { name: "FIN440: Financial Markets", code: "FIN440", credits: 3 },
            { name: "BUS172: Business Statistics", code: "BUS172", credits: 3 },
            { name: "Science 2", code: "SCI102", credits: 3 },
            { name: "Humanities 1", code: "HUM101", credits: 3 }
          ]
        },
        // 7th Semester (Year 3)
        {
          name: "Semester 7",
          year: 3,
          season: "Autumn",
          courses: [
            { name: "Major Elective 1", code: "ME101", credits: 3 },
            { name: "Open Elective 2", code: "OE102", credits: 3 },
            { name: "BUS135: Business Communication", code: "BUS135", credits: 3 }
          ]
        },
        // 8th Semester (Year 3)
        {
          name: "Semester 8",
          year: 3,
          season: "Spring",
          courses: [
            { name: "Major Elective 2", code: "ME102", credits: 3 },
            { name: "MGT314: Organizational Behavior", code: "MGT314", credits: 3 },
            { name: "Lab course/any one ISAC", code: "LAB101", credits: 1 }
          ]
        },
        // 9th Semester (Year 3)
        {
          name: "Semester 9",
          year: 3,
          season: "Summer",
          courses: [
            { name: "PHI101: Philosophy", code: "PHI101", credits: 3 },
            { name: "MGT314: Organizational Behavior", code: "MGT314", credits: 3 },
            { name: "Open Elective 3", code: "OE103", credits: 3 }
          ]
        },
        // 10th Semester (Year 4)
        {
          name: "Semester 10",
          year: 4,
          season: "Autumn",
          courses: [
            { name: "Major Elective 2", code: "ME102", credits: 3 },
            { name: "MGT314: Organizational Behavior", code: "MGT314", credits: 3 },
            { name: "Lab course/any one ISAC", code: "LAB101", credits: 1 }
          ]
        },
        // 11th Semester (Year 4)
        {
          name: "Semester 11",
          year: 4,
          season: "Spring",
          courses: [
            { name: "PHI101: Philosophy", code: "PHI101", credits: 3 },
            { name: "MGT314: Organizational Behavior", code: "MGT314", credits: 3 },
            { name: "Open Elective 3", code: "OE103", credits: 3 }
          ]
        },
        // 12th Semester (Year 4)
        {
          name: "Semester 12",
          year: 4,
          season: "Summer",
          courses: [
            { name: "BUS498: Business Internship", code: "BUS498", credits: 3 }
          ]
        }
      ]
    };

    // Define the Accounting template following the exact curriculum
    const accountingTemplate: UniversityTemplateData = {
      name: "Bachelor of Business Administration - Major in Accounting",
      description: "A comprehensive 4-year undergraduate program in Accounting from North South University. The program provides students with a solid foundation in accounting principles, auditing, and financial reporting.",
      university: "North South University",
      major: "Accounting",
      totalCredits: 127,
      durationYears: 4,
      tags: ["Accounting", "Business", "Auditing", "Financial Reporting", "CPA", "Bangladesh", "NSU"],
      semesters: [
        // 1st Semester (Year 1)
        {
          name: "Semester 1",
          year: 1,
          season: "Autumn",
          courses: [
            { name: "ENG102: English Composition II", code: "ENG102", credits: 3 },
            { name: "ACT201: Principles of Accounting I", code: "ACT201", credits: 3 },
            { name: "MIS107: Management Information Systems", code: "MIS107", credits: 3 }
          ]
        },
        // 2nd Semester (Year 1)
        {
          name: "Semester 2",
          year: 1,
          season: "Spring",
          courses: [
            { name: "BEN205: Bengali/ENG115/CHN101", code: "BEN205", credits: 3 },
            { name: "ECO104: Microeconomics", code: "ECO104", credits: 3 },
            { name: "Social Science 1", code: "SOC101", credits: 3 },
            { name: "Humanities 1", code: "HUM101", credits: 3 }
          ]
        },
        // 3rd Semester (Year 1)
        {
          name: "Semester 3",
          year: 1,
          season: "Summer",
          courses: [
            { name: "BUS172: Business Statistics", code: "BUS172", credits: 3 },
            { name: "BUS172: Business Statistics", code: "BUS172", credits: 3 },
            { name: "Science 2", code: "SCI102", credits: 3 }
          ]
        },
        // 4th Semester (Year 2)
        {
          name: "Semester 4",
          year: 2,
          season: "Autumn",
          courses: [
            { name: "ACT179: Cost Accounting", code: "ACT179", credits: 3 },
            { name: "BUS172: Business Statistics", code: "BUS172", credits: 3 },
            { name: "Major Elective 1", code: "ME101", credits: 3 }
          ]
        },
        // 5th Semester (Year 2)
        {
          name: "Semester 5",
          year: 2,
          season: "Spring",
          courses: [
            { name: "ACT179: Cost Accounting", code: "ACT179", credits: 3 },
            { name: "BUS172: Business Statistics", code: "BUS172", credits: 3 },
            { name: "Major Elective 1", code: "ME101", credits: 3 }
          ]
        },
        // 6th Semester (Year 2)
        {
          name: "Semester 6",
          year: 2,
          season: "Summer",
          courses: [
            { name: "Social Science 2", code: "SOC102", credits: 3 },
            { name: "BUS172: Business Statistics", code: "BUS172", credits: 3 },
            { name: "Major Elective 1", code: "ME101", credits: 3 }
          ]
        },
        // 7th Semester (Year 3)
        {
          name: "Semester 7",
          year: 3,
          season: "Autumn",
          courses: [
            { name: "Major Elective 2", code: "ME102", credits: 3 },
            { name: "Open Elective 2", code: "OE102", credits: 3 },
            { name: "MGT314: Organizational Behavior", code: "MGT314", credits: 3 }
          ]
        },
        // 8th Semester (Year 3)
        {
          name: "Semester 8",
          year: 3,
          season: "Spring",
          courses: [
            { name: "Major Elective 2", code: "ME102", credits: 3 },
            { name: "Open Elective 2", code: "OE102", credits: 3 },
            { name: "MGT314: Organizational Behavior", code: "MGT314", credits: 3 }
          ]
        },
        // 9th Semester (Year 3)
        {
          name: "Semester 9",
          year: 3,
          season: "Summer",
          courses: [
            { name: "Major Elective 2", code: "ME102", credits: 3 },
            { name: "Open Elective 2", code: "OE102", credits: 3 },
            { name: "MGT314: Organizational Behavior", code: "MGT314", credits: 3 }
          ]
        },
        // 10th Semester (Year 4)
        {
          name: "Semester 10",
          year: 4,
          season: "Autumn",
          courses: [
            { name: "Major Elective 2", code: "ME102", credits: 3 },
            { name: "Open Elective 2", code: "OE102", credits: 3 },
            { name: "MGT314: Organizational Behavior", code: "MGT314", credits: 3 }
          ]
        },
        // 11th Semester (Year 4)
        {
          name: "Semester 11",
          year: 4,
          season: "Spring",
          courses: [
            { name: "Major Elective 2", code: "ME102", credits: 3 },
            { name: "Open Elective 2", code: "OE102", credits: 3 },
            { name: "MGT314: Organizational Behavior", code: "MGT314", credits: 3 }
          ]
        },
        // 12th Semester (Year 4)
        {
          name: "Semester 12",
          year: 4,
          season: "Summer",
          courses: [
            { name: "BUS498: Business Internship", code: "BUS498", credits: 3 }
          ]
        }
      ]
    };

    // Define the Microbiology template following the exact curriculum
    const microbiologyTemplate: UniversityTemplateData = {
      name: "Bachelor of Science - Major in Microbiology",
      description: "A comprehensive 4-year undergraduate program in Microbiology from North South University. The program provides students with a solid foundation in microbiology, biochemistry, and related biological sciences.",
      university: "North South University",
      major: "Microbiology",
      totalCredits: 130,
      durationYears: 4,
      tags: ["Microbiology", "Biology", "Science", "Research", "Laboratory", "Bangladesh", "NSU"],
      semesters: [
        // 1st Semester (Year 1)
        {
          name: "Semester 1",
          year: 1,
          season: "Spring",
          courses: [
            { name: "ENG103: English Composition", code: "ENG103", credits: 3 },
            { name: "MAT110: Calculus I", code: "MAT110", credits: 3 },
            { name: "CHE109: General Chemistry I", code: "CHE109", credits: 3 },
            { name: "CHE110: General Chemistry I Lab", code: "CHE110", credits: 1 },
            { name: "BIO103: Principles of Biology I", code: "BIO103", credits: 3 },
            { name: "BIO104: Principles of Biology I Lab", code: "BIO104", credits: 1 }
          ]
        },
        // 2nd Semester (Year 1)
        {
          name: "Semester 2",
          year: 1,
          season: "Summer",
          courses: [
            { name: "ENG104: English Composition II", code: "ENG104", credits: 3 },
            { name: "MAT111: Calculus II", code: "MAT111", credits: 3 },
            { name: "CHE111: General Chemistry II", code: "CHE111", credits: 3 },
            { name: "CHE112: General Chemistry II Lab", code: "CHE112", credits: 1 },
            { name: "BIO105: Principles of Biology II", code: "BIO105", credits: 3 },
            { name: "BIO106: Principles of Biology II Lab", code: "BIO106", credits: 1 }
          ]
        },
        // 3rd Semester (Year 1)
        {
          name: "Semester 3",
          year: 1,
          season: "Autumn",
          courses: [
            { name: "PHY107: Physics I", code: "PHY107", credits: 3 },
            { name: "PHY108: Physics I Lab", code: "PHY108", credits: 1 },
            { name: "CHE201: Organic Chemistry I", code: "CHE201", credits: 3 },
            { name: "CHE202: Organic Chemistry I Lab", code: "CHE202", credits: 1 },
            { name: "BIO201: Cell Biology", code: "BIO201", credits: 3 },
            { name: "BIO202: Cell Biology Lab", code: "BIO202", credits: 1 }
          ]
        },
        // 4th Semester (Year 2)
        {
          name: "Semester 4",
          year: 2,
          season: "Spring",
          courses: [
            { name: "PHY109: Physics II", code: "PHY109", credits: 3 },
            { name: "PHY110: Physics II Lab", code: "PHY110", credits: 1 },
            { name: "CHE203: Organic Chemistry II", code: "CHE203", credits: 3 },
            { name: "CHE204: Organic Chemistry II Lab", code: "CHE204", credits: 1 },
            { name: "BIO203: Genetics", code: "BIO203", credits: 3 },
            { name: "BIO204: Genetics Lab", code: "BIO204", credits: 1 }
          ]
        },
        // 5th Semester (Year 2)
        {
          name: "Semester 5",
          year: 2,
          season: "Summer",
          courses: [
            { name: "MAT205: Statistics", code: "MAT205", credits: 3 },
            { name: "CHE301: Biochemistry I", code: "CHE301", credits: 3 },
            { name: "CHE302: Biochemistry I Lab", code: "CHE302", credits: 1 },
            { name: "MIC201: Introduction to Microbiology", code: "MIC201", credits: 3 },
            { name: "MIC202: Introduction to Microbiology Lab", code: "MIC202", credits: 1 }
          ]
        },
        // 6th Semester (Year 2)
        {
          name: "Semester 6",
          year: 2,
          season: "Autumn",
          courses: [
            { name: "CHE303: Biochemistry II", code: "CHE303", credits: 3 },
            { name: "CHE304: Biochemistry II Lab", code: "CHE304", credits: 1 },
            { name: "MIC301: Bacterial Physiology", code: "MIC301", credits: 3 },
            { name: "MIC302: Bacterial Physiology Lab", code: "MIC302", credits: 1 },
            { name: "BIO301: Molecular Biology", code: "BIO301", credits: 3 },
            { name: "BIO302: Molecular Biology Lab", code: "BIO302", credits: 1 }
          ]
        },
        // 7th Semester (Year 3)
        {
          name: "Semester 7",
          year: 3,
          season: "Spring",
          courses: [
            { name: "MIC303: Virology", code: "MIC303", credits: 3 },
            { name: "MIC304: Virology Lab", code: "MIC304", credits: 1 },
            { name: "MIC305: Immunology", code: "MIC305", credits: 3 },
            { name: "MIC306: Immunology Lab", code: "MIC306", credits: 1 },
            { name: "BIO303: Ecology", code: "BIO303", credits: 3 },
            { name: "General Education Elective", code: "GED101", credits: 3 }
          ]
        },
        // 8th Semester (Year 3)
        {
          name: "Semester 8",
          year: 3,
          season: "Summer",
          courses: [
            { name: "MIC401: Medical Microbiology", code: "MIC401", credits: 3 },
            { name: "MIC402: Medical Microbiology Lab", code: "MIC402", credits: 1 },
            { name: "MIC403: Environmental Microbiology", code: "MIC403", credits: 3 },
            { name: "MIC404: Environmental Microbiology Lab", code: "MIC404", credits: 1 },
            { name: "BIO401: Biotechnology", code: "BIO401", credits: 3 },
            { name: "General Education Elective", code: "GED102", credits: 3 }
          ]
        },
        // 9th Semester (Year 3)
        {
          name: "Semester 9",
          year: 3,
          season: "Autumn",
          courses: [
            { name: "MIC405: Food Microbiology", code: "MIC405", credits: 3 },
            { name: "MIC406: Food Microbiology Lab", code: "MIC406", credits: 1 },
            { name: "MIC407: Industrial Microbiology", code: "MIC407", credits: 3 },
            { name: "MIC408: Industrial Microbiology Lab", code: "MIC408", credits: 1 },
            { name: "BIO403: Bioinformatics", code: "BIO403", credits: 3 },
            { name: "Major Elective", code: "ME101", credits: 3 }
          ]
        },
        // 10th Semester (Year 4)
        {
          name: "Semester 10",
          year: 4,
          season: "Spring",
          courses: [
            { name: "MIC409: Microbial Genetics", code: "MIC409", credits: 3 },
            { name: "MIC410: Microbial Genetics Lab", code: "MIC410", credits: 1 },
            { name: "MIC411: Research Methodology", code: "MIC411", credits: 3 },
            { name: "BIO405: Bioethics", code: "BIO405", credits: 3 },
            { name: "Major Elective", code: "ME102", credits: 3 },
            { name: "Open Elective", code: "OE101", credits: 3 }
          ]
        },
        // 11th Semester (Year 4)
        {
          name: "Semester 11",
          year: 4,
          season: "Summer",
          courses: [
            { name: "MIC497: Research Project I", code: "MIC497", credits: 3 },
            { name: "MIC413: Advanced Microbiology", code: "MIC413", credits: 3 },
            { name: "MIC414: Advanced Microbiology Lab", code: "MIC414", credits: 1 },
            { name: "Major Elective", code: "ME103", credits: 3 },
            { name: "Open Elective", code: "OE102", credits: 3 }
          ]
        },
        // 12th Semester (Year 4)
        {
          name: "Semester 12",
          year: 4,
          season: "Autumn",
          courses: [
            { name: "MIC498: Research Project II", code: "MIC498", credits: 3 },
            { name: "MIC499: Internship", code: "MIC499", credits: 3 },
            { name: "Major Elective", code: "ME104", credits: 3 },
            { name: "Open Elective", code: "OE103", credits: 3 }
          ]
        }
      ]
    };

    // Seed all templates
    console.log('\n🚀 Starting template seeding process...')
    
    const financeTemplateId = await seedTemplateBypass(financeTemplate, systemUserId)
    console.log('\n🎉 Finance template seeded successfully!')
    console.log('Template ID:', financeTemplateId)
    console.log('Total semesters:', financeTemplate.semesters.length)
    console.log('Total courses:', financeTemplate.semesters.reduce((sum, sem) => sum + sem.courses.length, 0))

    const accountingTemplateId = await seedTemplateBypass(accountingTemplate, systemUserId)
    console.log('\n🎉 Accounting template seeded successfully!')
    console.log('Template ID:', accountingTemplateId)
    console.log('Total semesters:', accountingTemplate.semesters.length)
    console.log('Total courses:', accountingTemplate.semesters.reduce((sum, sem) => sum + sem.courses.length, 0))

    const microbiologyTemplateId = await seedTemplateBypass(microbiologyTemplate, systemUserId)
    console.log('\n🎉 Microbiology template seeded successfully!')
    console.log('Template ID:', microbiologyTemplateId)
    console.log('Total semesters:', microbiologyTemplate.semesters.length)
    console.log('Total courses:', microbiologyTemplate.semesters.reduce((sum, sem) => sum + sem.courses.length, 0))

    console.log('\n✅ All templates seeded successfully!')

  } catch (error) {
    console.error('Main process failed:', error)
    process.exit(1)
  }
}

main()