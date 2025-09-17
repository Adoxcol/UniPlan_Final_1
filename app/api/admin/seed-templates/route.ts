import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create a Supabase client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Regular Supabase client for auth verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// BSCSE Template Data
const bscseTemplate = {
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
        { name: "Calculus I", code: "MAT120", credits: 3, prerequisites: "MAT116/Waiver" },
        { name: "Physics I", code: "PHY111+CL", credits: 4 },
        { name: "Programming Language II", code: "CSE215+CL", credits: 4, prerequisites: "CSE115" }
      ]
    },
    {
      name: "3rd Semester",
      year: 2,
      season: "Autumn",
      courses: [
        { name: "Calculus II", code: "MAT125", credits: 3, prerequisites: "MAT120" },
        { name: "Physics II", code: "PHY112+CL", credits: 4, prerequisites: "PHY111" },
        { name: "Data Structures", code: "CSE225+CL", credits: 4, prerequisites: "CSE215" },
        { name: "Digital Logic Design", code: "CSE260+CL", credits: 4 }
      ]
    },
    {
      name: "4th Semester",
      year: 2,
      season: "Spring",
      courses: [
        { name: "Calculus III", code: "MAT126", credits: 3, prerequisites: "MAT125" },
        { name: "Chemistry", code: "CHE101+CL", credits: 4 },
        { name: "Algorithms", code: "CSE321", credits: 3, prerequisites: "CSE225" },
        { name: "Computer Organization and Architecture", code: "CSE323", credits: 3, prerequisites: "CSE260" }
      ]
    }
  ]
};

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting template seeding API...');

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ No authorization header provided');
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('❌ Invalid token or user not found');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log(`✅ Authenticated user: ${user.email}`);

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, admin_level')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      console.log('❌ User is not an admin');
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    console.log(`✅ Admin permissions verified (level: ${profile.admin_level})`);

    // Check if template already exists
    const { data: existingTemplate } = await supabaseAdmin
      .from('degree_templates')
      .select('id, name')
      .eq('name', bscseTemplate.name)
      .eq('is_official', true)
      .single();

    if (existingTemplate) {
      console.log(`⚠️ Template "${bscseTemplate.name}" already exists`);
      return NextResponse.json({ 
        message: 'Template already exists',
        templateId: existingTemplate.id,
        templateName: existingTemplate.name
      });
    }

    console.log('📚 Creating new BSCSE template...');

    // Create the degree template
    const degreeTemplateData = {
      name: bscseTemplate.name,
      description: bscseTemplate.description,
      university: bscseTemplate.university,
      major: bscseTemplate.major,
      total_credits: bscseTemplate.totalCredits,
      duration_years: bscseTemplate.durationYears,
      tags: bscseTemplate.tags,
      is_public: true,
      is_official: true,
      user_id: user.id,
    };

    const { data: templateResult, error: templateError } = await supabaseAdmin
      .from('degree_templates')
      .insert([degreeTemplateData])
      .select('id, name')
      .single();

    if (templateError) {
      console.error('❌ Failed to create template:', templateError);
      throw new Error(`Failed to create template: ${templateError.message}`);
    }

    const templateId = templateResult.id;
    console.log(`✅ Template created successfully (ID: ${templateId})`);

    let totalSemesters = 0;
    let totalCourses = 0;

    // Create semesters and courses
    for (const semester of bscseTemplate.semesters) {
      console.log(`📅 Creating semester: ${semester.name}`);

      // Insert semester
      const semesterData = {
        degree_template_id: templateId,
        name: semester.name,
        year: semester.year,
        season: semester.season || 'Autumn',
        notes: null
      };

      const { data: semesterResult, error: semesterError } = await supabaseAdmin
        .from('degree_template_semesters')
        .insert([semesterData])
        .select('id')
        .single();

      if (semesterError) {
        console.error(`❌ Failed to create semester ${semester.name}:`, semesterError);
        throw new Error(`Failed to create semester: ${semesterError.message}`);
      }

      const semesterId = semesterResult.id;
      totalSemesters++;
      console.log(`✅ Semester created (ID: ${semesterId})`);

      // Insert courses for this semester
      const coursesData = semester.courses.map(course => ({
        degree_template_semester_id: semesterId,
        name: course.name,
        course_code: course.code,
        credits: course.credits,
        prerequisites: course.prerequisites || null,
        description: null,
        is_required: true
      }));

      const { data: coursesResult, error: coursesError } = await supabaseAdmin
        .from('degree_template_courses')
        .insert(coursesData)
        .select('id');

      if (coursesError) {
        console.error(`❌ Failed to create courses for ${semester.name}:`, coursesError);
        throw new Error(`Failed to create courses: ${coursesError.message}`);
      }

      totalCourses += coursesResult.length;
      console.log(`✅ Created ${coursesResult.length} courses for ${semester.name}`);
    }

    console.log('🎉 Template seeding completed successfully!');
    console.log(`📊 Summary: Created 1 template, ${totalSemesters} semesters, ${totalCourses} courses`);

    return NextResponse.json({
      success: true,
      message: 'Template seeded successfully!',
      templateId: templateId,
      templateName: templateResult.name,
      stats: {
        templates: 1,
        semesters: totalSemesters,
        courses: totalCourses
      }
    });

  } catch (error) {
    console.error('❌ Template seeding error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to seed templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}