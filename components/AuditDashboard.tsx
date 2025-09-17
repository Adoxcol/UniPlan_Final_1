/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Activity, 
  Users, 
  AlertTriangle, 
  Calendar,
  Filter,
  Search,
  Download,
  RefreshCw,
  Eye,
  Clock,
  User,
  Settings
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { LoadingSpinner, ActionFeedback } from './ui/loading-states';
import { auditService, AuditLogEntry, AuditAction, AuditResourceType } from '../lib/auditService';
import { hasPermission } from '../lib/adminUtils';

interface AuditStats {
  totalActions: number;
  failedActions: number;
  adminActions: number;
  userActions: number;
  topActions: Array<{ action: string; count: number }>;
  topAdmins: Array<{ admin_user_id: string; count: number }>;
}

export default function AuditDashboard() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');
  const [resourceFilter, setResourceFilter] = useState<AuditResourceType | 'all'>('all');
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [successFilter, setSuccessFilter] = useState<'all' | 'success' | 'failed'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [hasAccess, actionFilter, resourceFilter, timeframe, successFilter, currentPage]);

  // Auto-clear feedback after 3 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const checkAccess = async () => {
    try {
      const canView = await hasPermission('canViewAnalytics');
      setHasAccess(canView);
      if (!canView) {
        setFeedback({ type: 'error', message: 'Insufficient permissions to view audit logs' });
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setFeedback({ type: 'error', message: 'Failed to check permissions' });
    }
  };

  const loadData = async () => {
    if (!hasAccess) return;

    try {
      setLoading(true);

      // Load stats
      const statsResult = await auditService.getAuditStats(timeframe);
      if (statsResult.data) {
        setStats(statsResult.data);
      }

      // Prepare filters for logs
      const filters: any = {
        limit: logsPerPage,
        offset: (currentPage - 1) * logsPerPage,
      };

      if (actionFilter !== 'all') {
        filters.action = actionFilter;
      }
      if (resourceFilter !== 'all') {
        filters.resourceType = resourceFilter;
      }
      if (successFilter === 'success') {
        filters.successOnly = true;
      } else if (successFilter === 'failed') {
        filters.successOnly = false;
      }

      // Set date range based on timeframe
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
      filters.startDate = startDate.toISOString();

      // Load logs
      const logsResult = await auditService.getAuditLogs(filters);
      if (logsResult.data) {
        setLogs(logsResult.data);
        setTotalPages(Math.ceil(logsResult.data.length / logsPerPage));
      }

    } catch (error) {
      console.error('Error loading audit data:', error);
      setFeedback({ type: 'error', message: 'Failed to load audit data' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    setFeedback({ type: 'success', message: 'Audit data refreshed' });
  };

  const handleExport = async () => {
    try {
      const allLogs = await auditService.getAuditLogs({ limit: 1000 });
      if (allLogs.data) {
        const csv = convertToCSV(allLogs.data);
        downloadCSV(csv, `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
        setFeedback({ type: 'success', message: 'Audit logs exported successfully' });
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
      setFeedback({ type: 'error', message: 'Failed to export audit logs' });
    }
  };

  const convertToCSV = (data: AuditLogEntry[]): string => {
    const headers = ['Date', 'Action', 'Resource Type', 'User ID', 'Admin User ID', 'Success', 'Details'];
    const rows = data.map(log => [
      log.created_at || '',
      log.action,
      log.resource_type,
      log.user_id || '',
      log.admin_user_id || '',
      log.success ? 'Yes' : 'No',
      JSON.stringify(log.details || {})
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActionIcon = (action: AuditAction) => {
    if (action.includes('admin')) return <Shield className="h-4 w-4" />;
    if (action.includes('user')) return <Users className="h-4 w-4" />;
    if (action.includes('template')) return <Settings className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionColor = (action: AuditAction, success: boolean) => {
    if (!success) return 'destructive';
    if (action.includes('admin')) return 'default';
    if (action.includes('delete')) return 'secondary';
    return 'outline';
  };

  const filteredLogs = logs.filter(log => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.action.toLowerCase().includes(searchLower) ||
        log.resource_type.toLowerCase().includes(searchLower) ||
        (log.user_id && log.user_id.toLowerCase().includes(searchLower)) ||
        (log.admin_user_id && log.admin_user_id.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                You don&apos;t have permission to view audit logs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system activities and admin actions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <ActionFeedback
            type={feedback.type}
            message={feedback.message}
          />
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActions}</div>
              <p className="text-xs text-muted-foreground">
                Last {timeframe}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Actions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failedActions}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.failedActions / stats.totalActions) * 100).toFixed(1)}% failure rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.adminActions}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.adminActions / stats.totalActions) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Actions</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.userActions}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.userActions / stats.totalActions) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={actionFilter} onValueChange={(value) => setActionFilter(value as AuditAction | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="admin_promote">Admin Promote</SelectItem>
                  <SelectItem value="admin_demote">Admin Demote</SelectItem>
                  <SelectItem value="admin_create">Admin Create</SelectItem>
                  <SelectItem value="user_login">User Login</SelectItem>
                  <SelectItem value="user_logout">User Logout</SelectItem>
                  <SelectItem value="template_create">Template Create</SelectItem>
                  <SelectItem value="template_update">Template Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Resource</label>
              <Select value={resourceFilter} onValueChange={(value) => setResourceFilter(value as AuditResourceType | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Timeframe</label>
              <Select value={timeframe} onValueChange={(value) => setTimeframe(value as 'day' | 'week' | 'month')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Last Day</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={successFilter} onValueChange={(value) => setSuccessFilter(value as 'all' | 'success' | 'failed')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="success">Success Only</SelectItem>
                  <SelectItem value="failed">Failed Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Audit Logs
          </CardTitle>
          <CardDescription>
            Recent system activities and admin actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <Badge variant={getActionColor(log.action, log.success ?? true)}>
                          {log.action.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{log.resource_type}</span>
                          {log.resource_id && (
                            <span className="text-muted-foreground">
                              ID: {log.resource_id.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {log.admin_user_id && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Admin: {log.admin_user_id.slice(0, 8)}...
                            </span>
                          )}
                          {log.user_id && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              User: {log.user_id.slice(0, 8)}...
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.created_at || '').toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {log.success === false && (
                        <Badge variant="destructive" className="text-xs">
                          Failed
                        </Badge>
                      )}
                      {log.error_message && (
                        <span className="text-xs text-red-600 max-w-xs truncate">
                          {log.error_message}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No audit logs found matching your criteria.
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}