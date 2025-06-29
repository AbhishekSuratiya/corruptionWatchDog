import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, FileText, AlertTriangle, CheckCircle, Clock, 
  Search, Filter, Eye, Edit, Trash2, Download, RefreshCw,
  BarChart3, TrendingUp, UserCheck, Calendar, Mail, MapPin,
  Flag, ExternalLink, Settings, UserX, Ban, UserMinus, MoreVertical,
  Phone, Globe, Key, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { AdminDatabaseService, AdminUser, AdminReport, AdminStats } from '../lib/adminDatabase';
import { CORRUPTION_CATEGORIES } from '../lib/constants';
import GradientButton from '../components/UI/GradientButton';
import ModernInput from '../components/UI/ModernInput';
import FloatingCard from '../components/UI/FloatingCard';
import SkeletonLoader from '../components/UI/SkeletonLoader';
import AnimatedCounter from '../components/UI/AnimatedCounter';

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, adminLoading, user } = useAdmin();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'reports'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard state
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userFilters, setUserFilters] = useState({
    hasReports: undefined as boolean | undefined
  });

  // Reports state
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [reportsCount, setReportsCount] = useState(0);
  const [reportSearch, setReportSearch] = useState('');
  const [reportFilters, setReportFilters] = useState({
    category: '',
    status: '',
    isAnonymous: undefined as boolean | undefined
  });

  // User management state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showUserActions, setShowUserActions] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null);

  // Report management state
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [showReportActions, setShowReportActions] = useState(false);
  const [reportActionLoading, setReportActionLoading] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      loadData();
    }
  }, [adminLoading, isAdmin, activeTab, currentPage, userSearch, userFilters, reportSearch, reportFilters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (activeTab === 'dashboard') {
        const { data: statsData, error: statsError } = await AdminDatabaseService.getAdminStats();
        if (statsError) throw statsError;
        setStats(statsData);
      } else if (activeTab === 'users') {
        const { data: usersData, error: usersError, count } = await AdminDatabaseService.getAllUsers({
          search: userSearch,
          hasReports: userFilters.hasReports,
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage
        });
        if (usersError) throw usersError;
        setUsers(usersData || []);
        setUsersCount(count || 0);
      } else if (activeTab === 'reports') {
        const { data: reportsData, error: reportsError, count } = await AdminDatabaseService.getAllReports({
          search: reportSearch,
          category: reportFilters.category,
          status: reportFilters.status,
          isAnonymous: reportFilters.isAnonymous,
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage
        });
        if (reportsError) throw reportsError;
        setReports(reportsData || []);
        setReportsCount(count || 0);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await AdminDatabaseService.updateReportStatus(reportId, newStatus);
      if (error) throw error;
      
      // Refresh reports
      loadData();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await AdminDatabaseService.deleteReport(reportId);
      if (error) throw error;
      
      // Remove from selected if it was selected
      const newSelected = new Set(selectedReports);
      newSelected.delete(reportId);
      setSelectedReports(newSelected);
      setShowReportActions(newSelected.size > 0);
      
      // Refresh reports
      loadData();
    } catch (err) {
      console.error('Error deleting report:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete report');
    }
  };

  // User management functions
  const handleUserSelect = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setShowUserActions(newSelected.size > 0);
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
      setShowUserActions(false);
    } else {
      setSelectedUsers(new Set(users.map(user => user.id)));
      setShowUserActions(true);
    }
  };

  // Report management functions
  const handleReportSelect = (reportId: string) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId);
    } else {
      newSelected.add(reportId);
    }
    setSelectedReports(newSelected);
    setShowReportActions(newSelected.size > 0);
  };

  const handleSelectAllReports = () => {
    if (selectedReports.size === reports.length) {
      setSelectedReports(new Set());
      setShowReportActions(false);
    } else {
      setSelectedReports(new Set(reports.map(report => report.id)));
      setShowReportActions(true);
    }
  };

  const handleBulkDeleteReports = async () => {
    const selectedCount = selectedReports.size;
    if (!confirm(`Are you sure you want to delete ${selectedCount} selected report${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    try {
      setReportActionLoading('bulk-delete');
      
      // Delete reports one by one (could be optimized with a bulk delete API)
      let successCount = 0;
      let errorCount = 0;
      
      for (const reportId of selectedReports) {
        try {
          const { error } = await AdminDatabaseService.deleteReport(reportId);
          if (error) {
            console.error(`Error deleting report ${reportId}:`, error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`Error deleting report ${reportId}:`, err);
          errorCount++;
        }
      }
      
      // Show result message
      if (errorCount === 0) {
        setError(null);
        // Could show success message here if needed
      } else {
        setError(`Successfully deleted ${successCount} reports, but ${errorCount} failed to delete.`);
      }
      
      // Refresh reports list
      loadData();
      setSelectedReports(new Set());
      setShowReportActions(false);
      
    } catch (err) {
      console.error('Error bulk deleting reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete selected reports');
    } finally {
      setReportActionLoading(null);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    const selectedCount = selectedReports.size;
    if (!confirm(`Are you sure you want to update ${selectedCount} selected report${selectedCount !== 1 ? 's' : ''} to "${newStatus}" status?`)) {
      return;
    }

    try {
      setReportActionLoading('bulk-status');
      
      // Update reports one by one
      let successCount = 0;
      let errorCount = 0;
      
      for (const reportId of selectedReports) {
        try {
          const { error } = await AdminDatabaseService.updateReportStatus(reportId, newStatus);
          if (error) {
            console.error(`Error updating report ${reportId}:`, error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`Error updating report ${reportId}:`, err);
          errorCount++;
        }
      }
      
      // Show result message
      if (errorCount === 0) {
        setError(null);
        // Could show success message here if needed
      } else {
        setError(`Successfully updated ${successCount} reports, but ${errorCount} failed to update.`);
      }
      
      // Refresh reports list
      loadData();
      setSelectedReports(new Set());
      setShowReportActions(false);
      
    } catch (err) {
      console.error('Error bulk updating reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to update selected reports');
    } finally {
      setReportActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone and will remove all their data.`)) {
      return;
    }

    try {
      setUserActionLoading(userId);
      const { error } = await AdminDatabaseService.deleteUser(userId);
      if (error) throw error;
      
      // Refresh users list
      loadData();
      
      // Remove from selected if it was selected
      const newSelected = new Set(selectedUsers);
      newSelected.delete(userId);
      setSelectedUsers(newSelected);
      setShowUserActions(newSelected.size > 0);
      
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleBulkDeleteUsers = async () => {
    const selectedCount = selectedUsers.size;
    if (!confirm(`Are you sure you want to delete ${selectedCount} selected user${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    try {
      setUserActionLoading('bulk');
      
      // Delete users one by one (could be optimized with a bulk delete API)
      for (const userId of selectedUsers) {
        const { error } = await AdminDatabaseService.deleteUser(userId);
        if (error) {
          console.error(`Error deleting user ${userId}:`, error);
        }
      }
      
      // Refresh users list
      loadData();
      setSelectedUsers(new Set());
      setShowUserActions(false);
      
    } catch (err) {
      console.error('Error bulk deleting users:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete selected users');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleResetUserPassword = async (userId: string, userEmail: string) => {
    if (!confirm(`Send password reset email to "${userEmail}"?`)) {
      return;
    }

    try {
      setUserActionLoading(userId);
      const { error } = await AdminDatabaseService.resetUserPassword(userEmail);
      if (error) throw error;
      
      alert(`Password reset email sent to ${userEmail}`);
      
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err instanceof Error ? err.message : 'Failed to send password reset email');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleViewUser = (userId: string) => {
    navigate(`/admin/user/${userId}`);
  };

  // Access control
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <FloatingCard className="p-8 text-center max-w-md">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Admin access is restricted to users with @corruptionwatchdog.in email addresses.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Current user: {user?.email || 'Not logged in'}
          </p>
          <GradientButton onClick={() => window.location.href = '/'}>
            Go to Home
          </GradientButton>
        </FloatingCard>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disputed': return 'bg-red-100 text-red-800 border-red-200';
      case 'resolved': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalPages = Math.ceil((activeTab === 'users' ? usersCount : reportsCount) / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-6 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Responsive */}
        <div className="text-center mb-8 lg:mb-12 animate-fade-in-up">
          <div className="flex justify-center mb-6 lg:mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-pulse"></div>
              <div className="relative p-4 lg:p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl">
                <Shield className="h-8 w-8 lg:h-12 lg:w-12 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-4 lg:mb-6">
            Admin 
            <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent"> Dashboard</span>
          </h1>
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive admin panel for managing users, reports, and platform oversight.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Logged in as: <span className="font-medium text-purple-600">{user?.email}</span>
          </p>
        </div>

        {/* Navigation Tabs - Responsive */}
        <FloatingCard className="mb-6 lg:mb-8 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'reports', label: 'Reports', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setCurrentPage(1);
                  setSelectedUsers(new Set());
                  setShowUserActions(false);
                  setSelectedReports(new Set());
                  setShowReportActions(false);
                }}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 lg:px-6 py-3 lg:py-4 font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <tab.icon className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="text-sm lg:text-base">{tab.label}</span>
              </button>
            ))}
          </div>
        </FloatingCard>

        {/* Error Message */}
        {error && (
          <FloatingCard className="mb-6 lg:mb-8 bg-red-50 border-2 border-red-200">
            <div className="p-4 lg:p-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 lg:h-6 lg:w-6 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Error</h3>
                  <p className="text-red-700">{error}</p>
                  <button 
                    onClick={loadData}
                    className="mt-2 text-red-600 hover:text-red-800 font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </FloatingCard>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 lg:space-y-8">
            {/* Stats Grid - Responsive */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg p-4 lg:p-6 text-center">
                    <SkeletonLoader className="w-12 lg:w-16 h-6 lg:h-8 mx-auto mb-2" />
                    <SkeletonLoader className="w-16 lg:w-20 h-3 lg:h-4 mx-auto" />
                  </div>
                ))
              ) : stats ? (
                [
                  { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-blue-600' },
                  { label: 'Total Reports', value: stats.totalReports, icon: FileText, color: 'from-green-500 to-green-600' },
                  { label: 'Pending Reports', value: stats.pendingReports, icon: Clock, color: 'from-yellow-500 to-yellow-600' },
                  { label: 'Verified Reports', value: stats.verifiedReports, icon: CheckCircle, color: 'from-green-500 to-green-600' },
                  { label: 'Anonymous Reports', value: stats.anonymousReports, icon: Shield, color: 'from-purple-500 to-purple-600' },
                  { label: 'Disputed Reports', value: stats.disputedReports, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
                  { label: 'Users This Month', value: stats.usersThisMonth, icon: TrendingUp, color: 'from-indigo-500 to-indigo-600' },
                  { label: 'Reports This Month', value: stats.reportsThisMonth, icon: Calendar, color: 'from-orange-500 to-orange-600' }
                ].map((stat, index) => (
                  <FloatingCard key={index} delay={index * 100} className="p-4 lg:p-6 text-center group hover:scale-105 transition-transform duration-300">
                    <div className="flex justify-center mb-3 lg:mb-4">
                      <div className={`p-2 lg:p-4 rounded-xl lg:rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                        <stat.icon className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
                      </div>
                    </div>
                    <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1 lg:mb-2">
                      <AnimatedCounter end={stat.value} />
                    </div>
                    <div className="text-xs lg:text-sm text-gray-600 font-medium">{stat.label}</div>
                  </FloatingCard>
                ))
              ) : null}
            </div>

            {/* Quick Actions - Responsive */}
            <FloatingCard className="p-6 lg:p-8">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6 flex items-center">
                <Settings className="h-5 w-5 lg:h-6 lg:w-6 mr-3 text-purple-600" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <GradientButton
                  onClick={() => setActiveTab('users')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 p-4 lg:p-6 h-auto flex-col"
                >
                  <Users className="h-6 w-6 lg:h-8 lg:w-8 mb-2" />
                  <span className="text-base lg:text-lg font-semibold">Manage Users</span>
                  <span className="text-xs lg:text-sm opacity-90">View and manage all registered users</span>
                </GradientButton>
                
                <GradientButton
                  onClick={() => setActiveTab('reports')}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 p-4 lg:p-6 h-auto flex-col"
                >
                  <FileText className="h-6 w-6 lg:h-8 lg:w-8 mb-2" />
                  <span className="text-base lg:text-lg font-semibold">Review Reports</span>
                  <span className="text-xs lg:text-sm opacity-90">Moderate and verify corruption reports</span>
                </GradientButton>
                
                <GradientButton
                  onClick={loadData}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 p-4 lg:p-6 h-auto flex-col"
                >
                  <RefreshCw className="h-6 w-6 lg:h-8 lg:w-8 mb-2" />
                  <span className="text-base lg:text-lg font-semibold">Refresh Data</span>
                  <span className="text-xs lg:text-sm opacity-90">Update all statistics and data</span>
                </GradientButton>
              </div>
            </FloatingCard>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6 lg:space-y-8">
            {/* Users Filters - Responsive */}
            <FloatingCard className="p-4 lg:p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <ModernInput
                    placeholder="Search users by email, name, or ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    icon={<Search className="h-5 w-5" />}
                  />
                </div>
                <select
                  value={userFilters.hasReports === undefined ? '' : userFilters.hasReports.toString()}
                  onChange={(e) => setUserFilters(prev => ({
                    ...prev,
                    hasReports: e.target.value === '' ? undefined : e.target.value === 'true'
                  }))}
                  className="px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:border-purple-500 focus:outline-none focus:ring-0 transition-all duration-300 text-sm lg:text-base"
                >
                  <option value="">All Users</option>
                  <option value="true">Users with Reports</option>
                  <option value="false">Users without Reports</option>
                </select>
                <GradientButton onClick={loadData} disabled={isLoading} size="sm">
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden lg:inline">Refresh</span>
                </GradientButton>
              </div>
            </FloatingCard>

            {/* Bulk Actions Bar */}
            {showUserActions && (
              <FloatingCard className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-purple-700">
                      {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={() => {
                        setSelectedUsers(new Set());
                        setShowUserActions(false);
                      }}
                      className="text-sm text-purple-600 hover:text-purple-800"
                    >
                      Clear selection
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <GradientButton
                      size="sm"
                      onClick={handleBulkDeleteUsers}
                      disabled={userActionLoading === 'bulk'}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                    >
                      {userActionLoading === 'bulk' ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span className="hidden lg:inline">Delete Selected</span>
                    </GradientButton>
                  </div>
                </div>
              </FloatingCard>
            )}

            {/* Users List - Responsive */}
            <FloatingCard className="overflow-hidden">
              <div className="p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 lg:h-6 lg:w-6 mr-2 text-blue-600" />
                    Registered Users ({usersCount})
                  </h2>
                  <div className="flex items-center space-x-2">
                    {users.length > 0 && (
                      <label className="flex items-center space-x-2 text-xs lg:text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === users.length && users.length > 0}
                          onChange={handleSelectAllUsers}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="hidden lg:inline">Select All</span>
                      </label>
                    )}
                    <GradientButton size="sm" className="bg-gradient-to-r from-green-500 to-green-600">
                      <Download className="w-4 h-4" />
                      <span className="hidden lg:inline">Export</span>
                    </GradientButton>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="p-4 lg:p-6">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <SkeletonLoader key={index} variant="card" className="h-24 lg:h-32 mb-4" />
                  ))}
                </div>
              ) : users.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <div key={user.id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 lg:space-x-4 flex-1 min-w-0">
                          {/* Selection Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => handleUserSelect(user.id)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 flex-shrink-0"
                          />
                          
                          {/* User Avatar */}
                          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm lg:text-base flex-shrink-0">
                            {user.user_metadata.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </div>
                          
                          {/* User Info - Responsive */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm lg:text-lg font-semibold text-gray-900 truncate">
                              {user.user_metadata.full_name || 'No name provided'}
                            </h3>
                            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 text-xs lg:text-sm text-gray-500 space-y-1 lg:space-y-0">
                              <span className="flex items-center truncate">
                                <Mail className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                                Joined {new Date(user.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {user.last_sign_in_at && (
                              <div className="text-xs text-gray-400 mt-1">
                                Last active: {new Date(user.last_sign_in_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* User Actions - Icon Only with Tooltips */}
                        <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
                          {/* Report Count */}
                          <div className="text-center hidden lg:block">
                            <div className="text-xl lg:text-2xl font-bold text-blue-600">{user.report_count}</div>
                            <div className="text-xs text-gray-500">Reports</div>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="flex items-center space-x-2">
                            {user.email_confirmed_at ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <UserCheck className="h-3 w-3 mr-1" />
                                <span className="hidden lg:inline">Verified</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1" />
                                <span className="hidden lg:inline">Pending</span>
                              </span>
                            )}
                          </div>
                          
                          {/* Action Buttons - Icon Only with Hover Tooltips */}
                          <div className="flex items-center space-x-1 lg:space-x-2">
                            {/* View Button */}
                            <div className="relative group">
                              <button
                                onClick={() => handleViewUser(user.id)}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                View User Details
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                            
                            {/* Reset Password Button */}
                            <div className="relative group">
                              <button
                                onClick={() => handleResetUserPassword(user.id, user.email)}
                                disabled={userActionLoading === user.id}
                                className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
                              >
                                {userActionLoading === user.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Key className="w-4 h-4" />
                                )}
                              </button>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                Reset Password
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                            
                            {/* Delete Button */}
                            <div className="relative group">
                              <button
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                disabled={userActionLoading === user.id}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                              >
                                {userActionLoading === user.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                Delete User
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 lg:p-12 text-center">
                  <Users className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-700 mb-2">No Users Found</h3>
                  <p className="text-gray-500">No users match your current filters.</p>
                </div>
              )}
            </FloatingCard>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6 lg:space-y-8">
            {/* Reports Filters - Responsive */}
            <FloatingCard className="p-4 lg:p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <ModernInput
                    placeholder="Search reports by name, location, description..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    icon={<Search className="h-5 w-5" />}
                  />
                </div>
                <select
                  value={reportFilters.category}
                  onChange={(e) => setReportFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:border-purple-500 focus:outline-none focus:ring-0 transition-all duration-300 text-sm lg:text-base"
                >
                  <option value="">All Categories</option>
                  {Object.entries(CORRUPTION_CATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <select
                  value={reportFilters.status}
                  onChange={(e) => setReportFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:border-purple-500 focus:outline-none focus:ring-0 transition-all duration-300 text-sm lg:text-base"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="disputed">Disputed</option>
                  <option value="resolved">Resolved</option>
                </select>
                <GradientButton onClick={loadData} disabled={isLoading} size="sm">
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden lg:inline">Refresh</span>
                </GradientButton>
              </div>
            </FloatingCard>

            {/* Bulk Report Actions Bar */}
            {showReportActions && (
              <FloatingCard className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-green-700">
                      {selectedReports.size} report{selectedReports.size !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={() => {
                        setSelectedReports(new Set());
                        setShowReportActions(false);
                      }}
                      className="text-sm text-green-600 hover:text-green-800"
                    >
                      Clear selection
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Bulk Status Updates */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Update to:</span>
                      <button
                        onClick={() => handleBulkStatusUpdate('verified')}
                        disabled={reportActionLoading === 'bulk-status'}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm disabled:opacity-50"
                      >
                        Verified
                      </button>
                      <button
                        onClick={() => handleBulkStatusUpdate('disputed')}
                        disabled={reportActionLoading === 'bulk-status'}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm disabled:opacity-50"
                      >
                        Disputed
                      </button>
                      <button
                        onClick={() => handleBulkStatusUpdate('resolved')}
                        disabled={reportActionLoading === 'bulk-status'}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm disabled:opacity-50"
                      >
                        Resolved
                      </button>
                    </div>
                    
                    {/* Bulk Delete */}
                    <GradientButton
                      size="sm"
                      onClick={handleBulkDeleteReports}
                      disabled={reportActionLoading === 'bulk-delete'}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                    >
                      {reportActionLoading === 'bulk-delete' ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span className="hidden lg:inline">Delete Selected</span>
                    </GradientButton>
                  </div>
                </div>
              </FloatingCard>
            )}

            {/* Reports List - Responsive */}
            <FloatingCard className="overflow-hidden">
              <div className="p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 lg:h-6 lg:w-6 mr-2 text-green-600" />
                    Corruption Reports ({reportsCount})
                  </h2>
                  <div className="flex items-center space-x-2">
                    {reports.length > 0 && (
                      <label className="flex items-center space-x-2 text-xs lg:text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={selectedReports.size === reports.length && reports.length > 0}
                          onChange={handleSelectAllReports}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="hidden lg:inline">Select All</span>
                      </label>
                    )}
                    <GradientButton size="sm" className="bg-gradient-to-r from-green-500 to-green-600">
                      <Download className="w-4 h-4" />
                      <span className="hidden lg:inline">Export</span>
                    </GradientButton>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="p-4 lg:p-6">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <SkeletonLoader key={index} variant="card" className="h-24 lg:h-32 mb-4" />
                  ))}
                </div>
              ) : reports.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {reports.map((report) => (
                    <div key={report.id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          {/* Selection Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedReports.has(report.id)}
                            onChange={() => handleReportSelect(report.id)}
                            className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500 flex-shrink-0"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-4 mb-3">
                              <h3 className="text-base lg:text-lg font-semibold text-gray-900 truncate">
                                {report.corrupt_person_name}
                              </h3>
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                              </span>
                              {report.is_anonymous && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Anonymous
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-4 text-xs lg:text-sm text-gray-600 mb-3">
                              <div>
                                <span className="font-medium">Designation:</span> {report.designation}
                              </div>
                              <div>
                                <span className="font-medium">Location:</span> {report.area_region}
                              </div>
                              <div>
                                <span className="font-medium">Category:</span> {CORRUPTION_CATEGORIES[report.category as keyof typeof CORRUPTION_CATEGORIES]}
                              </div>
                            </div>
                            
                            <p className="text-sm lg:text-base text-gray-700 mb-3 line-clamp-2">
                              {report.description}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Reported: {new Date(report.created_at).toLocaleDateString()}</span>
                              {!report.is_anonymous && report.reporter_email && (
                                <span>By: {report.reporter_email}</span>
                              )}
                              <span>↑{report.upvotes}</span>
                              <span>↓{report.downvotes}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Report Actions - Icon Only with Tooltips */}
                        <div className="flex items-center space-x-1 lg:space-x-2 ml-4 flex-shrink-0">
                          <select
                            value={report.status}
                            onChange={(e) => handleStatusUpdate(report.id, e.target.value)}
                            className="text-xs lg:text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="disputed">Disputed</option>
                            <option value="resolved">Resolved</option>
                          </select>
                          
                          <div className="relative group">
                            <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              View Report Details
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                          </div>
                          
                          <div className="relative group">
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              Delete Report
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 lg:p-12 text-center">
                  <FileText className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-700 mb-2">No Reports Found</h3>
                  <p className="text-gray-500">No reports match your current filters.</p>
                </div>
              )}
            </FloatingCard>
          </div>
        )}

        {/* Pagination - Responsive */}
        {(activeTab === 'users' || activeTab === 'reports') && totalPages > 1 && (
          <FloatingCard className="p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
              <div className="text-xs lg:text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, activeTab === 'users' ? usersCount : reportsCount)} of {activeTab === 'users' ? usersCount : reportsCount} results
              </div>
              <div className="flex items-center space-x-2">
                <GradientButton
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-gradient-to-r from-gray-500 to-gray-600"
                >
                  Previous
                </GradientButton>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <GradientButton
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-gradient-to-r from-gray-500 to-gray-600"
                >
                  Next
                </GradientButton>
              </div>
            </div>
          </FloatingCard>
        )}
      </div>
    </div>
  );
}