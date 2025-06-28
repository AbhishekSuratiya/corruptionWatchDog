import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Shield, Edit3, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import GradientButton from '../components/UI/GradientButton';
import ModernInput from '../components/UI/ModernInput';
import FloatingCard from '../components/UI/FloatingCard';

export default function Profile() {
  const { user, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        location: user.user_metadata?.location || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name,
          phone: profileData.phone,
          location: profileData.location
        }
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Profile updated successfully!'
      });
      setIsEditing(false);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update profile'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    if (user) {
      setProfileData({
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        location: user.user_metadata?.location || ''
      });
    }
    setIsEditing(false);
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <FloatingCard className="p-8 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please sign in to view your profile.</p>
          <GradientButton onClick={() => window.location.href = '/'}>
            Go to Home
          </GradientButton>
        </FloatingCard>
      </div>
    );
  }

  const getUserInitials = () => {
    const name = profileData.full_name || user.email?.split('@')[0] || 'User';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-pulse"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl flex items-center justify-center text-white text-2xl font-bold">
                {getUserInitials()}
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Your 
            <span className="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent"> Profile</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Manage your account settings and personal information
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

        {/* Profile Card */}
        <FloatingCard className="overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white text-xl font-bold">
                  {getUserInitials()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{profileData.full_name || 'User'}</h2>
                  <p className="text-red-100">{profileData.email}</p>
                </div>
              </div>
              
              {!isEditing ? (
                <GradientButton
                  onClick={() => setIsEditing(true)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </GradientButton>
              ) : (
                <div className="flex space-x-2">
                  <GradientButton
                    onClick={handleSave}
                    isLoading={isSaving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </GradientButton>
                  <GradientButton
                    onClick={handleCancel}
                    variant="secondary"
                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </GradientButton>
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
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                  icon={<User className="h-5 w-5" />}
                  disabled={!isEditing}
                  placeholder="Enter your full name"
                />

                <ModernInput
                  label="Email Address"
                  value={profileData.email}
                  icon={<Mail className="h-5 w-5" />}
                  disabled={true}
                  helperText="Email cannot be changed. Contact support if needed."
                />

                <ModernInput
                  label="Phone Number"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Enter your phone number"
                />

                <ModernInput
                  label="Location"
                  value={profileData.location}
                  onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Enter your city/region"
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
                        <p className="text-sm text-green-600">
                          {user.email_confirmed_at ? 'Verified' : 'Pending Verification'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900">Account Type</p>
                        <p className="text-sm text-blue-600">Standard User</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FloatingCard>

        {/* Additional Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FloatingCard className="p-6 text-center group hover:scale-105 transition-transform duration-300">
            <Shield className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Privacy Settings</h3>
            <p className="text-sm text-gray-600 mb-4">Manage your privacy and security preferences</p>
            <GradientButton size="sm" className="w-full">
              Manage Privacy
            </GradientButton>
          </FloatingCard>

          <FloatingCard className="p-6 text-center group hover:scale-105 transition-transform duration-300">
            <User className="h-8 w-8 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">My Reports</h3>
            <p className="text-sm text-gray-600 mb-4">View and manage your corruption reports</p>
            <GradientButton size="sm" className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              View Reports
            </GradientButton>
          </FloatingCard>

          <FloatingCard className="p-6 text-center group hover:scale-105 transition-transform duration-300">
            <Mail className="h-8 w-8 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Notifications</h3>
            <p className="text-sm text-gray-600 mb-4">Configure your notification preferences</p>
            <GradientButton size="sm" className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
              Settings
            </GradientButton>
          </FloatingCard>
        </div>
      </div>
    </div>
  );
}