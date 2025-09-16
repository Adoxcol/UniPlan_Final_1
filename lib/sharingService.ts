import { supabase } from './supabaseClient';
import { SharedPlan, SharedPlanSemester, SharedPlanCourse, Semester, Course } from './types';
import { nanoid } from 'nanoid';

export interface CreateSharedPlanOptions {
  semesterId: string;
  title?: string;
  description?: string;
  isPublic?: boolean;
  expiresAt?: Date;
}

export interface SharedPlanWithDetails extends SharedPlan {
  semesters: (SharedPlanSemester & {
    courses: SharedPlanCourse[];
  })[];
}

export class SharingService {
  /**
   * Create a shared plan from a semester
   */
  static async createSharedPlan(
    semester: Semester,
    options: Omit<CreateSharedPlanOptions, 'semesterId'>
  ): Promise<SharedPlan> {
    if (!supabase) throw new Error('Supabase client not configured');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user allows plan sharing
    const { data: profile } = await supabase
      .from('profiles')
      .select('allow_plan_sharing')
      .eq('user_id', user.id)
      .single();

    if (!profile?.allow_plan_sharing) {
      throw new Error('Plan sharing is disabled in your privacy settings');
    }

    const shareToken = nanoid(12); // Generate a unique share token
    
    const sharedPlan: Omit<SharedPlan, 'id' | 'created_at' | 'updated_at'> = {
      user_id: user.id,
      share_token: shareToken,
      title: options.title || semester.name,
      description: options.description || `Shared plan for ${semester.name}`,
      is_public: options.isPublic || false,
      expires_at: options.expiresAt?.toISOString() || null,
      view_count: 0,
    };

    // Create the shared plan
    const { data: createdPlan, error: planError } = await supabase
      .from('shared_plans')
      .insert(sharedPlan)
      .select()
      .single();

    if (planError) throw planError;

    // Create shared semester
    const sharedSemester = {
      shared_plan_id: createdPlan.id,
      name: semester.name,
      season: semester.season,
      year: semester.year,
      notes: semester.notes || null,
    };

    const { data: createdSemester, error: semesterError } = await supabase
      .from('shared_plan_semesters')
      .insert(sharedSemester)
      .select()
      .single();

    if (semesterError) throw semesterError;

    // Create shared courses
    if (semester.courses.length > 0) {
      const sharedCourses: Omit<SharedPlanCourse, 'id'>[] = semester.courses.map(course => ({
        shared_plan_semester_id: createdSemester.id,
        name: course.name,
        credits: course.credits,
        days_of_week: course.daysOfWeek || null,
        start_time: course.startTime || null,
        end_time: course.endTime || null,
        grade: course.grade || null,
        color: course.color || null,
        notes: course.notes || null,
      }));

      const { error: coursesError } = await supabase
        .from('shared_plan_courses')
        .insert(sharedCourses);

      if (coursesError) throw coursesError;
    }

    return createdPlan;
  }

  /**
   * Get a shared plan by share token
   */
  static async getSharedPlan(shareToken: string): Promise<SharedPlanWithDetails | null> {
    if (!supabase) throw new Error('Supabase client not configured');
    const { data: sharedPlan, error: planError } = await supabase
      .from('shared_plans')
      .select(`
        *,
        semesters:shared_plan_semesters(
          *,
          courses:shared_plan_courses(*)
        )
      `)
      .eq('share_token', shareToken)
      .single();

    if (planError) {
      if (planError.code === 'PGRST116') return null; // Not found
      throw planError;
    }

    // Check if plan has expired
    if (sharedPlan.expires_at && new Date(sharedPlan.expires_at) < new Date()) {
      return null;
    }

    // Increment view count
    await supabase
      .from('shared_plans')
      .update({ view_count: sharedPlan.view_count + 1 })
      .eq('id', sharedPlan.id);

    return sharedPlan as SharedPlanWithDetails;
  }

  /**
   * Get all shared plans for the current user
   */
  static async getUserSharedPlans(): Promise<SharedPlan[]> {
    if (!supabase) throw new Error('Supabase client not configured');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('shared_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update a shared plan
   */
  static async updateSharedPlan(
    planId: string,
    updates: Partial<Pick<SharedPlan, 'title' | 'description' | 'is_public' | 'expires_at'>>
  ): Promise<SharedPlan> {
    if (!supabase) throw new Error('Supabase client not configured');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('shared_plans')
      .update(updates)
      .eq('id', planId)
      .eq('user_id', user.id) // Ensure user owns the plan
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a shared plan
   */
  static async deleteSharedPlan(planId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not configured');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('shared_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', user.id); // Ensure user owns the plan

    if (error) throw error;
  }

  /**
   * Generate a shareable URL for a plan
   */
  static generateShareUrl(shareToken: string): string {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    return `${baseUrl}/shared/${shareToken}`;
  }

  /**
   * Copy share URL to clipboard with fallback support
   */
  static async copyShareUrl(shareToken: string): Promise<void> {
    const url = this.generateShareUrl(shareToken);
    const { copyToClipboard } = await import('./utils');
    await copyToClipboard(url);
  }

  /**
   * Get public shared plans (for discovery)
   */
  static async getPublicSharedPlans(limit: number = 20): Promise<SharedPlan[]> {
    if (!supabase) throw new Error('Supabase client not configured');
    const { data, error } = await supabase
      .from('shared_plans')
      .select('*')
      .eq('is_public', true)
      .is('expires_at', null) // Only non-expiring plans
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}