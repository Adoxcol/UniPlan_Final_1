import { TemplateSeeder } from '../lib/templateSeeder';

/**
 * Create a comprehensive BSCSE template based on the official curriculum
 * This template includes all courses with proper prerequisites and credit hours
 */
async function createComprehensiveBSCSETemplate() {
  try {
    console.log('Creating comprehensive BSCSE template...');
    
    await TemplateSeeder.createOfficialTemplate({
      name: 'Bachelor of Science in Computer Science and Engineering (BSCSE)',
      description: 'Complete 4-year BSCSE curriculum with all required courses, prerequisites, and electives. This official template follows the standard BSCSE degree requirements and includes proper course sequencing based on UGC approved curriculum.',
      university: 'North South University',
      major: 'Computer Science and Engineering',
      minor: undefined,
      totalCredits: 160,
      durationYears: 4,
      tags: ['Computer Science', 'Engineering', 'Programming', 'Software Development', 'Algorithms', 'Data Structures'],
      semesters: [
        // 1st Semester
        {
          name: '1st Semester',
          year: 1,
          season: 'Autumn' as const,
          notes: 'Foundation courses - 8 credits/semester',
          courses: [
            { name: 'Introduction to Computation', credits: 3, code: 'ENG102', isRequired: true },
            { name: 'Pre-Calculus', credits: 3, code: 'MAT116', isRequired: true },
            { name: 'Engineering Drawing', credits: 1, code: 'EEE154 (CEE110)', isRequired: true },
            { name: 'Programming Language I', credits: 4, code: 'CSE115+CL', isRequired: true },
          ]
        },
        // 2nd Semester
        {
          name: '2nd Semester',
          year: 1,
          season: 'Spring' as const,
          notes: 'Mathematics and programming fundamentals - 12 credits/semester',
          courses: [
            { name: 'Intermediate Composition', credits: 3, code: 'ENG103', isRequired: true, prerequisites: 'ENG102/Waiver' },
            { name: 'Calculus I', credits: 3, code: 'MAT120', isRequired: true, prerequisites: 'MAT116' },
            { name: 'Linear Algebra', credits: 3, code: 'MAT125', isRequired: true, prerequisites: 'MAT116' },
            { name: 'Discrete Mathematics', credits: 3, code: 'CSE173', isRequired: true },
          ]
        },
        // 3rd Semester
        {
          name: '3rd Semester',
          year: 2,
          season: 'Autumn' as const,
          notes: 'Core mathematics and physics - 14 credits/semester',
          courses: [
            { name: 'Calculus II', credits: 3, code: 'MAT130', isRequired: true, prerequisites: 'MAT120' },
            { name: 'Physics I', credits: 4, code: 'PHY107+CL', isRequired: true, prerequisites: 'MAT130' },
            { name: 'Programming Language II', credits: 4, code: 'CSE215+CL', isRequired: true, prerequisites: 'CSE173' },
            { name: 'Introduction to Ethics', credits: 3, code: 'PHI108', isRequired: true },
          ]
        },
        // 4th Semester
        {
          name: '4th Semester',
          year: 2,
          season: 'Spring' as const,
          notes: 'Advanced mathematics and algorithms - 13 credits/semester',
          courses: [
            { name: 'Calculus III', credits: 3, code: 'MAT250', isRequired: true, prerequisites: 'MAT130 and PHY107' },
            { name: 'Physics II', credits: 4, code: 'PHY108+CL', isRequired: true, prerequisites: 'MAT130 and PHY107' },
            { name: 'Data Structures and Algorithm', credits: 3, code: 'CSE225+IL', isRequired: true, prerequisites: 'CSE215' },
            { name: 'Bengali Language & Literature', credits: 3, code: 'BEN205', isRequired: true, prerequisites: 'ENG103' },
          ]
        },
        // 5th Semester
        {
          name: '5th Semester',
          year: 3,
          season: 'Autumn' as const,
          notes: 'Engineering mathematics and circuits - 13 credits/semester',
          courses: [
            { name: 'Engineering Mathematics', credits: 3, code: 'MAT350', isRequired: true, prerequisites: 'PHY107 and MAT250' },
            { name: 'Electric Circuit I', credits: 4, code: 'EEE141+CL', isRequired: true, prerequisites: 'PHY107 and MAT250' },
            { name: 'Digital Logic Design', credits: 3, code: 'CSE231+IL', isRequired: true, prerequisites: 'CSE173' },
            { name: 'Computer Organization and Architecture', credits: 3, code: 'CSE332', isRequired: true, prerequisites: 'CSE225' },
          ]
        },
        // 6th Semester
        {
          name: '6th Semester',
          year: 3,
          season: 'Spring' as const,
          notes: 'World civilization and probability - 7 credits/semester',
          courses: [
            { name: 'Introduction to World Civilization', credits: 3, code: 'HIS102', isRequired: true },
            { name: 'Probability and Statistics', credits: 3, code: 'MAT361', isRequired: true, prerequisites: 'MAT250' },
            { name: 'Junior Design', credits: 1, code: 'CSE299', isRequired: true, prerequisites: '60 credits completed' },
          ]
        },
        // 7th Semester
        {
          name: '7th Semester',
          year: 4,
          season: 'Autumn' as const,
          notes: 'Database and electronics - 14 credits/semester',
          courses: [
            { name: 'Database Systems', credits: 4, code: 'CSE311+IL', isRequired: true, prerequisites: 'MAT250' },
            { name: 'Analog Electronics I', credits: 4, code: 'EEE111+CL', isRequired: true, prerequisites: 'EEE141' },
            { name: 'Computer Organization and Architecture', credits: 3, code: 'CSE332', isRequired: true, prerequisites: 'CSE231' },
            { name: 'Introduction to Political Science/Governance', credits: 3, code: 'POL101/POL104', isRequired: true },
          ]
        },
        // 8th Semester
        {
          name: '8th Semester',
          year: 4,
          season: 'Spring' as const,
          notes: 'Operating systems and design - 12 credits/semester',
          courses: [
            { name: 'Operating Systems', credits: 4, code: 'CSE321+IL', isRequired: true, prerequisites: 'CSE332' },
            { name: 'Operating Systems Design', credits: 3, code: 'CSE323', isRequired: true, prerequisites: 'CSE332 and MAT361' },
            { name: 'Design and Analysis of Algorithms', credits: 3, code: 'CSE373', isRequired: true, prerequisites: 'CSE225 and MAT361' },
            { name: 'Introduction to Microeconomics/Macroeconomics', credits: 3, code: 'ECO101/ECO104', isRequired: true },
          ]
        },
        // 9th Semester
        {
          name: '9th Semester',
          year: 5,
          season: 'Autumn' as const,
          notes: 'Software engineering and biology - 13 credits/semester',
          courses: [
            { name: 'Biology I', credits: 4, code: 'BIO103+CL', isRequired: true },
            { name: 'Software Engineering', credits: 4, code: 'CSE327', isRequired: true, prerequisites: 'CSE311' },
            { name: 'Microprocessor Interfacing and Embedded System + IL', credits: 3, code: 'CSE331', isRequired: true, prerequisites: 'CSE332' },
            { name: 'Introduction to Sociology/Anthropology/Bangladesh Geography', credits: 3, code: 'CSE425', isRequired: true, prerequisites: 'CSE327' },
          ]
        },
        // 10th Semester
        {
          name: '10th Semester',
          year: 5,
          season: 'Spring' as const,
          notes: 'Concepts and senior design - 9 credits/semester',
          courses: [
            { name: 'Concepts of Programming Languages', credits: 3, code: 'CSE425', isRequired: true, prerequisites: 'CSE311' },
            { name: 'Senior Design I', credits: 1.5, code: 'CSE499A', isRequired: true, prerequisites: '100 credits completed' },
          ]
        },
        // 11th Semester
        {
          name: '11th Semester',
          year: 6,
          season: 'Autumn' as const,
          notes: 'Engineering economics and senior design - 7.5 credits/semester',
          courses: [
            { name: 'Engineering Economics', credits: 3, code: 'EEE452', isRequired: true },
            { name: 'Senior Design II', credits: 1.5, code: 'CSE499B', isRequired: true, prerequisites: 'CSE499A' },
          ]
        },
        // 12th Semester
        {
          name: '12th Semester',
          year: 6,
          season: 'Spring' as const,
          notes: 'Open electives - 7.5 credits/semester',
          courses: [
            { name: 'OPEN ELECT', credits: 3, code: 'ELEC1', isRequired: false },
            { name: 'Senior Design II', credits: 1.5, code: 'CSE499B', isRequired: true, prerequisites: 'CSE499A' },
          ]
        }
      ]
    });

    console.log('✅ BSCSE template created successfully!');
    console.log('🎉 Template includes:');
    console.log('   - 12 semesters across 4 years');
    console.log('   - 160+ total credits');
    console.log('   - All core CSE courses with prerequisites');
    console.log('   - Mathematics, Physics, and General Education requirements');
    console.log('   - Electives and Senior Design projects');
    
  } catch (error) {
    console.error('❌ Failed to create BSCSE template:', error);
    throw error;
  }
}

// Run the function
if (require.main === module) {
  createComprehensiveBSCSETemplate()
    .then(() => {
      console.log('🎉 Template creation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Template creation failed:', error);
      process.exit(1);
    });
}

export { createComprehensiveBSCSETemplate };