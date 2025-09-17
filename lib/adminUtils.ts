import { supabase } from './supabaseClient';
import { Profile } from './types';
import { auditService } from './auditService';

export type AdminLevel = 'user' | 'moderator' | 'admin' | 'super_admin';

export interface AdminPermissions {
  canSeedTemplates: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canModerateContent: boolean;
  canManageSystem: boolean;
  canPromoteUsers: boolean;
}

/**
 * Get admin permissions based on admin level
 */
export function getAdminPermissions(adminLevel: AdminLevel): AdminPermissions {
  const permissions: AdminPermissions = {
    canSeedTemplates: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canModerateContent: false,
    canManageSystem: false,
    canPromoteUsers: false,
  };

  switch (adminLevel) {
    case 'super_admin':
      return {
        canSeedTemplates: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canModerateContent: true,
        canManageSystem: true,
        canPromoteUsers: true,
      };
    case 'admin':
      return {
        canSeedTemplates: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canModerateContent: true,
        canManageSystem: false,
        canPromoteUsers: false,
      };
    case 'moderator':
      return {
        canSeedTemplates: false,
        canManageUsers: false,
        canViewAnalytics: true,
        canModerateContent: true,
        canManageSystem: false,
        canPromoteUsers: false,
      };
    case 'user':
    default:
      return permissions;
  }
}

/**
 * Check if current user is admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, admin_level')
      .eq('user_id', user.id)
      .single();

    return profile?.is_admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get current user's admin level
 */
export async function getCurrentUserAdminLevel(): Promise<AdminLevel> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'user';

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, admin_level')
      .eq('user_id', user.id)
      .single();

    if (!profile?.is_admin) return 'user';
    return profile.admin_level as AdminLevel;
  } catch (error) {
    console.error('Error getting admin level:', error);
    return 'user';
  }
}

/**
 * Get current user's admin permissions
 */
export async function getCurrentUserPermissions(): Promise<AdminPermissions> {
  const adminLevel = await getCurrentUserAdminLevel();
  return getAdminPermissions(adminLevel);
}

/**
 * Check if current user has specific permission
 */
export async function hasPermission(permission: keyof AdminPermissions): Promise<boolean> {
  const permissions = await getCurrentUserPermissions();
  return permissions[permission];
}

/**
 * Get all users with their admin status (admin only)
 */
export async function getAllUsers(): Promise<Profile[]> {
  const canManage = await hasPermission('canManageUsers');
  if (!canManage) {
    throw new Error('Insufficient permissions to view users');
  }

  // Get the current session to pass the auth token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No valid session found');
  }

  // Call the admin API route that uses service role key
  const response = await fetch('/api/admin/users', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch users');
  }

  const result = await response.json();
  return result.users || [];
}

/**
 * Promote/demote user admin status (super admin only)
 */
export async function updateUserAdminStatus(
  userId: string,
  isAdmin: boolean,
  adminLevel: AdminLevel = 'user'
): Promise<void> {
  const canPromote = await hasPermission('canPromoteUsers');
  if (!canPromote) {
    throw new Error('Insufficient permissions to modify user admin status');
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      is_admin: isAdmin,
      admin_level: isAdmin ? adminLevel : 'user',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    // Log failed attempt
    await auditService.logUserManagement(
      isAdmin ? 'admin_promote' : 'admin_demote',
      userId,
      { admin_level: adminLevel, success: false, error: error.message }
    );
    throw new Error(`Failed to update user admin status: ${error.message}`);
  }

  // Log successful admin status change
  await auditService.logUserManagement(
    isAdmin ? 'admin_promote' : 'admin_demote',
    userId,
    { admin_level: adminLevel, previous_status: !isAdmin }
  );
}

/**
 * Create admin user (for initial setup)
 */
export async function createAdminUser(
  email: string,
  password: string,
  adminLevel: AdminLevel = 'admin'
): Promise<{ user: any; profile: Profile }> {
  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    // Log failed user creation
    await auditService.logAdminAction('admin_create', 'user', {
      details: { email, admin_level: adminLevel, success: false, error: authError?.message }
    });
    throw new Error(`Failed to create admin user: ${authError?.message}`);
  }

  // Update their profile to be admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({
      is_admin: true,
      admin_level: adminLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', authData.user.id)
    .select()
    .single();

  if (profileError) {
    // Log failed profile update
    await auditService.logAdminAction('admin_create', 'user', {
      resourceId: authData.user.id,
      details: { email, admin_level: adminLevel, success: false, error: profileError.message }
    });
    throw new Error(`Failed to set admin status: ${profileError.message}`);
  }

  // Log successful admin user creation
  await auditService.logAdminAction('admin_create', 'user', {
    resourceId: authData.user.id,
    details: { email, admin_level: adminLevel, user_id: authData.user.id }
  });

  return {
    user: authData.user,
    profile: profile as Profile,
  };
}

/**
 * Promote a user to admin
 */
export async function promoteToAdmin(userId: string, adminLevel: AdminLevel = 'admin'): Promise<void> {
  const canPromote = await hasPermission('canPromoteUsers');
  if (!canPromote) {
    throw new Error('Insufficient permissions to promote users');
  }

  // Get the current session to pass the auth token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No valid session found');
  }

  // Call the admin API route that uses service role key
  const response = await fetch('/api/admin/users', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      isAdmin: true,
      adminLevel,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    // Log failed promotion
    await auditService.logUserManagement('admin_promote', userId, {
      admin_level: adminLevel,
      success: false,
      error: error.error || 'Failed to promote user'
    });
    throw new Error(error.error || 'Failed to promote user');
  }

  // Log successful promotion
  await auditService.logUserManagement('admin_promote', userId, {
    admin_level: adminLevel,
    method: 'api_route'
  });
}

/**
 * Demote a user from admin
 */
export async function demoteFromAdmin(userId: string): Promise<void> {
  const canPromote = await hasPermission('canPromoteUsers');
  if (!canPromote) {
    throw new Error('Insufficient permissions to demote users');
  }

  // Get the current session to pass the auth token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No valid session found');
  }

  // Call the admin API route that uses service role key
  const response = await fetch('/api/admin/users', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      isAdmin: false,
      adminLevel: null,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    // Log failed demotion
    await auditService.logUserManagement('admin_demote', userId, {
      success: false,
      error: error.error || 'Failed to demote user'
    });
    throw new Error(error.error || 'Failed to demote user');
  }

  // Log successful demotion
  await auditService.logUserManagement('admin_demote', userId, {
    method: 'api_route',
    previous_admin_level: 'unknown'
  });
}

/**
 * Get admin dashboard stats
 */
export async function getAdminStats(): Promise<{
  totalUsers: number;
  totalTemplates: number;
  totalSharedPlans: number;
  adminUsers: number;
}> {
  const canView = await hasPermission('canViewAnalytics');
  if (!canView) {
    throw new Error('Insufficient permissions to view analytics');
  }

  // Get the current session to pass the auth token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No valid session found');
  }

  // Call the admin API route that uses service role key
  const response = await fetch('/api/admin/stats', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch admin stats');
  }

  return await response.json();
}