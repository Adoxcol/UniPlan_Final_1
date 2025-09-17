'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Users, 
  BookOpen, 
  Share2, 
  Shield, 
  Settings, 
  TrendingUp,
  UserPlus,
  UserMinus,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  getCurrentUserAdminLevel, 
  getCurrentUserPermissions, 
  getAdminStats,
  getAllUsers,
  updateUserAdminStatus,
  AdminLevel,
  AdminPermissions
} from '../lib/adminUtils';
import { Profile } from '../lib/types';
import { TemplateSeeder } from '../lib/templateSeeder';
import { supabase } from '../lib/supabaseClient';
import UserManagement from './UserManagement';

interface AdminStats {
  totalUsers: number;
  totalTemplates: number;
  totalSharedPlans: number;
  adminUsers: number;
}

export default function AdminDashboard() {
  const [adminLevel, setAdminLevel] = useState<AdminLevel>('user');
  const [permissions, setPermissions] = useState<AdminPermissions>({
    canSeedTemplates: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canModerateContent: false,
    canManageSystem: false,
    canPromoteUsers: false,
  });
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTemplates: 0,
    totalSharedPlans: 0,
    adminUsers: 0,
  });
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedingStatus, setSeedingStatus] = useState<'idle' | 'seeding' | 'success' | 'error'>('idle');
  const [seedingMessage, setSeedingMessage] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [level, perms, adminStats] = await Promise.all([
        getCurrentUserAdminLevel(),
        getCurrentUserPermissions(),
        getAdminStats(),
      ]);

      setAdminLevel(level);
      setPermissions(perms);
      setStats(adminStats);

      // Load users if user has permission
      if (perms.canManageUsers) {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedTemplates = async () => {
    try {
      setSeedingStatus('seeding');
      setSeedingMessage('🌱 Starting template seeding process...');
      
      // Get the current session to pass the auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found. Please sign in again.');
      }

      console.log('🔐 Authenticated session found, calling seed API...');
      setSeedingMessage('🔐 Verifying admin permissions...');

      // Call the seed templates API
      const response = await fetch('/api/admin/seed-templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to seed templates');
      }

      console.log('✅ Seeding API response:', result);

      if (result.success) {
        setSeedingStatus('success');
        if (result.stats) {
          setSeedingMessage(
            `🎉 Template seeded successfully! Created ${result.stats.templates} template(s), ${result.stats.semesters} semester(s), and ${result.stats.courses} course(s). Template: "${result.templateName}"`
          );
        } else {
          setSeedingMessage(`⚠️ ${result.message || 'Template already exists or was updated.'}`);
        }
      } else {
        setSeedingMessage(`⚠️ ${result.message || 'Template seeding completed with warnings.'}`);
      }
      
      // Refresh stats to show updated counts
      console.log('🔄 Refreshing admin stats...');
      const newStats = await getAdminStats();
      setStats(newStats);
      console.log('✅ Stats refreshed:', newStats);
      
    } catch (error) {
      console.error('❌ Template seeding error:', error);
      setSeedingStatus('error');
      setSeedingMessage(`❌ Error seeding templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePromoteUser = async (userId: string, newLevel: AdminLevel) => {
    try {
      await updateUserAdminStatus(userId, newLevel !== 'user', newLevel);
      await loadAdminData(); // Refresh data
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const getAdminLevelColor = (level: AdminLevel) => {
    switch (level) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'moderator': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (adminLevel === 'user') {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don&apos;t have admin access. Contact a system administrator to request admin privileges.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome, {adminLevel.replace('_', ' ')} administrator
          </p>
        </div>
        <Badge className={getAdminLevelColor(adminLevel)}>
          {adminLevel.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Stats Cards */}
      {permissions.canViewAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTemplates}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shared Plans</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSharedPlans}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.adminUsers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {permissions.canSeedTemplates && (
            <TabsTrigger value="templates">Templates</TabsTrigger>
          )}
          {permissions.canManageUsers && (
            <TabsTrigger value="users">Users</TabsTrigger>
          )}
          {permissions.canManageSystem && (
            <TabsTrigger value="system">System</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Permissions</CardTitle>
              <CardDescription>Your current administrative capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    {value ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {permissions.canSeedTemplates && (
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Template Management</CardTitle>
                <CardDescription>Seed and manage official degree templates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Official BSCSE Template</h3>
                    <p className="text-sm text-gray-600">
                      Complete 4-year Computer Science and Engineering curriculum
                    </p>
                  </div>
                  <Button 
                    onClick={handleSeedTemplates}
                    disabled={seedingStatus === 'seeding'}
                    className="flex items-center space-x-2"
                  >
                    <Database className="h-4 w-4" />
                    <span>
                      {seedingStatus === 'seeding' ? 'Seeding...' : 'Seed Template'}
                    </span>
                  </Button>
                </div>
                
                {seedingStatus !== 'idle' && (
                  <Alert className={
                    seedingStatus === 'success' ? 'border-green-200 bg-green-50' :
                    seedingStatus === 'error' ? 'border-red-200 bg-red-50' :
                    'border-blue-200 bg-blue-50'
                  }>
                    <AlertDescription>{seedingMessage}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {permissions.canManageUsers && (
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and admin privileges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">
                            {user.display_name || user.first_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {user.university || 'No university set'}
                          </p>
                        </div>
                        <Badge className={getAdminLevelColor(user.admin_level)}>
                          {user.admin_level.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      {permissions.canPromoteUsers && user.admin_level !== 'super_admin' && (
                        <div className="flex space-x-2">
                          {user.admin_level === 'user' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePromoteUser(user.user_id, 'moderator')}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Make Moderator
                            </Button>
                          )}
                          {user.admin_level === 'moderator' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePromoteUser(user.user_id, 'admin')}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Make Admin
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePromoteUser(user.user_id, 'user')}
                              >
                                <UserMinus className="h-4 w-4 mr-1" />
                                Remove Admin
                              </Button>
                            </>
                          )}
                          {user.admin_level === 'admin' && adminLevel === 'super_admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePromoteUser(user.user_id, 'user')}
                            >
                              <UserMinus className="h-4 w-4 mr-1" />
                              Remove Admin
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {permissions.canManageSystem && (
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Management</CardTitle>
                <CardDescription>Advanced system administration tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Settings className="h-4 w-4" />
                    <AlertDescription>
                      System management features are available for super administrators.
                      Additional tools can be added here as needed.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* User Management Section */}
      <div className="mt-8">
        <UserManagement onUserUpdate={loadAdminData} />
      </div>
    </div>
  );
}