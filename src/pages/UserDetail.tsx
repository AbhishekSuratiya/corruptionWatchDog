import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Calendar, Shield, Edit3, Save, X, AlertCircle, CheckCircle, 
  FileText, MapPin, Phone, Globe, Key, Trash2, ArrowLeft, Settings,
  UserCheck, Clock, Ban, UserX, RefreshCw, Eye, Download
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { AdminDatabaseService, AdminUser, AdminReport } from '../lib/adminDatabase';
import { CORRUPTION_CATEGORIES } from '../lib/constants';
import GradientButton from '../components/UI/GradientButton';
import ModernInput from '../components/UI/ModernInput';
import FloatingCard from '../components/UI/FloatingCard';
import SkeletonLoader from '../components/UI/SkeletonLoader';

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isAdmin, adminLoading } = useAdmin();
  
  const [user, setUser] = useState<AdminUser | null>(null);
  const [userReports, setUserReports] = useState<AdminReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [editData, setEditData] = useState({
    full_name: '',
    phone: '',
    location: ''
  });

  useEffect(() => {
    if (!adminLoading && isAdmin && userId) {
      loadUserData();
    }
  }, [adminLoading, isAdmin, userId]);

  const loadUserData = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get user details
      const { data: usersData, error: usersError } = await AdminDatabaseService.getAllUsers({
        search: userId,
        limit: 1
      });

      if (usersError) throw usersError;

      const foundUser = usersData?.find(u => u.id === userId);
      if (!foundUser) {
        throw new Error('User not found');
      }

      setUser(foundUser);
      setEditData({
        full_name: foundUser.user_metadata.full_name || '',
        phone: foundUser.user_metadata.phone || '',
        location: foundUser.user_metadata.location || ''
      });

      // Get user's reports
      if (foundUser.email) {
        const { data: reportsData, error: reportsError } = await AdminDatabaseService.getReportsByUser(foundUser.email);
        if (reportsError) {
          console.warn('Error fetching user reports:', reportsError);
          setUserReports([]);
        } else {
          setUserReports(reportsData || []);
        }
      }

    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setMessage(null);

      const { error } = await AdminDatabaseService.updateUserMetadata(user.id, editData);
      if (error) throw error;

      // Update local user data
      setUser(prev => prev ? {
        ...prev,
        user_metadata: {
          ...prev.user_metadata,
          ...editData
        }
      } : null);

      setMessage({
        type: 'success',
        text: 'User details updated successfully!'
      });
      setIsEditing(false);

    } catch (err) {
      console.error('Error updating user:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update user'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditData({
        full_name: user.user_metadata.full_name || '',
        phone: user.user_metadata.phone || '',
        location: user.user_metadata.location || ''
      });
    }
    setIsEditing(false);
    setMessage(null);
  };

  const handleResetPassword = async () => {
    if (!user || !confirm(`Send password reset email to "${user.email}"?`)) {
      return;
    }

    try {
      setActionLoading('reset');
      const { error } = await AdminDatabaseService.resetUserPassword(user.email);
      if (error) throw error;

      setMessage({
        type: 'success',
        text: `Password reset email sent to ${user.email}`
      });

    } catch (err) {
      console.error('Error resetting password:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to send password reset email'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!user || !confirm(`Are you sure you want to delete user "${user.email}"? This action cannot be undone and will remove all their data.`)) {
      return;
    }

    try {
      setActionLoading('delete');
      const { error } = await AdminDatabaseService.deleteUser(user.id);
      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'User deleted successfully. Redirecting...'
      });

      // Redirect to admin page after 2 seconds
      setTimeout(() => {
        navigate('/admin');
      }, 2000);

    } catch (err) {
      console.error('Error deleting user:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete user'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const name = user.user_metadata.full_name || user.email?.split('@')[0] || 'User';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

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
          <p className="text-gray-600">Loading...</p>
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
          <p className="text-gray-600 mb-4">Admin access required to view user details.</p>
          <GradientButton onClick={() => navigate('/')}>
            Go to Home
          </GradientButton>
        </FloatingCard>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SkeletonLoader className="w-full h-96 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonLoader className="w-full h-64" />
            <SkeletonLoader className="w-full h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <FloatingCard className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'User not found'}</p>
          <div className="space-y-2">
            <GradientButton onClick={loadUserData}>
              Try Again
            </GradientButton>
            <GradientButton variant="secondary" onClick={() => navigate('/admin')}>
              Back to Admin
            </GradientButton>
          </div>
        </FloatingCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Admin Dashboard"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
              <p className="text-gray-600">Manage user account and view activity</p>
            </div>
          </div>

          {/* Action Buttons with Tooltips */}
          <div className="flex items-center space-x-2">
            <div className="relative group">
              <button
                onClick={handleResetPassword}
                disabled={actionLoading === 'reset'}
                className="p-3 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'reset' ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Key className="w-5 h-5" />
                )}
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Reset Password
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </div>

            <div className="relative group">
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading === 'delete'}
                className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'delete' ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Delete User
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </div>

            <div className="relative group">
              <button
                onClick={loadUserData}
                className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Refresh Data
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </div>
          </div>
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
                  <AlertCircle className="h-6 w-6 text-red-600" />
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <div className="lg:col-span-2">
            <FloatingCard className="overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                      {getUserInitials()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {user.user_metadata.full_name || 'No name provided'}
                      </h2>
                      <p className="text-blue-100">{user.email}</p>
                      <div className="flex items-center mt-2">
                        {user.email_confirmed_at ? (
                          <>
                            <UserCheck className="h-4 w-4 mr-2 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">Verified Account</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 mr-2 text-yellow-400" />
                            <span className="text-yellow-400 text-sm font-medium">Pending Verification</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {!isEditing ? (
                    <div className="relative group">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 rounded-xl transition-colors"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Edit Profile
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="relative group">
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50"
                        >
                          {isSaving ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <Save className="w-5 h-5" />
                          )}
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          Save Changes
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                      </div>
                      <div className="relative group">
                        <button
                          onClick={handleCancel}
                          className="p-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 rounded-xl transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          Cancel
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Form */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Personal Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      Personal Information
                    </h3>
                    
                    <ModernInput
                      label="Full Name"
                      value={isEditing ? editData.full_name : (user.user_metadata.full_name || '')}
                      onChange={(e) => setEditData(prev => ({ ...prev, full_name: e.target.value }))}
                      icon={<User className="h-5 w-5" />}
                      disabled={!isEditing}
                      placeholder="Enter full name"
                    />

                    <ModernInput
                      label="Email Address"
                      value={user.email}
                      icon={<Mail className="h-5 w-5" />}
                      disabled={true}
                      helperText="Email cannot be changed"
                    />

                    <ModernInput
                      label="Phone Number"
                      value={isEditing ? editData.phone : (user.user_metadata.phone || '')}
                      onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                      icon={<Phone className="h-5 w-5" />}
                      disabled={!isEditing}
                      placeholder="Enter phone number"
                    />

                    <ModernInput
                      label="Location"
                      value={isEditing ? editData.location : (user.user_metadata.location || '')}
                      onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                      icon={<MapPin className="h-5 w-5" />}
                      disabled={!isEditing}
                      placeholder="Enter location"
                    />
                  </div>

                  {/* Account Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      Account Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-900">Member Since</p>
                            <p className="text-sm text-gray-500">
                              {new Date(user.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium text-gray-900">Account Status</p>
                            <p className={`text-sm ${user.email_confirmed_at ? 'text-green-600' : 'text-yellow-600'}`}>
                              {user.email_confirmed_at ? 'Verified' : 'Pending Verification'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium text-gray-900">Reports Submitted</p>
                            <p className="text-sm text-blue-600">{user.report_count} reports</p>
                          </div>
                        </div>
                      </div>

                      {user.last_sign_in_at && (
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <Clock className="h-5 w-5 text-purple-500" />
                            <div>
                              <p className="font-medium text-gray-900">Last Sign In</p>
                              <p className="text-sm text-purple-600">
                                {new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </FloatingCard>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <FloatingCard className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 rounded-2xl">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{user.report_count}</div>
              <div className="text-gray-600 font-medium">Total Reports</div>
            </FloatingCard>

            <FloatingCard className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 rounded-2xl">
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="text-lg font-bold text-green-600 mb-2">
                {user.email_confirmed_at ? 'Verified' : 'Unverified'}
              </div>
              <div className="text-gray-600 font-medium">Account Status</div>
            </FloatingCard>

            <FloatingCard className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-purple-100 rounded-2xl">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="text-lg font-bold text-purple-600 mb-2">
                {Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
              </div>
              <div className="text-gray-600 font-medium">Member Duration</div>
            </FloatingCard>
          </div>
        </div>

        {/* User Reports */}
        <div className="mt-8">
          <FloatingCard className="overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileText className="h-6 w-6 mr-2 text-green-600" />
                  User's Corruption Reports ({userReports.length})
                </h2>
                <div className="relative group">
                  <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Export Reports
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                </div>
              </div>
            </div>

            {userReports.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {userReports.map((report) => (
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
                          <span>Upvotes: {report.upvotes}</span>
                          <span>Downvotes: {report.downvotes}</span>
                        </div>
                      </div>
                      
                      <div className="relative group ml-4">
                        <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                          <Eye className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          View Report
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reports Found</h3>
                <p className="text-gray-500">This user hasn't submitted any corruption reports yet.</p>
              </div>
            )}
          </FloatingCard>
        </div>
      </div>
    </div>
  );
}