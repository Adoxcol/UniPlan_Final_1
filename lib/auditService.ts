import { supabase } from './supabaseClient';

export type AuditAction = 
  | 'user_login' | 'user_logout' | 'user_register' | 'user_delete'
  | 'profile_create' | 'profile_update' | 'profile_delete'
  | 'semester_create' | 'semester_update' | 'semester_delete'
  | 'course_create' | 'course_update' | 'course_delete'
  | 'admin_promote' | 'admin_demote' | 'admin_create'
  | 'template_create' | 'template_update' | 'template_delete' | 'template_publish'
  | 'plan_share' | 'plan_unshare' | 'plan_access'
  | 'system_backup' | 'system_restore' | 'system_maintenance'
  | 'data_export' | 'data_import' | 'bulk_operation';

export type AuditResourceType = 
  | 'user' | 'profile' | 'semester' | 'course' | 'template' | 'shared_plan' | 'system' | 'auth';

export interface AuditLogEntry {
  id?: string;
  user_id?: string;
  admin_user_id?: string;
  action: AuditAction;
  resource_type: AuditResourceType;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  success?: boolean;
  error_message?: string;
  created_at?: string;
}

export interface AuditLogOptions {
  userId?: string;
  adminUserId?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

class AuditService {
  /**
   * Log an audit entry to the database
   */
  async logAction(
    action: AuditAction,
    resourceType: AuditResourceType,
    options: AuditLogOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const auditEntry: Omit<AuditLogEntry, 'id' | 'created_at'> = {
        user_id: options.userId,
        admin_user_id: options.adminUserId,
        action,
        resource_type: resourceType,
        resource_id: options.resourceId,
        details: options.details,
        ip_address: options.ipAddress,
        user_agent: options.userAgent,
        success: options.success ?? true,
        error_message: options.errorMessage,
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        console.error('Failed to log audit entry:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Audit logging error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Log user authentication events
   */
  async logAuth(
    action: 'user_login' | 'user_logout' | 'user_register',
    userId: string,
    options: Omit<AuditLogOptions, 'userId'> = {}
  ): Promise<{ success: boolean; error?: string }> {
    return this.logAction(action, 'auth', {
      ...options,
      userId,
    });
  }

  /**
   * Log admin actions with automatic admin user detection
   */
  async logAdminAction(
    action: AuditAction,
    resourceType: AuditResourceType,
    options: AuditLogOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current user session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'No authenticated user for admin action' };
      }

      return this.logAction(action, resourceType, {
        ...options,
        adminUserId: user.id,
      });
    } catch (error) {
      console.error('Admin audit logging error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Log user management actions (promote, demote, create admin)
   */
  async logUserManagement(
    action: 'admin_promote' | 'admin_demote' | 'admin_create',
    targetUserId: string,
    details: Record<string, any> = {},
    options: Omit<AuditLogOptions, 'resourceId' | 'details'> = {}
  ): Promise<{ success: boolean; error?: string }> {
    return this.logAdminAction(action, 'user', {
      ...options,
      resourceId: targetUserId,
      details: {
        target_user_id: targetUserId,
        ...details,
      },
    });
  }

  /**
   * Log template management actions
   */
  async logTemplateAction(
    action: 'template_create' | 'template_update' | 'template_delete' | 'template_publish',
    templateId: string,
    details: Record<string, any> = {},
    options: Omit<AuditLogOptions, 'resourceId' | 'details'> = {}
  ): Promise<{ success: boolean; error?: string }> {
    return this.logAdminAction(action, 'template', {
      ...options,
      resourceId: templateId,
      details: {
        template_id: templateId,
        ...details,
      },
    });
  }

  /**
   * Log data operations (export, import, backup)
   */
  async logDataOperation(
    action: 'data_export' | 'data_import' | 'system_backup' | 'system_restore',
    details: Record<string, any> = {},
    options: AuditLogOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    return this.logAdminAction(action, 'system', {
      ...options,
      details: {
        operation_type: action,
        ...details,
      },
    });
  }

  /**
   * Log bulk operations
   */
  async logBulkOperation(
    resourceType: AuditResourceType,
    operationType: string,
    affectedCount: number,
    details: Record<string, any> = {},
    options: AuditLogOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    return this.logAdminAction('bulk_operation', resourceType, {
      ...options,
      details: {
        operation_type: operationType,
        affected_count: affectedCount,
        ...details,
      },
    });
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(options: {
    userId?: string;
    adminUserId?: string;
    action?: AuditAction;
    resourceType?: AuditResourceType;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    successOnly?: boolean;
  } = {}): Promise<{ data: AuditLogEntry[] | null; error?: string }> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }
      if (options.adminUserId) {
        query = query.eq('admin_user_id', options.adminUserId);
      }
      if (options.action) {
        query = query.eq('action', options.action);
      }
      if (options.resourceType) {
        query = query.eq('resource_type', options.resourceType);
      }
      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }
      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }
      if (options.successOnly) {
        query = query.eq('success', true);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch audit logs:', error);
        return { data: null, error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Audit logs fetch error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get audit statistics for dashboard
   */
  async getAuditStats(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    data: {
      totalActions: number;
      failedActions: number;
      adminActions: number;
      userActions: number;
      topActions: Array<{ action: string; count: number }>;
      topAdmins: Array<{ admin_user_id: string; count: number }>;
    } | null;
    error?: string;
  }> {
    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Get basic stats
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('action, admin_user_id, success')
        .gte('created_at', startDate.toISOString());

      if (error) {
        return { data: null, error: error.message };
      }

      if (!logs) {
        return { data: null, error: 'No audit logs found' };
      }

      // Calculate statistics
      const totalActions = logs.length;
      const failedActions = logs.filter(log => !log.success).length;
      const adminActions = logs.filter(log => log.admin_user_id).length;
      const userActions = totalActions - adminActions;

      // Top actions
      const actionCounts = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top admins
      const adminCounts = logs
        .filter(log => log.admin_user_id)
        .reduce((acc, log) => {
          acc[log.admin_user_id!] = (acc[log.admin_user_id!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topAdmins = Object.entries(adminCounts)
        .map(([admin_user_id, count]) => ({ admin_user_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        data: {
          totalActions,
          failedActions,
          adminActions,
          userActions,
          topActions,
          topAdmins,
        },
      };
    } catch (error) {
      console.error('Audit stats error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const auditService = new AuditService();
export default auditService;