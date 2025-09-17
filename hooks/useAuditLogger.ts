import { useCallback } from 'react';
import { auditService, AuditAction, AuditResourceType, AuditLogOptions } from '../lib/auditService';

/**
 * Custom hook for audit logging with automatic error handling
 */
export function useAuditLogger() {
  const logAction = useCallback(async (
    action: AuditAction,
    resourceType: AuditResourceType,
    options: AuditLogOptions = {}
  ) => {
    try {
      const result = await auditService.logAction(action, resourceType, options);
      if (!result.success) {
        console.warn('Audit logging failed:', result.error);
      }
      return result;
    } catch (error) {
      console.error('Audit logging error:', error);
      return { success: false, error: 'Audit logging failed' };
    }
  }, []);

  const logAuth = useCallback(async (
    action: 'user_login' | 'user_logout' | 'user_register',
    userId: string,
    options: Omit<AuditLogOptions, 'userId'> = {}
  ) => {
    return auditService.logAuth(action, userId, options);
  }, []);

  const logAdminAction = useCallback(async (
    action: AuditAction,
    resourceType: AuditResourceType,
    options: AuditLogOptions = {}
  ) => {
    return auditService.logAdminAction(action, resourceType, options);
  }, []);

  const logUserManagement = useCallback(async (
    action: 'admin_promote' | 'admin_demote' | 'admin_create',
    targetUserId: string,
    details: Record<string, any> = {},
    options: Omit<AuditLogOptions, 'resourceId' | 'details'> = {}
  ) => {
    return auditService.logUserManagement(action, targetUserId, details, options);
  }, []);

  const logTemplateAction = useCallback(async (
    action: 'template_create' | 'template_update' | 'template_delete' | 'template_publish',
    templateId: string,
    details: Record<string, any> = {},
    options: Omit<AuditLogOptions, 'resourceId' | 'details'> = {}
  ) => {
    return auditService.logTemplateAction(action, templateId, details, options);
  }, []);

  const logDataOperation = useCallback(async (
    action: 'data_export' | 'data_import' | 'system_backup' | 'system_restore',
    details: Record<string, any> = {},
    options: AuditLogOptions = {}
  ) => {
    return auditService.logDataOperation(action, details, options);
  }, []);

  const logBulkOperation = useCallback(async (
    resourceType: AuditResourceType,
    operationType: string,
    affectedCount: number,
    details: Record<string, any> = {},
    options: AuditLogOptions = {}
  ) => {
    return auditService.logBulkOperation(resourceType, operationType, affectedCount, details, options);
  }, []);

  return {
    logAction,
    logAuth,
    logAdminAction,
    logUserManagement,
    logTemplateAction,
    logDataOperation,
    logBulkOperation,
  };
}

/**
 * Hook for course-related audit logging
 */
export function useCourseAuditLogger() {
  const { logAction, logAdminAction } = useAuditLogger();

  const logCourseCreate = useCallback(async (courseId: string, courseData: any) => {
    return logAction('course_create', 'course', {
      resourceId: courseId,
      details: {
        course_name: courseData.name,
        course_code: courseData.code,
        credits: courseData.credits,
      },
    });
  }, [logAction]);

  const logCourseUpdate = useCallback(async (courseId: string, changes: any) => {
    return logAction('course_update', 'course', {
      resourceId: courseId,
      details: {
        changes,
        updated_fields: Object.keys(changes),
      },
    });
  }, [logAction]);

  const logCourseDelete = useCallback(async (courseId: string, courseData: any) => {
    return logAdminAction('course_delete', 'course', {
      resourceId: courseId,
      details: {
        course_name: courseData.name,
        course_code: courseData.code,
        deletion_reason: 'admin_action',
      },
    });
  }, [logAdminAction]);

  return {
    logCourseCreate,
    logCourseUpdate,
    logCourseDelete,
  };
}

/**
 * Hook for semester-related audit logging
 */
export function useSemesterAuditLogger() {
  const { logAction, logAdminAction } = useAuditLogger();

  const logSemesterCreate = useCallback(async (semesterId: string, semesterData: any) => {
    return logAction('semester_create', 'semester', {
      resourceId: semesterId,
      details: {
        semester_name: semesterData.name,
        year: semesterData.year,
        season: semesterData.season,
      },
    });
  }, [logAction]);

  const logSemesterUpdate = useCallback(async (semesterId: string, changes: any) => {
    return logAction('semester_update', 'semester', {
      resourceId: semesterId,
      details: {
        changes,
        updated_fields: Object.keys(changes),
      },
    });
  }, [logAction]);

  const logSemesterDelete = useCallback(async (semesterId: string, semesterData: any) => {
    return logAdminAction('semester_delete', 'semester', {
      resourceId: semesterId,
      details: {
        semester_name: semesterData.name,
        year: semesterData.year,
        deletion_reason: 'admin_action',
      },
    });
  }, [logAdminAction]);

  return {
    logSemesterCreate,
    logSemesterUpdate,
    logSemesterDelete,
  };
}

/**
 * Hook for profile-related audit logging
 */
export function useProfileAuditLogger() {
  const { logAction, logAdminAction } = useAuditLogger();

  const logProfileCreate = useCallback(async (userId: string, profileData: any) => {
    return logAction('profile_create', 'profile', {
      resourceId: userId,
      userId,
      details: {
        display_name: profileData.display_name,
        email: profileData.email,
        university: profileData.university,
      },
    });
  }, [logAction]);

  const logProfileUpdate = useCallback(async (userId: string, changes: any) => {
    return logAction('profile_update', 'profile', {
      resourceId: userId,
      userId,
      details: {
        changes,
        updated_fields: Object.keys(changes),
      },
    });
  }, [logAction]);

  const logProfileDelete = useCallback(async (userId: string, profileData: any) => {
    return logAdminAction('profile_delete', 'profile', {
      resourceId: userId,
      details: {
        display_name: profileData.display_name,
        email: profileData.email,
        deletion_reason: 'admin_action',
      },
    });
  }, [logAdminAction]);

  return {
    logProfileCreate,
    logProfileUpdate,
    logProfileDelete,
  };
}

/**
 * Hook for shared plan audit logging
 */
export function useSharedPlanAuditLogger() {
  const { logAction } = useAuditLogger();

  const logPlanShare = useCallback(async (planId: string, shareDetails: any) => {
    return logAction('plan_share', 'shared_plan', {
      resourceId: planId,
      details: {
        plan_id: planId,
        shared_with: shareDetails.shared_with,
        permissions: shareDetails.permissions,
        share_type: shareDetails.share_type,
      },
    });
  }, [logAction]);

  const logPlanUnshare = useCallback(async (planId: string, unshareDetails: any) => {
    return logAction('plan_unshare', 'shared_plan', {
      resourceId: planId,
      details: {
        plan_id: planId,
        unshared_from: unshareDetails.unshared_from,
        reason: unshareDetails.reason,
      },
    });
  }, [logAction]);

  const logPlanAccess = useCallback(async (planId: string, accessDetails: any) => {
    return logAction('plan_access', 'shared_plan', {
      resourceId: planId,
      details: {
        plan_id: planId,
        access_type: accessDetails.access_type,
        viewer_id: accessDetails.viewer_id,
      },
    });
  }, [logAction]);

  return {
    logPlanShare,
    logPlanUnshare,
    logPlanAccess,
  };
}

/**
 * Hook for authentication audit logging
 */
export function useAuthAuditLogger() {
  const { logAuth } = useAuditLogger();

  const logLogin = useCallback(async (userId: string, loginDetails: any = {}) => {
    return logAuth('user_login', userId, {
      details: {
        login_method: loginDetails.method || 'email',
        ip_address: loginDetails.ip_address,
        user_agent: loginDetails.user_agent,
      },
      ipAddress: loginDetails.ip_address,
      userAgent: loginDetails.user_agent,
    });
  }, [logAuth]);

  const logLogout = useCallback(async (userId: string, logoutDetails: any = {}) => {
    return logAuth('user_logout', userId, {
      details: {
        logout_type: logoutDetails.type || 'manual',
        session_duration: logoutDetails.session_duration,
      },
    });
  }, [logAuth]);

  const logRegister = useCallback(async (userId: string, registerDetails: any = {}) => {
    return logAuth('user_register', userId, {
      details: {
        registration_method: registerDetails.method || 'email',
        email: registerDetails.email,
        university: registerDetails.university,
      },
    });
  }, [logAuth]);

  return {
    logLogin,
    logLogout,
    logRegister,
  };
}

export default useAuditLogger;