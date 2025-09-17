import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedNSUMicrobiologyTemplate() {
  try {
    console.log('🧬 Starting NSU BS in Microbiology template seeding...');

    // Get the first admin user to assign as template creator
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('admin_level', 'admin')
      .limit(1)
      .single();

    if (adminError || !adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      return;
    }

    // Template metadata
    const templateData = {
      user_id: adminUser.user_id,
      name: 'Bachelor of Science in Microbiology',
      university: 'North South University',
      major: 'Microbiology',
      total_credits: 130,
      duration_years: 4,
      description: 'Comprehensive 4-year BS in Microbiology program with 12 semesters covering fundamental to advanced microbiology concepts, laboratory techniques, and research methodologies.',
      is_public: true,
      is_official: true,
      tags: ['microbiology', 'biology', 'science', 'nsu', 'bachelor']
    };

    // Insert template
    const { data: template, error: templateError } = await supabase
      .from('degree_templates')
      .insert(templateData)
      .select()
      .single();

    if (templateError) {
      console.error('Error creating template:', templateError);
      return;
    }

    console.log('✅ Template created:', template.id);

    // Define all semesters with courses
    const semesters = [
      // YEAR 1
      {
        name: 'Semester 1',
        year: 1,
        semester_number: 1,
        total_credits: 9,
        courses: [
          { code: 'ENG102', name: 'English', credits: 3, category: 'University GED', type: 'core' },
          { code: 'BIO103', name: 'Biology', credits: 3, category: 'School Core', type: 'core' },
          { code: 'CHE101', name: 'Chemistry', credits: 3, category: 'School Core', type: 'core' }
        ]
      },
      {
        name: 'Semester 2',
        year: 1,
        semester_number: 2,
        total_credits: 11,
        courses: [
          { code: 'ENG103', name: 'English', credits: 3, category: 'University GED', type: 'core' },
          { code: 'MAT116', name: 'Mathematics', credits: 3, category: 'University GED', type: 'core' },
          { code: 'BEN205', name: 'Bangladesh Studies', credits: 2, category: 'University GED', type: 'core' },
          { code: 'BIO103L', name: 'Biology Lab', credits: 2, category: 'School Core', type: 'lab' },
          { code: 'CHE101L', name: 'Chemistry Lab', credits: 1, category: 'School Core', type: 'lab' }
        ]
      },
      {
        name: 'Semester 3',
        year: 1,
        semester_number: 3,
        total_credits: 12,
        courses: [
          { code: 'BIO201', name: 'Advanced Biology', credits: 3, category: 'School Core', type: 'core' },
          { code: 'CHE201', name: 'Organic Chemistry', credits: 3, category: 'School Core', type: 'core' },
          { code: 'MIS107', name: 'Computer Applications', credits: 3, category: 'University GED', type: 'core' },
          { code: 'POL101', name: 'Social Science', credits: 3, category: 'University GED', type: 'core' }
        ]
      },

      // YEAR 2
      {
        name: 'Semester 4',
        year: 2,
        semester_number: 4,
        total_credits: 11,
        courses: [
          { code: 'MIC201', name: 'Introduction to Microbiology', credits: 3, category: 'Elective/Free Elective', type: 'elective' },
          { code: 'MIC202', name: 'General Microbiology', credits: 3, category: 'Major Required', type: 'major' },
          { code: 'BIO201L', name: 'Advanced Biology Lab', credits: 2, category: 'School Core', type: 'lab' },
          { code: 'BIO202L', name: 'Molecular Biology Lab', credits: 1, category: 'School Core', type: 'lab' },
          { code: 'CHE202', name: 'Advanced Chemistry', credits: 2, category: 'School Core', type: 'core' }
        ]
      },
      {
        name: 'Semester 5',
        year: 2,
        semester_number: 5,
        total_credits: 10,
        courses: [
          { code: 'MIC203', name: 'Bacterial Physiology', credits: 3, category: 'Major Required', type: 'major' },
          { code: 'MIC307', name: 'Virology', credits: 3, category: 'Major Required', type: 'major' },
          { code: 'CHE202L', name: 'Advanced Chemistry Lab', credits: 2, category: 'School Core', type: 'lab' },
          { code: 'BUS172', name: 'Business Fundamentals', credits: 2, category: 'University GED', type: 'core' }
        ]
      },
      {
        name: 'Semester 6',
        year: 2,
        semester_number: 6,
        total_credits: 12,
        courses: [
          { code: 'MIC309', name: 'Medical Microbiology', credits: 3, category: 'Elective/Free Elective', type: 'elective' },
          { code: 'MIC314', name: 'Immunology', credits: 3, category: 'Major Required', type: 'major' },
          { code: 'MIC315', name: 'Microbial Genetics', credits: 3, category: 'Major Required', type: 'major' },
          { code: 'BBT203', name: 'Biotechnology Fundamentals', credits: 3, category: 'Major Required', type: 'major' }
        ]
      },

      // YEAR 3
      {
        name: 'Semester 7',
        year: 3,
        semester_number: 7,
        total_credits: 10,
        courses: [
          { code: 'MIC207', name: 'Environmental Microbiology', credits: 3, category: 'Major Required', type: 'major' },
          { code: 'MIC316', name: 'Molecular Microbiology', credits: 3, category: 'Major Required', type: 'major' },
          { code: 'MIC318', name: 'Food Microbiology', credits: 3, category: 'Elective/Free Elective', type: 'elective' },
          { code: 'MIC315L', name: 'Microbial Genetics Lab', credits: 1, category: 'Major Required', type: 'lab' }
        ]
      },
      {
        name: 'Semester 8',
        year: 3,
        semester_number: 8,
        total_credits: 10,
        courses: [
          { code: 'MIC206', name: 'Mycology', credits: 3, category: 'Major Required', type: 'major' },
          { code: 'MIC311', name: 'Industrial Microbiology', credits: 3, category: 'Elective/Free Elective', type: 'elective' },
          { code: 'MIC317', name: 'Parasitology', credits: 3, category: 'Major Required', type: 'major' },
          { code: 'MIC316L', name: 'Molecular Microbiology Lab', credits: 1, category: 'Major Required', type: 'lab' }
        ]
      },
      {
        name: 'Semester 9',
        year: 3,
        semester_number: 9,
        total_credits: 10,
        courses: [
          { code: 'MIC401', name: 'Advanced Microbiology', credits: 3, category: 'Major Required', type: 'major' },
          { code: 'MIC412', name: 'Microbial Pathogenesis', credits: 3, category: 'Major Required', type: 'major' },
          { code: 'MIC413', name: 'Clinical Microbiology', credits: 3, category: 'Major Required', type: 'major' },
          { code: 'MIC317L', name: 'Parasitology Lab', credits: 1, category: 'Major Required', type: 'lab' }
        ]
      },

      // YEAR 4
      {
        name: 'Semester 10',
        year: 4,
        semester_number: 10,
        total_credits: 10,
        courses: [
          { code: 'MIC414', name: 'Antimicrobial Agents', credits: 3, category: 'Major Required', type: 'major' },
          { code: 'MIC415', name: 'Microbial Ecology', credits: 3, category: 'Major Required', type: 'major' },
          { code: 'HIS103', name: 'History', credits: 3, category: 'University GED', type: 'core' },
          { code: 'MIC413L', name: 'Clinical Microbiology Lab', credits: 1, category: 'Major Required', type: 'lab' }
        ]
      },
      {
        name: 'Semester 11',
        year: 4,
        semester_number: 11,
        total_credits: 8,
        courses: [
          { code: 'MIC404', name: 'Public Health Microbiology', credits: 3, category: 'Elective/Free Elective', type: 'elective' },
          { code: 'MIC416', name: 'Microbial Biotechnology', credits: 3, category: 'Elective/Free Elective', type: 'elective' },
          { code: 'MIC414L', name: 'Antimicrobial Agents Lab', credits: 1, category: 'Major Required', type: 'lab' },
          { code: 'MIC415L', name: 'Microbial Ecology Lab', credits: 1, category: 'Major Required', type: 'lab' }
        ]
      },
      {
        name: 'Semester 12',
        year: 4,
        semester_number: 12,
        total_credits: 7,
        courses: [
          { code: 'MIC498', name: 'Research Project/Thesis', credits: 4, category: 'Major Required', type: 'capstone' },
          { code: 'ELEC400', name: 'Additional Elective Course', credits: 3, category: 'Elective/Free Elective', type: 'elective' }
        ]
      }
    ];

    // Insert semesters and courses
    for (const semesterData of semesters) {
      console.log(`📚 Creating ${semesterData.name}...`);

      const { data: semester, error: semesterError } = await supabase
        .from('degree_template_semesters')
        .insert({
          degree_template_id: template.id,
          name: semesterData.name,
          year: semesterData.year,
          season: 'Spring', // Default season, can be adjusted
          notes: `${semesterData.total_credits} credits total`
        })
        .select()
        .single();

      if (semesterError) {
        console.error(`Error creating ${semesterData.name}:`, semesterError);
        continue;
      }

      // Insert courses for this semester
      const coursesToInsert = semesterData.courses.map(course => ({
        degree_template_semester_id: semester.id,
        course_code: course.code,
        name: course.name,
        credits: course.credits,
        prerequisites: null,
        description: `${course.name} - ${course.category} course for BS in Microbiology program`,
        is_required: course.type === 'major' || course.type === 'core'
      }));

      const { error: coursesError } = await supabase
        .from('degree_template_courses')
        .insert(coursesToInsert);

      if (coursesError) {
        console.error(`Error creating courses for ${semesterData.name}:`, coursesError);
      } else {
        console.log(`✅ Added ${semesterData.courses.length} courses to ${semesterData.name}`);
      }
    }

    console.log('🎉 NSU BS in Microbiology template seeded successfully!');
    console.log(`📋 Template ID: ${template.id}`);
    console.log(`🎓 Program: ${templateData.name}`);
    console.log(`🏫 University: ${templateData.university}`);
    console.log(`⏱️ Duration: ${templateData.duration_years} Years (12 Semesters)`);
    console.log(`📊 Total Credits: ${templateData.total_credits}`);
    console.log(`🔗 Access URL: http://localhost:3001/templates/${template.id}`);

  } catch (error) {
    console.error('❌ Error seeding template:', error);
  }
}

// Run the seeding function
seedNSUMicrobiologyTemplate();