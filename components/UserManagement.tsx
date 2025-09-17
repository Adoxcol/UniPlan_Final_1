'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { Label } from './ui/label';

import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  UserPlus, 
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  getAllUsers, 
  promoteToAdmin, 
  demoteFromAdmin, 
  createAdminUser,
  hasPermission 
} from '../lib/adminUtils';
import { useAuditLogger } from '../hooks/useAuditLogger';
import { Profile } from '../lib/types';
import { LoadingSpinner, ActionFeedback } from './ui/loading-states';

interface UserManagementProps {
  onUserUpdate?: () => void;
}

export default function UserManagement({ onUserUpdate }: UserManagementProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  
  // Create admin user dialog state
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [creating, setCreating] = useState(false);
  
  const { logUserManagement, logAdminAction } = useAuditLogger();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteUser = async (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    setActionLoading(prev => ({ ...prev, [`promote-${userId}`]: true }));
    
    try {
      setError(null);
      setSuccess(null);
      
      await promoteToAdmin(userId);
      
      // Log successful promotion
      await logUserManagement('admin_promote', userId, {
        targetUserName: user?.display_name || user?.first_name || 'Unknown',
        success: true,
        method: 'user_management_interface'
      });
      
      setSuccess(`${user?.display_name || 'User'} promoted to admin successfully`);
      await loadUsers();
      onUserUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to promote user';
      setError(errorMessage);
      
      // Log failed promotion
      await logUserManagement('admin_promote', userId, {
        targetUserName: user?.display_name || user?.first_name || 'Unknown',
        success: false,
        error: errorMessage,
        method: 'user_management_interface'
      });
      
      console.error('Error promoting user:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`promote-${userId}`]: false }));
    }
  };

  const handleDemoteUser = async (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    setActionLoading(prev => ({ ...prev, [`demote-${userId}`]: true }));
    
    try {
      setError(null);
      setSuccess(null);
      
      await demoteFromAdmin(userId);
      
      // Log successful demotion
      await logUserManagement('admin_demote', userId, {
        targetUserName: user?.display_name || user?.first_name || 'Unknown',
        previousAdminLevel: user?.admin_level || 'admin',
        success: true,
        method: 'user_management_interface'
      });
      
      setSuccess(`${user?.display_name || 'User'} demoted from admin successfully`);
      await loadUsers();
      onUserUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to demote user';
      setError(errorMessage);
      
      // Log failed demotion
      await logUserManagement('admin_demote', userId, {
        targetUserName: user?.display_name || user?.first_name || 'Unknown',
        previousAdminLevel: user?.admin_level || 'admin',
        success: false,
        error: errorMessage,
        method: 'user_management_interface'
      });
      
      console.error('Error demoting user:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`demote-${userId}`]: false }));
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword || !newAdminName) {
      setError('All fields are required');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      setSuccess(null);
      
      await createAdminUser(newAdminEmail, newAdminPassword, 'admin');
      
      // Log successful admin creation
      await logAdminAction('admin_create', 'user', {
          success: true,
          details: {
            targetEmail: newAdminEmail,
            targetName: newAdminName,
            adminLevel: 'admin',
            method: 'manual_creation'
          }
        });
      
      setSuccess(`Admin user ${newAdminName} created successfully`);
      setShowCreateAdmin(false);
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminName('');
      await loadUsers();
      onUserUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create admin user';
      setError(errorMessage);
      
      // Log failed admin creation
      await logAdminAction('admin_create', 'user', {
          success: false,
          errorMessage: errorMessage,
          details: {
            targetEmail: newAdminEmail,
            targetName: newAdminName,
            adminLevel: 'admin',
            method: 'manual_creation'
          }
        });
      
      console.error('Error creating admin user:', err);
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' ||
                       (roleFilter === 'admin' && user.is_admin) ||
                       (roleFilter === 'user' && !user.is_admin);
    return matchesSearch && matchesRole;
  });

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user accounts and admin privileges
            </CardDescription>
          </div>
          <Dialog open={showCreateAdmin} onOpenChange={setShowCreateAdmin}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Admin User</DialogTitle>
                <DialogDescription>
                  Create a new user account with admin privileges
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="admin-name">Full Name</Label>
                  <Input
                    id="admin-name"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateAdmin(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAdmin} disabled={creating} className="min-w-[120px]">
                  {creating ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create Admin'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ActionFeedback type="error" message={error} />
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ActionFeedback type="success" message={success} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="search">Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="role-filter">Filter by Role</Label>
            <Select value={roleFilter} onValueChange={(value: 'all' | 'admin' | 'user') => setRoleFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(error || success) && (
            <Button variant="outline" onClick={clearMessages}>
              Clear
            </Button>
          )}
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">
                        {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No name'}
                      </TableCell>
                      <TableCell>{user.user_id}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_admin ? 'default' : 'secondary'}>
                          {user.is_admin ? (
                            <>
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Admin ({user.admin_level})
                            </>
                          ) : (
                            <>
                              <Users className="h-3 w-3 mr-1" />
                              User
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.is_admin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDemoteUser(user.user_id)}
                              disabled={actionLoading[`demote-${user.user_id}`]}
                              className="min-w-[80px]"
                            >
                              {actionLoading[`demote-${user.user_id}`] ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Demote
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePromoteUser(user.user_id)}
                              disabled={actionLoading[`promote-${user.user_id}`]}
                              className="min-w-[80px]"
                            >
                              {actionLoading[`promote-${user.user_id}`] ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <>
                                  <Shield className="h-3 w-3 mr-1" />
                                  Promote
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </CardContent>
    </Card>
  );
}