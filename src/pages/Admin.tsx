import React, { useState, useEffect } from 'react';
import { 
  Users, FileText, TrendingUp, AlertTriangle, Search, Filter, 
  Download, Trash2, Eye, Edit, CheckCircle, XCircle, Clock, 
  Shield, RefreshCw, MoreVertical, Check, X, ChevronDown,
  UserCheck, Calendar, Mail, MapPin, Settings, Plus
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { AdminDatabaseService, AdminUser, AdminReport, AdminStats } from '../lib/adminDatabase';
import { CORRUPTION_CATEGORIES } from '../lib/constants';
import GradientButton from '../components/UI/GradientButton';
import FloatingCard from '../components/UI/FloatingCard';
import SkeletonLoader from '../components/UI/SkeletonLoader';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { isAdmin, adminLoading } = useAdmin();
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Loading states
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Filter states
  const [userFilters, setUserFilters] = useState({
    search: '',
    hasReports: undefined as boolean | undefined,
    limit: 50,
    offset: 0
  });
  
  const [reportFilters, setReportFilters] = useState({
    search: '',
    category: '',
    status: '',
    isAnonymous: undefined as boolean | undefined,
    limit: 50,
    offset: 0
  });
  
  // Error and success states
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load initial data
  useEffect(() => {
    if (!adminLoading && isAdmin) {
      loadStats();
      if (activeTab === 'users') {
        loadUsers();
      } else if (activeTab === 'reports') {
        loadReports();
      }
    }
  }, [adminLoading, isAdmin, activeTab]);

  // Load stats
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      setError(null);
      
      const { data, error } = await AdminDatabaseService.getAdminStats();
      if (error) throw error;
      
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  // Load users
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      setError(null);
      
      const { data, error } = await AdminDatabaseService.getAllUsers(userFilters);
      if (error) throw error;
      
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  // Load reports
  const loadReports = async () => {
    try {
      setReportsLoading(true);
      setError(null);
      
      const { data, error } = await AdminDatabaseService.getAllReports(reportFilters);
      if (error) throw error;
      
      setReports(data || []);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  };

  // Handle single report deletion
  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(`delete-${reportId}`);
      console.log('Attempting to delete report:', reportId);
      
      const { error } = await AdminDatabaseService.deleteReport(reportId);
      
      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      console.log('Report deleted successfully');
      setMessage({
        type: 'success',
        text: 'Report deleted successfully!'
      });
      
      // Refresh reports list
      await loadReports();
      
      // Clear selection if this report was selected
      setSelectedReports(prev => prev.filter(id => id !== reportId));
      
    } catch (err) {
      console.error('Error deleting report:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete report'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle bulk report deletion
  const handleBulkDeleteReports = async () => {
    if (selectedReports.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please select reports to delete'
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedReports.length} selected reports? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading('bulk-delete');
      console.log('Attempting to bulk delete reports:', selectedReports);
      
      const result = await AdminDatabaseService.bulkDeleteReports(selectedReports);
      
      if (result.error) {
        console.error('Bulk delete error:', result.error);
        throw result.error;
      }

      console.log('Bulk delete result:', result);
      
      if (result.success > 0) {
        setMessage({
          type: 'success',
          text: `Successfully deleted ${result.success} reports!`
        });
        
        // Clear selection
        setSelectedReports([]);
        
        // Refresh reports list
        await loadReports();
      }
      
      if (result.failed > 0) {
        setMessage({
          type: 'error',
          text: `Failed to delete ${result.failed} reports. ${result.errors.join(', ')}`
        });
      }
      
    } catch (err) {
      console.error('Error bulk deleting reports:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete reports'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedReports.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please select reports to update'
      });
      return;
    }

    try {
      setActionLoading(`bulk-status-${status}`);
      console.log('Attempting to bulk update status:', { reportIds: selectedReports, status });
      
      const result = await AdminDatabaseService.bulkUpdateReportStatus(selectedReports, status);
      
      if (result.error) {
        console.error('Bulk status update error:', result.error);
        throw result.error;
      }

      console.log('Bulk status update result:', result);
      
      if (result.success > 0) {
        setMessage({
          type: 'success',
          text: `Successfully updated ${result.success} reports to ${status}!`
        });
        
        // Clear selection
        setSelectedReports([]);
        
        // Refresh reports list
        await loadReports();
      }
      
      if (result.failed > 0) {
        setMessage({
          type: 'error',
          text: `Failed to update ${result.failed} reports. ${result.errors.join(', ')}`
        });
      }
      
    } catch (err) {
      console.error('Error bulk updating status:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update reports'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle export functionality
  const handleExportReports = async () => {
    try {
      setActionLoading('export');
      console.log('Exporting reports...');
      
      // Get all reports for export (no pagination)
      const { data: allReports, error } = await AdminDatabaseService.getAllReports({
        ...reportFilters,
        limit: 10000, // Large number to get all reports
        offset: 0
      });
      
      if (error) throw error;
      
      if (!allReports || allReports.length === 0) {
        setMessage({
          type: 'error',
          text: 'No reports to export'
        });
        return;
      }

      // Convert to CSV
      const headers = [
        'ID', 'Corrupt Person', 'Designation', 'Area/Region', 'Category', 
        'Description', 'Status', 'Anonymous', 'Reporter Email', 'Created At',
        'Upvotes', 'Downvotes', 'Dispute Count'
      ];
      
      const csvContent = [
        headers.join(','),
        ...allReports.map(report => [
          report.id,
          `"${report.corrupt_person_name.replace(/"/g, '""')}"`,
          `"${report.designation.replace(/"/g, '""')}"`,
          `"${report.area_region.replace(/"/g, '""')}"`,
          report.category,
          `"${report.description.replace(/"/g, '""').substring(0, 100)}..."`,
          report.status,
          report.is_anonymous ? 'Yes' : 'No',
          report.reporter_email || 'N/A',
          new Date(report.created_at).toLocaleDateString(),
          report.upvotes,
          report.downvotes,
          report.dispute_count
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `corruption_reports_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMessage({
        type: 'success',
        text: `Successfully exported ${allReports.length} reports!`
      });
      
    } catch (err) {
      console.error('Error exporting reports:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to export reports'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle export users
  const handleExportUsers = async () => {
    try {
      setActionLoading('export-users');
      console.log('Exporting users...');
      
      // Get all users for export
      const { data: allUsers, error } = await AdminDatabaseService.getAllUsers({
        ...userFilters,
        limit: 10000,
        offset: 0
      });
      
      if (error) throw error;
      
      if (!allUsers || allUsers.length === 0) {
        setMessage({
          type: 'error',
          text: 'No users to export'
        });
        return;
      }

      // Convert to CSV
      const headers = [
        'ID', 'Email', 'Full Name', 'Phone', 'Location', 'Report Count',
        'Email Confirmed', 'Created At', 'Last Sign In'
      ];
      
      const csvContent = [
        headers.join(','),
        ...allUsers.map(user => [
          user.id,
          user.email,
          `"${user.user_metadata.full_name || 'N/A'}"`,
          user.user_metadata.phone || 'N/A',
          `"${user.user_metadata.location || 'N/A'}"`,
          user.report_count,
          user.email_confirmed_at ? 'Yes' : 'No',
          new Date(user.created_at).toLocaleDateString(),
          user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMessage({
        type: 'success',
        text: `Successfully exported ${allUsers.length} users!`
      });
      
    } catch (err) {
      console.error('Error exporting users:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to export users'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle report selection
  const handleReportSelection = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  // Handle select all reports
  const handleSelectAllReports = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(r => r.id));
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disputed': return 'bg-red-100 text-red-800 border-red-200';
      case 'resolved': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Access control
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
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
          <p className="text-gray-600 mb-4">Admin access required to view this page.</p>
          <GradientButton onClick={() => navigate('/')}>
            Go to Home
          </GradientButton>
        </FloatingCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-pulse"></div>
              <div className="relative p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl">
                <Settings className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Admin 
            <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent"> Dashboard</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Manage users, reports, and monitor platform activity
          </p>
        </div>

        {/* Message */}
        {message && (
          <FloatingCard className={`mb-8 ${
            message.type === 'success' 
              ? 'bg-green-50 border-2 border-green-200' 
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            <div className="p-6">
              <div className="flex items-center space-x-3">
                {message.type === 'success' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
                <p className={`font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          </FloatingCard>
        )}

        {/* Error */}
        {error && (
          <FloatingCard className="mb-8 bg-red-50 border-2 border-red-200">
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <p className="font-medium text-red-800">{error}</p>
              </div>
            </div>
          </FloatingCard>
        )}

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
            <div className="flex space-x-2">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'reports', label: 'Reports', icon: FileText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center">
                    <SkeletonLoader className="w-16 h-8 mx-auto mb-2" />
                    <SkeletonLoader className="w-20 h-4 mx-auto" />
                  </div>
                ))
              ) : stats ? (
                <>
                  <FloatingCard className="p-6 text-center group hover:scale-105 transition-transform duration-300">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalUsers}</div>
                    <div className="text-gray-600 font-medium">Total Users</div>
                  </FloatingCard>

                  <FloatingCard className="p-6 text-center group hover:scale-105 transition-transform duration-300">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-red-600 mb-2">{stats.totalReports}</div>
                    <div className="text-gray-600 font-medium">Total Reports</div>
                  </FloatingCard>

                  <FloatingCard className="p-6 text-center group hover:scale-105 transition-transform duration-300">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-green-600 mb-2">{stats.verifiedReports}</div>
                    <div className="text-gray-600 font-medium">Verified Reports</div>
                  </FloatingCard>

                  <FloatingCard className="p-6 text-center group hover:scale-105 transition-transform duration-300">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.pendingReports}</div>
                    <div className="text-gray-600 font-medium">Pending Reports</div>
                  </FloatingCard>

                  <FloatingCard className="p-6 text-center group hover:scale-105 transition-transform duration-300">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-purple-600 mb-2">{stats.anonymousReports}</div>
                    <div className="text-gray-600 font-medium">Anonymous Reports</div>
                  </FloatingCard>

                  <FloatingCard className="p-6 text-center group hover:scale-105 transition-transform duration-300">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <XCircle className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-orange-600 mb-2">{stats.disputedReports}</div>
                    <div className="text-gray-600 font-medium">Disputed Reports</div>
                  </FloatingCard>

                  <FloatingCard className="p-6 text-center group hover:scale-105 transition-transform duration-300">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-teal-600 mb-2">{stats.reportsThisMonth}</div>
                    <div className="text-gray-600 font-medium">Reports This Month</div>
                  </FloatingCard>

                  <FloatingCard className="p-6 text-center group hover:scale-105 transition-transform duration-300">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <UserCheck className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-indigo-600 mb-2">{stats.usersThisMonth}</div>
                    <div className="text-gray-600 font-medium">New Users This Month</div>
                  </FloatingCard>
                </>
              ) : (
                <div className="col-span-full text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Failed to load statistics</p>
                  <GradientButton onClick={loadStats} className="mt-4">
                    Retry
                  </GradientButton>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Users Controls */}
            <FloatingCard className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userFilters.search}
                      onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <select
                    value={userFilters.hasReports === undefined ? '' : userFilters.hasReports.toString()}
                    onChange={(e) => setUserFilters(prev => ({ 
                      ...prev, 
                      hasReports: e.target.value === '' ? undefined : e.target.value === 'true' 
                    }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">All Users</option>
                    <option value="true">With Reports</option>
                    <option value="false">Without Reports</option>
                  </select>
                </div>
                
                <div className="flex space-x-2">
                  <GradientButton
                    onClick={handleExportUsers}
                    isLoading={actionLoading === 'export-users'}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Users</span>
                  </GradientButton>
                  
                  <GradientButton onClick={loadUsers} isLoading={usersLoading}>
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </GradientButton>
                </div>
              </div>
            </FloatingCard>

            {/* Users Table */}
            <FloatingCard className="overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                <h2 className="text-xl font-semibold text-gray-900">Users Management</h2>
              </div>
              
              {usersLoading ? (
                <div className="p-6">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-b-0">
                      <SkeletonLoader className="w-64 h-4" />
                      <SkeletonLoader className="w-32 h-8" />
                    </div>
                  ))}
                </div>
              ) : users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reports</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                {(user.user_metadata.full_name || user.email).charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.user_metadata.full_name || 'No name'}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {user.report_count} reports
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.email_confirmed_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.email_confirmed_at ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <GradientButton
                              onClick={() => navigate(`/admin/user/${user.id}`)}
                              size="sm"
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </GradientButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
          <div className="space-y-6">
            {/* Reports Controls */}
            <FloatingCard className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={reportFilters.search}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <select
                    value={reportFilters.status}
                    onChange={(e) => setReportFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="disputed">Disputed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  
                  <select
                    value={reportFilters.category}
                    onChange={(e) => setReportFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">All Categories</option>
                    {Object.entries(CORRUPTION_CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex space-x-2">
                  <GradientButton
                    onClick={handleExportReports}
                    isLoading={actionLoading === 'export'}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </GradientButton>
                  
                  <GradientButton onClick={loadReports} isLoading={reportsLoading}>
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </GradientButton>
                </div>
              </div>
            </FloatingCard>

            {/* Bulk Actions */}
            {selectedReports.length > 0 && (
              <FloatingCard className="p-4 bg-blue-50 border-2 border-blue-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-blue-800">
                      {selectedReports.length} report{selectedReports.length !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={() => setSelectedReports([])}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Clear selection
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <GradientButton
                      onClick={() => handleBulkStatusUpdate('verified')}
                      isLoading={actionLoading === 'bulk-status-verified'}
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Verify</span>
                    </GradientButton>
                    
                    <GradientButton
                      onClick={() => handleBulkStatusUpdate('disputed')}
                      isLoading={actionLoading === 'bulk-status-disputed'}
                      size="sm"
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Dispute</span>
                    </GradientButton>
                    
                    <GradientButton
                      onClick={() => handleBulkStatusUpdate('resolved')}
                      isLoading={actionLoading === 'bulk-status-resolved'}
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Resolve</span>
                    </GradientButton>
                    
                    <GradientButton
                      onClick={handleBulkDeleteReports}
                      isLoading={actionLoading === 'bulk-delete'}
                      size="sm"
                      variant="danger"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </GradientButton>
                  </div>
                </div>
              </FloatingCard>
            )}

            {/* Reports Table */}
            <FloatingCard className="overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Reports Management</h2>
                  {reports.length > 0 && (
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedReports.length === reports.length}
                        onChange={handleSelectAllReports}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-600">Select All</span>
                    </label>
                  )}
                </div>
              </div>
              
              {reportsLoading ? (
                <div className="p-6">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-b-0">
                      <SkeletonLoader className="w-64 h-4" />
                      <SkeletonLoader className="w-32 h-8" />
                    </div>
                  ))}
                </div>
              ) : reports.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {reports.map((report) => (
                    <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedReports.includes(report.id)}
                          onChange={() => handleReportSelection(report.id)}
                          className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        
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
                            <span>Upvotes: {report.upvotes}</span>
                            <span>Downvotes: {report.downvotes}</span>
                            {!report.is_anonymous && report.reporter_email && (
                              <span>Reporter: {report.reporter_email}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <GradientButton
                            onClick={() => handleDeleteReport(report.id)}
                            isLoading={actionLoading === `delete-${report.id}`}
                            size="sm"
                            variant="danger"
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
      </div>
    </div>
  );
}