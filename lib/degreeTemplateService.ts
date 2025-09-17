import { supabase } from './supabaseClient';
import { DegreeTemplate, DegreeTemplateSemester, DegreeTemplateCourse } from './types';

// Generate a unique ID for database records
const generateId = () => Math.random().toString(36).substr(2, 9);

export interface CreateDegreeTemplateData {
  name: string;
  description?: string;
  university?: string;
  major?: string;
  total_credits?: number;
  duration_years?: number;
  is_public?: boolean;
  is_official?: boolean;
  tags?: string[];
}

export interface DegreeTemplateWithDetails extends DegreeTemplate {
  semesters: (DegreeTemplateSemester & {
    courses: DegreeTemplateCourse[];
  })[];
  creator_profile?: {
    name?: string;
    university?: string;
    major?: string;
  };
}

export class DegreeTemplateService {
  /**
   * Create a new degree template from current semester data
   */
  static async createTemplate(
    templateData: CreateDegreeTemplateData,
    semesters: any[]
  ): Promise<DegreeTemplate> {
    if (!supabase) throw new Error('Supabase client not configured');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    // Validate and filter semesters
    const validSemesters = semesters.filter(semester => 
      semester && 
      semester.name && 
      semester.season && 
      typeof semester.year === 'number' && 
      semester.year >= 2020 && 
      semester.year <= 2030
    );

    if (validSemesters.length === 0) {
      throw new Error('No valid semesters found to create template');
    }

    // Create the main template (let database generate ID)
    const { data: template, error: templateError } = await supabase
      .from('degree_templates')
      .insert({
        user_id: user.id,
        name: templateData.name,
        description: templateData.description,
        university: templateData.university,
        major: templateData.major,
        total_credits: templateData.total_credits,
        duration_years: templateData.duration_years,
        is_public: templateData.is_public || false,
        is_official: templateData.is_official || false,
        tags: templateData.tags || [],
        download_count: 0
      })
      .select()
      .single();

    if (templateError) throw templateError;

    // Create template semesters and courses
    // Convert calendar years to relative academic years (1, 2, 3, 4, etc.)
    const sortedSemesters = [...validSemesters].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      // Sort by season within the same year (Autumn < Spring < Summer)
      const seasonOrder = { 'Autumn': 0, 'Spring': 1, 'Summer': 2 };
      return (seasonOrder[a.season as keyof typeof seasonOrder] || 0) - 
             (seasonOrder[b.season as keyof typeof seasonOrder] || 0);
    });
    
    // Group semesters by calendar year to assign relative academic years
    const yearGroups = new Map<number, number>();
    let currentRelativeYear = 1;
    
    // First pass: assign relative years to each calendar year
    sortedSemesters.forEach(semester => {
      const calendarYear = semester.year;
      if (!yearGroups.has(calendarYear)) {
        yearGroups.set(calendarYear, currentRelativeYear);
        currentRelativeYear++;
      }
    });
    
    for (let i = 0; i < sortedSemesters.length; i++) {
      const semester = sortedSemesters[i];
      
      // Get the relative year for this semester's calendar year
      const calendarYear = semester.year;
      const relativeYear = yearGroups.get(calendarYear) || 1;
      
      // Ensure year is within valid range (1-8)
      const validYear = Math.max(1, Math.min(relativeYear, 8));
      
      const { data: semesterData, error: semesterError } = await supabase
        .from('degree_template_semesters')
        .insert({
          degree_template_id: template.id,
          name: semester.name,
          season: semester.season,
          year: validYear,
          notes: semester.notes
        })
        .select()
        .single();

      if (semesterError) throw semesterError;

      // Add courses for this semester
      if (semester.courses && semester.courses.length > 0) {
        const coursesData = semester.courses.map((course: any) => ({
          degree_template_semester_id: semesterData.id,
          name: course.name,
          course_code: course.code,
          credits: course.credits,
          description: course.description,
          prerequisites: Array.isArray(course.prerequisites) ? course.prerequisites.join(', ') : course.prerequisites,
          is_required: course.is_required || false
        }));

        const { error: coursesError } = await supabase
          .from('degree_template_courses')
          .insert(coursesData);

        if (coursesError) throw coursesError;
      }
    }

    return template;
  }

  /**
   * Get all public degree templates with search and filtering
   */
  static async getPublicTemplates(options: {
    search?: string;
    university?: string;
    major?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  } = {}): Promise<DegreeTemplateWithDetails[]> {
    if (!supabase) throw new Error('Supabase client not configured');
    let query = supabase
      .from('degree_templates')
      .select(`
        *,
        semesters:degree_template_semesters(
          *,
          courses:degree_template_courses(*)
        )
      `)
      .eq('is_public', true)
      .order('download_count', { ascending: false });

    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    if (options.university) {
      query = query.eq('university', options.university);
    }

    if (options.major) {
      query = query.eq('major', options.major);
    }

    if (options.tags && options.tags.length > 0) {
      query = query.overlaps('tags', options.tags);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Fetch creator profiles separately
    if (data && data.length > 0) {
      const userIds = Array.from(new Set(data.map(template => template.user_id)));
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, university, major')
        .in('user_id', userIds);

      if (profileError) {
        console.error('Error fetching creator profiles:', profileError);
        // Continue without profiles rather than failing completely
      } else {
        // Map profiles to templates
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        data.forEach(template => {
          (template as any).creator_profile = profileMap.get(template.user_id) || null;
        });
      }
    }

    return data || [];
  }

  /**
   * Get user's own degree templates
   */
  static async getUserTemplates(): Promise<DegreeTemplateWithDetails[]> {
    if (!supabase) throw new Error('Supabase client not configured');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('degree_templates')
      .select(`
        *,
        semesters:degree_template_semesters(
          *,
          courses:degree_template_courses(*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a specific degree template by ID
   */
  static async getTemplate(templateId: string): Promise<DegreeTemplateWithDetails | null> {
    if (!supabase) throw new Error('Supabase client not configured');
    const { data, error } = await supabase
      .from('degree_templates')
      .select(`
        *,
        semesters:degree_template_semesters(
          *,
          courses:degree_template_courses(*)
        )
      `)
      .eq('id', templateId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    // Fetch creator profile separately
    if (data) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, university, major')
        .eq('user_id', data.user_id)
        .single();

      if (!profileError && profile) {
        (data as any).creator_profile = profile;
      }
    }

    return data;
  }

  /**
   * Delete all degree plan data for the current user
   */
  static async deleteAllPlanData(): Promise<void> {
    if (!supabase) throw new Error('Supabase client not configured');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    console.log('Deleting all degree plan data...');
    
    // First delete all courses (due to foreign key constraints)
    const { error: coursesDeleteError } = await supabase
      .from('courses')
      .delete()
      .eq('user_id', user.id);
    
    if (coursesDeleteError) {
      console.error('Error deleting courses:', coursesDeleteError);
      throw new Error('Failed to delete courses. Please try again.');
    }
    
    // Then delete all semesters
    const { error: semestersDeleteError } = await supabase
      .from('semesters')
      .delete()
      .eq('user_id', user.id);
    
    if (semestersDeleteError) {
      console.error('Error deleting semesters:', semestersDeleteError);
      throw new Error('Failed to delete semesters. Please try again.');
    }
    
    // Clear degree information from profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        degree_name: null,
        degree_total_credits: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
    
    if (profileError) {
      console.warn('Warning: Could not clear degree info from profile:', profileError);
    }
    
    console.log('Successfully deleted all degree plan data');
  }

  /**
   * Apply a degree template to user's current plan
   */
  static async applyTemplate(templateId: string, options: { override?: boolean } = { override: true }): Promise<void> {
    if (!supabase) throw new Error('Supabase client not configured');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const template = await this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    // Increment view count (tracking template usage)
    await supabase
      .from('degree_templates')
      .update({ view_count: template.view_count + 1 })
      .eq('id', templateId);

    // Set up degree information from template
    await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        degree_name: template.name,
        degree_total_credits: template.total_credits,
        updated_at: new Date().toISOString()
      });

    // Clear existing data if override is enabled (default behavior)
    if (options.override) {
      console.log('Clearing existing semesters and courses...');
      
      // First delete all courses (due to foreign key constraints)
      const { error: coursesDeleteError } = await supabase
        .from('courses')
        .delete()
        .eq('user_id', user.id);
      
      if (coursesDeleteError) {
        console.error('Error deleting courses:', coursesDeleteError);
        throw new Error('Failed to clear existing courses. Please try again.');
      }
      
      // Then delete all semesters
      const { error: semestersDeleteError } = await supabase
        .from('semesters')
        .delete()
        .eq('user_id', user.id);
      
      if (semestersDeleteError) {
        console.error('Error deleting semesters:', semestersDeleteError);
        throw new Error('Failed to clear existing semesters. Please try again.');
      }
      
      console.log('Successfully cleared all existing data');
    }

    // Create semesters from template
    // Convert relative academic years to calendar years
    const currentYear = new Date().getFullYear();
    const baseYear = Math.max(2020, Math.min(currentYear, 2030)); // Ensure base year is within valid range
    
    for (const templateSemester of template.semesters) {
      // Convert relative academic year (1-8) to calendar year
      // Academic year 1 starts at baseYear, year 2 at baseYear+1, etc.
      const calendarYear = baseYear + (templateSemester.year - 1);
      
      // Ensure the calculated year is within the database constraint range (2020-2030)
      const validYear = Math.max(2020, Math.min(calendarYear, 2030));
      
      let semesterData: { id: string; name: string; [key: string]: any };
      
      if (options.override) {
        // When overriding, create new semesters (existing ones should have been deleted)
        // But add a safety check in case deletion didn't work properly
        const { data: existingSemester, error: checkError } = await supabase
          .from('semesters')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('year', validYear)
          .eq('season', templateSemester.season)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected if no existing semester
          throw checkError;
        }

        if (existingSemester) {
          // This shouldn't happen in override mode, but use existing if found
          semesterData = existingSemester;
          console.log(`Warning: Found existing semester in override mode, using it: ${existingSemester.name} (${templateSemester.season} ${validYear})`);
        } else {
          // Create new semester as expected
          const semesterId = generateId();
          const { data: newSemesterData, error: semesterError } = await supabase
            .from('semesters')
            .insert({
              id: semesterId,
              user_id: user.id,
              name: templateSemester.name,
              season: templateSemester.season,
              year: validYear,
              notes: templateSemester.notes,
              is_active: false
            })
            .select()
            .single();

          if (semesterError) {
            console.error('Error creating semester:', semesterError);
            throw new Error(`Failed to create semester "${templateSemester.name}" for ${templateSemester.season} ${validYear}. This may be due to a duplicate semester.`);
          }
          semesterData = newSemesterData;
          console.log(`Created new semester: ${templateSemester.name} (${templateSemester.season} ${validYear})`);
        }
      } else {
        // When merging, check for existing semesters
        const { data: existingSemester, error: checkError } = await supabase
          .from('semesters')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('year', validYear)
          .eq('season', templateSemester.season)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected if no existing semester
          throw checkError;
        }

        if (existingSemester) {
          // Use existing semester
          semesterData = existingSemester;
          console.log(`Using existing semester: ${existingSemester.name} (${templateSemester.season} ${validYear})`);
        } else {
          // Create new semester
          const semesterId = generateId();
          const { data: newSemesterData, error: semesterError } = await supabase
            .from('semesters')
            .insert({
              id: semesterId,
              user_id: user.id,
              name: templateSemester.name,
              season: templateSemester.season,
              year: validYear,
              notes: templateSemester.notes,
              is_active: false
            })
            .select()
            .single();

          if (semesterError) throw semesterError;
          semesterData = newSemesterData;
          console.log(`Created new semester: ${templateSemester.name} (${templateSemester.season} ${validYear})`);
        }
      }

      // Add courses from template
      if (templateSemester.courses && templateSemester.courses.length > 0) {
        if (options.override) {
          // When overriding, add all courses (no existing courses to check)
          const coursesData = templateSemester.courses.map(templateCourse => ({
            id: generateId(),
            semester_id: semesterData.id,
            user_id: user.id,
            name: templateCourse.name,
            credits: templateCourse.credits,
            notes: templateCourse.description || undefined,
            color: this.getRandomCourseColor()
          }));

          const { error: coursesError } = await supabase
            .from('courses')
            .insert(coursesData);

          if (coursesError) throw coursesError;
          
          console.log(`Added ${templateSemester.courses.length} courses to semester ${semesterData.name}`);
        } else {
          // When merging, check for existing courses to avoid duplicates
          const { data: existingCourses, error: existingCoursesError } = await supabase
            .from('courses')
            .select('name')
            .eq('semester_id', semesterData.id)
            .eq('user_id', user.id);

          if (existingCoursesError) throw existingCoursesError;

          const existingCourseNames = new Set(existingCourses?.map(course => course.name.toLowerCase()) || []);
          
          // Filter out courses that already exist in the semester
          const newCourses = templateSemester.courses.filter(templateCourse => 
            !existingCourseNames.has(templateCourse.name.toLowerCase())
          );

          if (newCourses.length > 0) {
            const coursesData = newCourses.map(templateCourse => ({
              id: generateId(),
              semester_id: semesterData.id,
              user_id: user.id,
              name: templateCourse.name,
              credits: templateCourse.credits,
              notes: templateCourse.description || undefined,
              color: this.getRandomCourseColor()
            }));

            const { error: coursesError } = await supabase
              .from('courses')
              .insert(coursesData);

            if (coursesError) throw coursesError;
            
            console.log(`Added ${newCourses.length} new courses to semester ${semesterData.name}`);
          } else {
            console.log(`No new courses to add to semester ${semesterData.name} (all courses already exist)`);
          }
        }
      }
    }
  }

  /**
   * Update a degree template
   */
  static async updateTemplate(
    templateId: string,
    updates: Partial<CreateDegreeTemplateData>
  ): Promise<DegreeTemplate> {
    if (!supabase) throw new Error('Supabase client not configured');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('degree_templates')
      .update(updates)
      .eq('id', templateId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a degree template
   */
  static async deleteTemplate(templateId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not configured');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { error } = await supabase
      .from('degree_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Get popular tags for filtering
   */
  static async getPopularTags(limit: number = 20): Promise<string[]> {
    if (!supabase) throw new Error('Supabase client not configured');
    const { data, error } = await supabase
      .from('degree_templates')
      .select('tags')
      .eq('is_public', true);

    if (error) throw error;

    const tagCounts: { [key: string]: number } = {};
    
    data?.forEach(template => {
      template.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag);
  }

  /**
   * Get random course color for template application
   */
  private static getRandomCourseColor(): string {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}