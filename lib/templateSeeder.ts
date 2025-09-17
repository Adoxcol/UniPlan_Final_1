import { createClient } from '@supabase/supabase-js';
import { CreateDegreeTemplateData } from './degreeTemplateService';
import { hasPermission, isCurrentUserAdmin } from './adminUtils';

// Create admin client for seeding (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const adminClient = createClient(supabaseUrl, supabaseAnonKey);

interface CourseData {
  name: string;
  code?: string;
  credits: number;
  prerequisites?: string;
  isRequired?: boolean;
}

interface SemesterData {
  name: string;
  year: number;
  season: 'Autumn' | 'Spring' | 'Summer';
  courses: CourseData[];
  notes?: string;
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

export class TemplateSeeder {
  /**
   * Create an official university template
   */
  static async createOfficialTemplate(templateData: UniversityTemplateData): Promise<void> {
    // Check if current user has admin permissions to seed templates
    const canSeed = await hasPermission('canSeedTemplates');
    if (!canSeed) {
      throw new Error('Insufficient permissions to seed templates. Admin access required.');
    }

    // Get current user ID
    const { data: { user } } = await adminClient.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to seed templates');
    }
    
    const systemUserId = user.id;
    
    // First, create the degree template
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
      is_official: true, // Mark as official template
      user_id: user.id, // Use authenticated admin user ID
    };

    // Insert the degree template and get its ID
    const { data: templateResult, error: templateError } = await adminClient
      .from('degree_templates')
      .insert([degreeTemplateData])
      .select('id')
      .single();

    if (templateError) {
      throw new Error(`Failed to create template: ${templateError.message}`);
    }

    const templateId = templateResult.id;

    // Create semesters and courses
    for (const semester of templateData.semesters) {
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

      // Insert courses for this semester
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
    }
  }

  /**
   * Seed BSCSE (Bachelor of Science in Computer Science and Engineering) template
   */
  static async seedBSCSETemplate(): Promise<void> {
    const bscseTemplate: UniversityTemplateData = {
      name: "Bachelor of Science in Computer Science and Engineering (BSCSE)",
      description: "A comprehensive 4-year undergraduate program in Computer Science and Engineering covering programming, mathematics, algorithms, software engineering, and specialized areas like AI, databases, and computer networks.",
      university: "University of Global Campus (UGC)",
      major: "Computer Science and Engineering",
      totalCredits: 150,
      durationYears: 4,
      tags: ["Computer Science", "Engineering", "Programming", "Software Development", "Bangladesh", "UGC"],
      semesters: [
        {
          name: "1st Semester",
          year: 1,
          season: "Autumn",
          courses: [
            { name: "Introduction to Composition", code: "ENG102", credits: 3 },
            { name: "Pre-Calculus", code: "MAT116", credits: 0 },
            { name: "Engineering Drawing", code: "EEE154 (CEE110)", credits: 1 },
            { name: "Programming Language I", code: "CSE115+CL", credits: 4 }
          ]
        },
        {
          name: "2nd Semester", 
          year: 1,
          season: "Spring",
          courses: [
            { name: "Intermediate Composition", code: "ENG103", credits: 3, prerequisites: "ENG102/Waiver" },
            { name: "Calculus I", code: "MAT120", credits: 3, prerequisites: "MAT116" },
            { name: "Linear Algebra", code: "MAT125", credits: 3, prerequisites: "MAT116" },
            { name: "Discrete Mathematics", code: "CSE173", credits: 3, prerequisites: "CSE115" }
          ]
        },
        {
          name: "3rd Semester",
          year: 2, 
          season: "Autumn",
          courses: [
            { name: "Public Speaking", code: "ENG111", credits: 3 },
            { name: "Calculus II", code: "MAT130", credits: 3, prerequisites: "MAT120" },
            { name: "Physics I", code: "PHY107+CL", credits: 4, prerequisites: "MAT120" },
            { name: "Programming Language II", code: "CSE215 + CL", credits: 4, prerequisites: "CSE173" }
          ]
        },
        {
          name: "4th Semester",
          year: 2,
          season: "Spring", 
          courses: [
            { name: "Introduction to Ethics", code: "PHI104", credits: 3 },
            { name: "Calculus III", code: "MAT250", credits: 3, prerequisites: "MAT130" },
            { name: "Physics II", code: "PHY108+CL", credits: 4, prerequisites: "MAT130 and PHY107" },
            { name: "Data Structures and Algorithm", code: "CSE225 + IL", credits: 3, prerequisites: "CSE215" }
          ]
        },
        {
          name: "5th Semester",
          year: 3,
          season: "Autumn",
          courses: [
            { name: "Bengali Language & Literature", code: "BEN205", credits: 3, prerequisites: "ENG103" },
            { name: "Engineering Mathematics", code: "MAT350", credits: 3, prerequisites: "MAT250" },
            { name: "Electric Circuit I", code: "EEE141 + CL", credits: 4, prerequisites: "PHY107 and MAT120" },
            { name: "Digital Logic Design", code: "CSE231 + IL", credits: 3, prerequisites: "CSE173" }
          ]
        },
        {
          name: "6th Semester", 
          year: 3,
          season: "Spring",
          courses: [
            { name: "Introduction to World Civilization", code: "HIS102", credits: 3 },
            { name: "Probability and Statistics", code: "MAT361", credits: 3, prerequisites: "MAT250" },
            { name: "Junior Design", code: "CSE299", credits: 1, prerequisites: "60 credits completed" },
            { name: "Emergence of Bangladesh", code: "HIS103", credits: 3 }
          ]
        },
        {
          name: "7th Semester",
          year: 4,
          season: "Autumn", 
          courses: [
            { name: "Chemistry I", code: "CHE101+CL", credits: 4, prerequisites: "MAT350" },
            { name: "Analog Electronics I", code: "EEE111 + CL", credits: 4, prerequisites: "EEE141" },
            { name: "Computer Organization and Architecture", code: "CSE332", credits: 3, prerequisites: "CSE231" },
            { name: "Introduction to Political Science/Governance", code: "POL101/POL104", credits: 3 }
          ]
        },
        {
          name: "8th Semester",
          year: 4,
          season: "Spring",
          courses: [
            { name: "Database Systems", code: "CSE311 + IL", credits: 3, prerequisites: "CSE225" },
            { name: "Operating Systems Design", code: "CSE323", credits: 3, prerequisites: "CSE332" },
            { name: "Design and Analysis of Algorithms", code: "CSE373", credits: 3, prerequisites: "CSE225 and MAT361" },
            { name: "Introduction to Microeconomics/Macroeconomics", code: "ECO101/ECO104", credits: 3 }
          ]
        },
        {
          name: "9th Semester",
          year: 5,
          season: "Autumn",
          courses: [
            { name: "Biology I", code: "BIO103+CL", credits: 4 },
            { name: "Software Engineering", code: "CSE327", credits: 3, prerequisites: "CSE311" },
            { name: "Microprocessor Interfacing and Embedded System + IL", code: "CSE331", credits: 3, prerequisites: "CSE323" }
          ]
        },
        {
          name: "10th Semester", 
          year: 5,
          season: "Spring",
          courses: [
            { name: "Introduction to Sociology/Anthropology/Bangladesh Geography", code: "SOC101/ANT101/ENV203(GEO205)", credits: 3 },
            { name: "Concepts of Programming Language", code: "CSE425", credits: 3, prerequisites: "CSE327" },
            { name: "Engineering Economics", code: "EEE452", credits: 3 }
          ]
        },
        {
          name: "11th Semester",
          year: 6,
          season: "Autumn",
          courses: [
            { name: "ELECT1", code: "ELECT1", credits: 3 },
            { name: "ELECT2", code: "ELECT2", credits: 3 },
            { name: "Senior Design I", code: "CSE499A", credits: 1.5, prerequisites: "100 credits completed" }
          ]
        },
        {
          name: "12th Semester",
          year: 6, 
          season: "Spring",
          courses: [
            { name: "ELECT3", code: "ELECT3", credits: 3 },
            { name: "OPEN ELECT", code: "OPEN ELECT", credits: 3 },
            { name: "Senior Design II", code: "CSE499B", credits: 1.5, prerequisites: "CSE499A" }
          ]
        }
      ]
    };

    await this.createOfficialTemplate(bscseTemplate);
  }

  /**
   * Seed NSU (North South University) template - 130 credits, 4 years, 12 semesters
   */
  static async seedNSUTemplate(): Promise<void> {
    const nsuTemplate: UniversityTemplateData = {
      name: "Bachelor of Science in Computer Science and Engineering - NSU",
      description: "A comprehensive 4-year undergraduate program from North South University with 130 credits spread across 12 semesters (3 semesters per year). Covers core computer science subjects, mathematics, engineering fundamentals, and specialized electives.",
      university: "North South University",
      major: "Computer Science and Engineering",
      totalCredits: 130,
      durationYears: 4,
      tags: ["Computer Science", "Engineering", "NSU", "North South University", "Bangladesh", "130 Credits"],
      semesters: [
        {
          name: "1st Semester",
          year: 1,
          season: "Spring",
          courses: [
            { name: "English", code: "ENG102", credits: 3 },
            { name: "Business", code: "BUS112", credits: 3 },
            { name: "Mathematics", code: "MIS107", credits: 3 }
          ]
        },
        {
          name: "2nd Semester", 
          year: 1,
          season: "Summer",
          courses: [
            { name: "Economics", code: "ECO101", credits: 3 },
            { name: "English", code: "ENG103", credits: 3, prerequisites: "ENG102" },
            { name: "Humanities", code: "Humanities-1", credits: 3 },
            { name: "Social Science", code: "Social Science-1", credits: 3 }
          ]
        },
        {
          name: "3rd Semester",
          year: 1,
          season: "Autumn",
          courses: [
            { name: "Business", code: "BUS172", credits: 3 },
            { name: "Economics", code: "ECO104", credits: 3, prerequisites: "ECO101" },
            { name: "English", code: "ENG105", credits: 3, prerequisites: "ENG103" },
            { name: "Humanities", code: "Humanities-2", credits: 3 }
          ]
        },
        {
          name: "4th Semester",
          year: 2,
          season: "Spring",
          courses: [
            { name: "Accounting", code: "ACT201", credits: 3 },
            { name: "Business/Engineering/Chemistry", code: "BEN205/ENG115/CHN101", credits: 3 },
            { name: "Marketing", code: "MKT202", credits: 3 },
            { name: "Business", code: "BUS173", credits: 3 }
          ]
        },
        {
          name: "5th Semester",
          year: 2,
          season: "Summer",
          courses: [
            { name: "Accounting", code: "ACT202", credits: 3, prerequisites: "ACT201" },
            { name: "Finance", code: "FIN254", credits: 3 },
            { name: "Marketing", code: "MGT212", credits: 3 },
            { name: "Science", code: "Science-1", credits: 3 }
          ]
        },
        {
          name: "6th Semester",
          year: 2,
          season: "Autumn",
          courses: [
            { name: "Business", code: "BUS251", credits: 3 },
            { name: "Business", code: "BUS135", credits: 3 },
            { name: "International Business", code: "IUB372", credits: 3 },
            { name: "Science", code: "Science-2", credits: 3 }
          ]
        },
        {
          name: "7th Semester",
          year: 3,
          season: "Spring",
          courses: [
            { name: "Major", code: "Major-1", credits: 3 },
            { name: "Management", code: "MGT314", credits: 3 },
            { name: "Management Information Systems", code: "MIS207", credits: 3 },
            { name: "Science", code: "Science-3", credits: 3 }
          ]
        },
        {
          name: "8th Semester",
          year: 3,
          season: "Summer",
          courses: [
            { name: "Major", code: "Major-2", credits: 3, prerequisites: "Major-1" },
            { name: "Free Elective", code: "Free Elective-1", credits: 3 },
            { name: "Law", code: "LAW200", credits: 3 },
            { name: "Management", code: "MGT351", credits: 3 }
          ]
        },
        {
          name: "9th Semester",
          year: 3,
          season: "Autumn",
          courses: [
            { name: "Major", code: "Major-3", credits: 3, prerequisites: "Major-2" },
            { name: "Free Elective", code: "Free Elective-2", credits: 3 },
            { name: "Management", code: "MGT368", credits: 3 },
            { name: "Science", code: "Science-3", credits: 3 }
          ]
        },
        {
          name: "10th Semester",
          year: 4,
          season: "Spring",
          courses: [
            { name: "Major", code: "Major-4", credits: 3, prerequisites: "Major-3" },
            { name: "Major Elective", code: "Major Elective-1", credits: 3 },
            { name: "Free Elective", code: "Free Elective-2", credits: 3 },
            { name: "Humanities", code: "Humanities-3", credits: 3 }
          ]
        },
        {
          name: "11th Semester",
          year: 4,
          season: "Summer",
          courses: [
            { name: "Social Science", code: "Social Science-2", credits: 3 },
            { name: "Major Elective", code: "Major Elective-2", credits: 3 },
            { name: "General Education Elective", code: "GED Elective", credits: 3 },
            { name: "Management", code: "MGT489", credits: 3 }
          ]
        },
        {
          name: "12th Semester",
          year: 4,
          season: "Autumn",
          courses: [
            { name: "Business", code: "BUS498", credits: 3 }
          ]
        }
      ]
    };

    await this.createOfficialTemplate(nsuTemplate);
  }
}