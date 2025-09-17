import { supabase } from '../lib/supabaseClient';
import { TemplateSeeder } from '../lib/templateSeeder';
import { isCurrentUserAdmin, hasPermission } from '../lib/adminUtils';

async function seedOfficialTemplates() {
  try {
    console.log('🔐 Checking admin authentication...');
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No authenticated user found. Please sign in as an admin.');
      process.exit(1);
    }

    console.log(`✅ Authenticated as: ${user.email}`);

    // Check if user is admin
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      console.error('❌ Current user is not an admin. Admin access required for seeding templates.');
      process.exit(1);
    }

    // Check specific permission
    const canSeed = await hasPermission('canSeedTemplates');
    if (!canSeed) {
      console.error('❌ Insufficient permissions to seed templates.');
      process.exit(1);
    }

    console.log('✅ Admin permissions verified. Starting template seeding...');

    // Seed the BSCSE template
    await TemplateSeeder.createOfficialTemplate({
      name: 'Bachelor of Science in Computer Science and Engineering (BSCSE)',
      description: 'Complete 4-year BSCSE curriculum with all required courses, prerequisites, and electives. This official template follows the standard BSCSE degree requirements.',
      university: 'University of Engineering',
      major: 'Computer Science and Engineering',
      minor: undefined,
      totalCredits: 160,
      durationYears: 4,
      tags: ['Computer Science', 'Engineering', 'BSCSE', 'Official'],
      semesters: [
        // 1st Semester
        {
          name: '1st Semester',
          year: 1,
          season: 'Autumn' as const,
          notes: 'Foundation courses for engineering students',
          courses: [
            { name: 'Introduction to Computation', credits: 3, code: 'ENG102', isRequired: true },
            { name: 'Pre-Calculus', credits: 3, code: 'MAT116', isRequired: true },
            { name: 'Engineering Drawing', credits: 1, code: 'EEE154 (CEE110)', isRequired: true },
            { name: 'Programming Language I', credits: 4, code: 'CSE115/ECL', isRequired: true },
            { name: 'Intermediate Composition', credits: 3, code: 'ENG103', isRequired: true, prerequisites: 'ENG102/Waiver' },
          ]
        },
        // 2nd Semester
        {
          name: '2nd Semester',
          year: 1,
          season: 'Spring' as const,
          notes: 'Continuation of foundation courses',
          courses: [
            { name: 'Calculus I', credits: 3, code: 'MAT120', isRequired: true, prerequisites: 'MAT116' },
            { name: 'Linear Algebra', credits: 3, code: 'MAT250', isRequired: true, prerequisites: 'MAT116' },
            { name: 'Discrete Mathematics', credits: 3, code: 'CSE173', isRequired: true },
            { name: 'Programming Language II', credits: 4, code: 'CSE215 + CL', isRequired: true, prerequisites: 'CSE173' },
          ]
        },
        // 3rd Semester
        {
          name: '3rd Semester',
          year: 2,
          season: 'Autumn' as const,
          notes: 'Core mathematics and physics',
          courses: [
            { name: 'Calculus II', credits: 3, code: 'MAT130', isRequired: true, prerequisites: 'MAT120' },
            { name: 'Physics I', credits: 4, code: 'PHY107+CL', isRequired: true, prerequisites: 'MAT130' },
            { name: 'Introduction to Ethics', credits: 3, code: 'PHI108', isRequired: true },
            { name: 'Calculus III', credits: 3, code: 'MAT250', isRequired: true, prerequisites: 'MAT130 and PHY107' },
          ]
        },
        // 4th Semester
        {
          name: '4th Semester',
          year: 2,
          season: 'Spring' as const,
          notes: 'Advanced mathematics and algorithms',
          courses: [
            { name: 'Data Structures and Algorithms', credits: 4, code: 'CSE225', isRequired: true, prerequisites: 'ENG103' },
            { name: 'Bengali Language & Literature', credits: 3, code: 'BEN205', isRequired: true },
            { name: 'Engineering Mathematics', credits: 3, code: 'MAT350', isRequired: true, prerequisites: 'PHY107 and MAT120' },
            { name: 'Elective Circuit I', credits: 4, code: 'EEE141 + CL', isRequired: true, prerequisites: 'CSE173' },
          ]
        },
        // 5th Semester
        {
          name: '5th Semester',
          year: 3,
          season: 'Autumn' as const,
          notes: 'Digital systems and probability',
          courses: [
            { name: 'Digital Logic Design', credits: 3, code: 'CSE231 + IL', isRequired: true },
            { name: 'Introduction to World Civilization', credits: 3, code: 'HIS102', isRequired: true },
            { name: 'Probability and Statistics', credits: 3, code: 'MAT361', isRequired: true, prerequisites: 'MAT250' },
            { name: 'Junior Design', credits: 1, code: 'CSE299', isRequired: true, prerequisites: '60 credits completed' },
          ]
        },
        // 6th Semester
        {
          name: '6th Semester',
          year: 3,
          season: 'Spring' as const,
          notes: 'Computer organization and algorithms',
          courses: [
            { name: 'Computer Organization and Architecture', credits: 4, code: 'CSE332', isRequired: true, prerequisites: 'MAT250' },
            { name: 'Analog Electronics I', credits: 4, code: 'EEE111 + CL', isRequired: true, prerequisites: 'EEE141' },
            { name: 'Concepts of Programming Languages', credits: 3, code: 'CSE425', isRequired: true, prerequisites: 'CSE231' },
            { name: 'Introduction to Political Science/Governance', credits: 3, code: 'POL101/POL104', isRequired: true },
          ]
        },
        // 7th Semester
        {
          name: '7th Semester',
          year: 4,
          season: 'Autumn' as const,
          notes: 'Database systems and operating systems',
          courses: [
            { name: 'Database Systems', credits: 3, code: 'CSE311 + IL', isRequired: true, prerequisites: 'CSE332' },
            { name: 'Operating Systems Design', credits: 3, code: 'CSE321', isRequired: true, prerequisites: 'CSE225 and MAT361' },
            { name: 'Introduction to Microeconomics/Microeconomics', credits: 3, code: 'ECO101/ECO104', isRequired: true },
          ]
        },
        // 8th Semester
        {
          name: '8th Semester',
          year: 4,
          season: 'Spring' as const,
          notes: 'Software engineering and biology',
          courses: [
            { name: 'Software Engineering', credits: 4, code: 'CSE327', isRequired: true, prerequisites: 'CSE311' },
            { name: 'Microprocessor Interfacing and Embedded System + IL', credits: 3, code: 'CSE331', isRequired: true, prerequisites: 'CSE332' },
            { name: 'Biology I', credits: 4, code: 'BIO103+CL', isRequired: true },
            { name: 'Introduction to Sociology/Anthropology/Bangladesh Geography', credits: 3, code: 'CSE425', isRequired: true, prerequisites: 'CSE327' },
          ]
        },
        // 9th Semester
        {
          name: '9th Semester',
          year: 5,
          season: 'Autumn' as const,
          notes: 'Concepts and senior design',
          courses: [
            { name: 'Concepts of Programming Languages', credits: 3, code: 'CSE425', isRequired: true, prerequisites: 'CSE311' },
            { name: 'Senior Design I', credits: 1.5, code: 'CSE499A', isRequired: true, prerequisites: '100 credits completed' },
          ]
        },
        // 10th Semester
        {
          name: '10th Semester',
          year: 5,
          season: 'Spring' as const,
          notes: 'Engineering economics and senior design',
          courses: [
            { name: 'Engineering Economics', credits: 3, code: 'EEE452', isRequired: true },
            { name: 'Senior Design II', credits: 1.5, code: 'CSE499B', isRequired: true, prerequisites: 'CSE499A' },
          ]
        },
        // 11th Semester
        {
          name: '11th Semester',
          year: 6,
          season: 'Autumn' as const,
          notes: 'Open electives',
          courses: [
            { name: 'OPEN ELECT', credits: 3, code: 'ELEC1', isRequired: false },
          ]
        },
        // 12th Semester
        {
          name: '12th Semester',
          year: 6,
          season: 'Spring' as const,
          notes: 'Final electives',
          courses: [
            { name: 'OPEN ELECT', credits: 3, code: 'ELEC2', isRequired: false },
            { name: 'Senior Design II', credits: 1.5, code: 'CSE499B', isRequired: true, prerequisites: 'CSE499A' },
          ]
        },
      ]
    });

    console.log('✅ Successfully seeded official BSCSE template!');
    console.log('🎉 Template seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  }
}

// Run the seeding
seedOfficialTemplates();
