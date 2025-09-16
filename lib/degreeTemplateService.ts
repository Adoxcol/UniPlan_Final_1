import { supabase } from './supabaseClient';
import { DegreeTemplate, DegreeTemplateSemester, DegreeTemplateCourse } from './types';

export interface CreateDegreeTemplateData {
  name: string;
  description?: string;
  university?: string;
  major?: string;
  total_credits?: number;
  duration_years?: number;
  is_public?: boolean;
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

    const templateId = crypto.randomUUID();
    
    // Create the main template
    const { data: template, error: templateError } = await supabase
      .from('degree_templates')
      .insert({
        id: templateId,
        user_id: user.id,
        name: templateData.name,
        description: templateData.description,
        university: templateData.university,
        major: templateData.major,
        total_credits: templateData.total_credits,
        duration_years: templateData.duration_years,
        is_public: templateData.is_public || false,
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
      const semesterId = crypto.randomUUID();
      
      // Get the relative year for this semester's calendar year
      const calendarYear = semester.year;
      const relativeYear = yearGroups.get(calendarYear) || 1;
      
      // Ensure year is within valid range (1-8)
      const validYear = Math.max(1, Math.min(relativeYear, 8));
      
      const { error: semesterError } = await supabase
        .from('degree_template_semesters')
        .insert({
          id: semesterId,
          degree_template_id: templateId,
          name: semester.name,
          season: semester.season,
          year: validYear,
          notes: semester.notes
        });

      if (semesterError) throw semesterError;

      // Add courses for this semester
      if (semester.courses && semester.courses.length > 0) {
        const coursesData = semester.courses.map((course: any) => ({
          id: crypto.randomUUID(),
          degree_template_semester_id: semesterId,
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
   * Apply a degree template to user's current plan
   */
  static async applyTemplate(templateId: string): Promise<void> {
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

    // Clear existing semesters (optional - could be a user choice)
    await supabase
      .from('semesters')
      .delete()
      .eq('user_id', user.id);

    // Create semesters from template
    for (const templateSemester of template.semesters) {
      const semesterId = crypto.randomUUID();
      
      const { error: semesterError } = await supabase
        .from('semesters')
        .insert({
          id: semesterId,
          user_id: user.id,
          name: templateSemester.name,
          season: templateSemester.season,
          year: templateSemester.year,
          notes: templateSemester.notes,
          is_active: false
        });

      if (semesterError) throw semesterError;

      // Add courses from template
      if (templateSemester.courses && templateSemester.courses.length > 0) {
        const coursesData = templateSemester.courses.map(templateCourse => ({
          id: crypto.randomUUID(),
          semester_id: semesterId,
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