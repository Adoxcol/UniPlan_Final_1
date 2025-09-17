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
  ShieldCheck,
  Settings, 
  TrendingUp,
  UserPlus,
  UserMinus,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Server,
  Wifi,
  Clock
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
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
                  <p className="text-blue-100 text-lg">
                    Welcome back, {adminLevel.replace('_', ' ')} administrator
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                  <span className="text-sm font-medium">System Online</span>
                </div>
                <div className="flex items-center space-x-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <TrendingUp className="h-4 w-4 text-blue-300" />
                  <span className="text-sm font-medium">All Services Active</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge className={`${getAdminLevelColor(adminLevel)} text-lg px-4 py-2 font-semibold shadow-lg`}>
                {adminLevel.replace('_', ' ').toUpperCase()}
              </Badge>
              <div className="mt-3 text-right">
                <p className="text-blue-100 text-sm">Last login</p>
                <p className="text-white font-medium">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/5"></div>
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5"></div>
      </div>

      {/* Enhanced Stats Cards */}
      {permissions.canViewAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/20"></div>
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-700">Total Users</CardTitle>
              <div className="rounded-full bg-blue-500/20 p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-blue-900">{stats.totalUsers}</div>
              <div className="flex items-center mt-2 text-xs text-blue-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>Active users</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/20"></div>
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-700">Templates</CardTitle>
              <div className="rounded-full bg-emerald-500/20 p-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-emerald-900">{stats.totalTemplates}</div>
              <div className="flex items-center mt-2 text-xs text-emerald-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                <span>Available templates</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/20"></div>
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-purple-700">Shared Plans</CardTitle>
              <div className="rounded-full bg-purple-500/20 p-2">
                <Share2 className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-purple-900">{stats.totalSharedPlans}</div>
              <div className="flex items-center mt-2 text-xs text-purple-600">
                <Share2 className="h-3 w-3 mr-1" />
                <span>Community shared</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-600/20"></div>
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-amber-700">Admin Users</CardTitle>
              <div className="rounded-full bg-amber-500/20 p-2">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-amber-900">{stats.adminUsers}</div>
              <div className="flex items-center mt-2 text-xs text-amber-600">
                <ShieldCheck className="h-3 w-3 mr-1" />
                <span>Privileged access</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Charts */}
      {permissions.canViewAnalytics && (
        <div className="space-y-6">


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">



          </div>
        </div>
       )}



       {/* Activity Feed */}
       {permissions.canViewAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-muted/50 rounded-t-lg border-b">
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>Latest system events and user actions</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {[
                    { icon: UserPlus, color: 'text-primary', bg: 'bg-primary/10', action: 'New user registered', user: 'john.doe@university.edu', time: '2 minutes ago' },
                    { icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10', action: 'Template applied', user: 'jane.smith@university.edu', time: '5 minutes ago' },
                    { icon: Share2, color: 'text-primary', bg: 'bg-primary/10', action: 'Plan shared publicly', user: 'mike.wilson@university.edu', time: '12 minutes ago' },
                    { icon: Shield, color: 'text-primary', bg: 'bg-primary/10', action: 'Admin privileges granted', user: 'admin@university.edu', time: '1 hour ago' },
                    { icon: Database, color: 'text-primary', bg: 'bg-primary/10', action: 'Template seeded', user: 'System', time: '2 hours ago' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border-b hover:bg-muted/50 transition-colors">
                      <div className={`rounded-full p-2 ${activity.bg}`}>
                        <activity.icon className={`h-4 w-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <p className="text-sm text-muted-foreground truncate">{activity.user}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">{activity.time}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-muted/50 rounded-t-lg border-b">
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                <Button className="w-full justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Admin
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700" size="sm">
                  <Database className="h-4 w-4 mr-2" />
                  Seed Templates
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-muted/50 rounded-t-lg border-b">
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>System Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Database</span>
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 dark:text-green-400">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Services</span>
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 dark:text-green-400">Healthy</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Storage</span>
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs text-yellow-600 dark:text-yellow-400">75% Used</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template Cards */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-white/20 p-3">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">BSCSE Template</h3>
                      <p className="text-blue-100">Computer Science & Engineering</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">4 Years</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">8 Semesters</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-600">120+ Credits</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                        <span className="text-gray-600">40+ Courses</span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Complete 4-year Computer Science and Engineering curriculum with core CS courses, 
                      mathematics, and electives.
                    </p>
                    <Button 
                      onClick={handleSeedTemplates}
                      disabled={seedingStatus === 'seeding'}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      {seedingStatus === 'seeding' ? 'Seeding...' : 'Seed Template'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* BBA Template Card */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-white">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-white/20 p-3">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">BBA Template</h3>
                      <p className="text-emerald-100">Business Administration</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-gray-600">4 Years</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">12 Semesters</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">132 Credits</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-600">44 Courses</span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Comprehensive Business Administration program with management, finance, 
                      marketing, and entrepreneurship courses.
                    </p>
                    <Button 
                      disabled
                      className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Already Seeded
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Seeding Status */}
            {seedingStatus !== 'idle' && (
              <Alert className={`border-0 shadow-lg ${
                seedingStatus === 'success' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
                seedingStatus === 'error' ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200' :
                'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {seedingStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {seedingStatus === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
                  {seedingStatus === 'seeding' && <Database className="h-5 w-5 text-blue-600 animate-pulse" />}
                </div>
                <AlertDescription className="ml-7 font-medium">{seedingMessage}</AlertDescription>
              </Alert>
            )}

            {/* Template Statistics */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                  <span>Template Usage Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalTemplates}</div>
                    <div className="text-sm text-gray-600">Total Templates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">156</div>
                    <div className="text-sm text-gray-600">Times Applied</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">89%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {permissions.canManageUsers && (
          <TabsContent value="users" className="space-y-6">
            {/* User Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                      <div className="text-sm text-gray-600">Total Users</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-emerald-100 p-2">
                      <Shield className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">{stats.adminUsers}</div>
                      <div className="text-sm text-gray-600">Admin Users</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-violet-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-purple-100 p-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">+12</div>
                      <div className="text-sm text-gray-600">New This Week</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-amber-100 p-2">
                      <Activity className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-amber-600">89%</div>
                      <div className="text-sm text-gray-600">Active Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Management Table */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-600" />
                  <span>User Management</span>
                </CardTitle>
                <CardDescription>Manage user accounts and admin privileges</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-hidden">
                  {users.map((user, index) => (
                    <div key={user.user_id} className={`flex items-center justify-between p-6 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                          {(user.display_name || user.first_name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {user.display_name || user.first_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {user.university || 'No university set'}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {user.user_id.slice(0, 8)}...
                          </p>
                        </div>
                        <Badge className={`${getAdminLevelColor(user.admin_level)} px-3 py-1 text-xs font-medium`}>
                          {user.admin_level.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      {permissions.canPromoteUsers && user.admin_level !== 'super_admin' && (
                        <div className="flex space-x-2">
                          {user.admin_level === 'user' && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
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
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                                onClick={() => handlePromoteUser(user.user_id, 'admin')}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Make Admin
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => handlePromoteUser(user.user_id, 'user')}
                              >
                                <UserMinus className="h-4 w-4 mr-1" />
                                Demote
                              </Button>
                            </>
                          )}
                          {user.admin_level === 'admin' && adminLevel === 'super_admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
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