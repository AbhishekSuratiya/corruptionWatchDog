import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, FileText, AlertTriangle, CheckCircle, Clock, 
  Search, Filter, Eye, Edit, Trash2, Download, RefreshCw,
  BarChart3, TrendingUp, UserCheck, Calendar, Mail, MapPin,
  Flag, ExternalLink, Settings, UserX, Ban, UserMinus, MoreVertical,
  Phone, Globe, Key, Lock
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { AdminDatabaseService, AdminUser, AdminReport, AdminStats } from '../lib/adminDatabase';
import { CORRUPTION_CATEGORIES } from '../lib/constants';
import GradientButton from '../components/UI/GradientButton';
import ModernInput from '../components/UI/ModernInput';
import FloatingCard from '../components/UI/FloatingCard';
import SkeletonLoader from '../components/UI/SkeletonLoader';
import AnimatedCounter from '../components/UI/AnimatedCounter';

export default function Admin() {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-pulse"></div>
              <div className="relative p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl">
                <Shield className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Admin 
            <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent"> Dashboard</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive admin panel for managing users, reports, and platform oversight.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Logged in as: <span className="font-medium text-purple-600">{user?.email}</span>
          </p>
        </div>

        {/* Navigation Tabs */}
        <FloatingCard className="mb-8 overflow-hidden">
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
                }}
                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </FloatingCard>

        {/* Error Message */}
        {error && (
          <FloatingCard className="mb-8 bg-red-50 border-2 border-red-200">
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
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
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center">
                    <SkeletonLoader className="w-16 h-8 mx-auto mb-2" />
                    <SkeletonLoader className="w-20 h-4 mx-auto" />
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
                  <FloatingCard key={index} delay={index * 100} className="p-6 text-center group hover:scale-105 transition-transform duration-300">
                    <div className="flex justify-center mb-4">
                      <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      <AnimatedCounter end={stat.value} />
                    </div>
                    <div className="text-gray-600 font-medium">{stat.label}</div>
                  </FloatingCard>
                ))
              ) : null}
            </div>

            {/* Quick Actions */}
            <FloatingCard className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Settings className="h-6 w-6 mr-3 text-purple-600" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GradientButton
                  onClick={() => setActiveTab('users')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 p-6 h-auto flex-col"
                >
                  <Users className="h-8 w-8 mb-2" />
                  <span className="text-lg font-semibold">Manage Users</span>
                  <span className="text-sm opacity-90">View and manage all registered users</span>
                </GradientButton>
                
                <GradientButton
                  onClick={() => setActiveTab('reports')}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 p-6 h-auto flex-col"
                >
                  <FileText className="h-8 w-8 mb-2" />
                  <span className="text-lg font-semibold">Review Reports</span>
                  <span className="text-sm opacity-90">Moderate and verify corruption reports</span>
                </GradientButton>
                
                <GradientButton
                  onClick={loadData}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 p-6 h-auto flex-col"
                >
                  <RefreshCw className="h-8 w-8 mb-2" />
                  <span className="text-lg font-semibold">Refresh Data</span>
                  <span className="text-sm opacity-90">Update all statistics and data</span>
                </GradientButton>
              </div>
            </FloatingCard>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            {/* Users Filters */}
            <FloatingCard className="p-6">
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
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:border-purple-500 focus:outline-none focus:ring-0 transition-all duration-300"
                >
                  <option value="">All Users</option>
                  <option value="true">Users with Reports</option>
                  <option value="false">Users without Reports</option>
                </select>
                <GradientButton onClick={loadData} disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
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
                      <span>Delete Selected</span>
                    </GradientButton>
                  </div>
                </div>
              </FloatingCard>
            )}

            {/* Users List */}
            <FloatingCard className="overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Users className="h-6 w-6 mr-2 text-blue-600" />
                    Registered Users ({usersCount})
                  </h2>
                  <div className="flex items-center space-x-2">
                    {users.length > 0 && (
                      <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === users.length && users.length > 0}
                          onChange={handleSelectAllUsers}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span>Select All</span>
                      </label>
                    )}
                    <GradientButton size="sm" className="bg-gradient-to-r from-green-500 to-green-600">
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </GradientButton>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="p-6">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-4">
                        <SkeletonLoader variant="circular" className="w-12 h-12" />
                        <div>
                          <SkeletonLoader className="w-48 h-4 mb-2" />
                          <SkeletonLoader className="w-32 h-3" />
                        </div>
                      </div>
                      <SkeletonLoader className="w-20 h-8" />
                    </div>
                  ))}
                </div>
              ) : users.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Selection Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => handleUserSelect(user.id)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          
                          {/* User Avatar */}
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                            {user.user_metadata.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </div>
                          
                          {/* User Info */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {user.user_metadata.full_name || 'No name provided'}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Mail className="h-4 w-4 mr-1" />
                                {user.email}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Joined {new Date(user.created_at).toLocaleDateString()}
                              </span>
                              {user.user_metadata.location && (
                                <span className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {user.user_metadata.location}
                                </span>
                              )}
                              {user.user_metadata.phone && (
                                <span className="flex items-center">
                                  <Phone className="h-4 w-4 mr-1" />
                                  {user.user_metadata.phone}
                                </span>
                              )}
                            </div>
                            {user.last_sign_in_at && (
                              <div className="text-xs text-gray-400 mt-1">
                                Last active: {new Date(user.last_sign_in_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* User Actions */}
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{user.report_count}</div>
                            <div className="text-xs text-gray-500">Reports</div>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="flex items-center space-x-2">
                            {user.email_confirmed_at ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </span>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            <GradientButton 
                              size="sm" 
                              className="bg-gradient-to-r from-blue-500 to-blue-600"
                              onClick={() => window.open(`/admin/user/${user.id}`, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </GradientButton>
                            
                            <GradientButton 
                              size="sm" 
                              className="bg-gradient-to-r from-orange-500 to-orange-600"
                              onClick={() => handleResetUserPassword(user.id, user.email)}
                              disabled={userActionLoading === user.id}
                            >
                              {userActionLoading === user.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Key className="w-4 h-4" />
                              )}
                              <span>Reset</span>
                            </GradientButton>
                            
                            <GradientButton 
                              size="sm" 
                              variant="danger"
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              disabled={userActionLoading === user.id}
                              className="bg-gradient-to-r from-red-500 to-red-600"
                            >
                              {userActionLoading === user.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              <span>Delete</span>
                            </GradientButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Users Found</h3>
                  <p className="text-gray-500">No users match your current filters.</p>
                </div>
              )}
            </FloatingCard>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            {/* Reports Filters */}
            <FloatingCard className="p-6">
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
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:border-purple-500 focus:outline-none focus:ring-0 transition-all duration-300"
                >
                  <option value="">All Categories</option>
                  {Object.entries(CORRUPTION_CATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <select
                  value={reportFilters.status}
                  onChange={(e) => setReportFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:border-purple-500 focus:outline-none focus:ring-0 transition-all duration-300"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="disputed">Disputed</option>
                  <option value="resolved">Resolved</option>
                </select>
                <GradientButton onClick={loadData} disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </GradientButton>
              </div>
            </FloatingCard>

            {/* Reports List */}
            <FloatingCard className="overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center justify-between">
                  <span className="flex items-center">
                    <FileText className="h-6 w-6 mr-2 text-green-600" />
                    Corruption Reports ({reportsCount})
                  </span>
                  <GradientButton size="sm" className="bg-gradient-to-r from-green-500 to-green-600">
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </GradientButton>
                </h2>
              </div>

              {isLoading ? (
                <div className="p-6">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <SkeletonLoader key={index} variant="card" className="h-32 mb-4" />
                  ))}
                </div>
              ) : reports.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {reports.map((report) => (
                    <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
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
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
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
                          
                          <p className="text-gray-700 mb-3 line-clamp-2">
                            {report.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Reported: {new Date(report.created_at).toLocaleDateString()}</span>
                            {!report.is_anonymous && report.reporter_email && (
                              <span>By: {report.reporter_email}</span>
                            )}
                            <span>Upvotes: {report.upvotes}</span>
                            <span>Downvotes: {report.downvotes}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <select
                            value={report.status}
                            onChange={(e) => handleStatusUpdate(report.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="disputed">Disputed</option>
                            <option value="resolved">Resolved</option>
                          </select>
                          
                          <GradientButton size="sm" className="bg-gradient-to-r from-blue-500 to-blue-600">
                            <Eye className="w-4 h-4" />
                          </GradientButton>
                          
                          <GradientButton 
                            size="sm" 
                            variant="danger"
                            onClick={() => handleDeleteReport(report.id)}
                            className="bg-gradient-to-r from-red-500 to-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </GradientButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reports Found</h3>
                  <p className="text-gray-500">No reports match your current filters.</p>
                </div>
              )}
            </FloatingCard>
          </div>
        )}

        {/* Pagination */}
        {(activeTab === 'users' || activeTab === 'reports') && totalPages > 1 && (
          <FloatingCard className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
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