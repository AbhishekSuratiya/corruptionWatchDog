import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import GradientButton from '../UI/GradientButton';
import ModernInput from '../UI/ModernInput';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset mode when initialMode changes
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setMessage(null);
      setErrors({});
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // Password validation (for login and signup)
    if (mode !== 'forgot') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (mode === 'signup' && formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }

    // Signup specific validations
    if (mode === 'signup') {
      if (!formData.fullName) {
        newErrors.fullName = 'Full name is required';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName
            },
            // Disable email confirmation for immediate login
            emailRedirectTo: undefined
          }
        });

        if (error) throw error;

        // Check if user was created successfully
        if (data.user) {
          setMessage({
            type: 'success',
            text: 'Account created successfully! You are now logged in.'
          });
          
          // Reset form
          setFormData({ email: '', password: '', confirmPassword: '', fullName: '' });
          
          // Close modal after successful signup
          setTimeout(() => {
            onClose();
          }, 1500);
        }
        
      } else if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;

        setMessage({
          type: 'success',
          text: 'Login successful! Welcome back.'
        });
        
        // Close modal after successful login
        setTimeout(() => {
          onClose();
        }, 1000);
        
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) throw error;

        setMessage({
          type: 'success',
          text: 'Password reset email sent! Please check your inbox.'
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Handle specific error messages
      let errorMessage = error.message || 'An error occurred. Please try again.';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      }
      
      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear messages when user starts typing
    if (message) {
      setMessage(null);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create Account';
      case 'forgot': return 'Reset Password';
      default: return 'Welcome Back';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signup': return 'Join the fight against corruption';
      case 'forgot': return 'Enter your email to reset your password';
      default: return 'Sign in to your account';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 px-8 py-8 text-white">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-2">{getTitle()}</h2>
            <p className="text-red-100 text-center text-sm">{getSubtitle()}</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            {/* Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-xl border ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center space-x-2">
                  {message.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name (Signup only) */}
              {mode === 'signup' && (
                <ModernInput
                  label="Full Name"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  error={errors.fullName}
                  icon={<User className="h-5 w-5" />}
                  placeholder="Enter your full name"
                />
              )}

              {/* Email */}
              <ModernInput
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
                icon={<Mail className="h-5 w-5" />}
                placeholder="Enter your email"
              />

              {/* Password (not for forgot password) */}
              {mode !== 'forgot' && (
                <div className="relative">
                  <ModernInput
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    error={errors.password}
                    icon={<Lock className="h-5 w-5" />}
                    placeholder={mode === 'signup' ? 'Create a password (min 6 characters)' : 'Enter your password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              )}

              {/* Confirm Password (Signup only) */}
              {mode === 'signup' && (
                <ModernInput
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  error={errors.confirmPassword}
                  icon={<Lock className="h-5 w-5" />}
                  placeholder="Confirm your password"
                />
              )}

              {/* Submit Button */}
              <GradientButton
                type="submit"
                isLoading={isLoading}
                className="w-full py-4 text-lg font-semibold"
                size="lg"
              >
                {isLoading ? (
                  'Processing...'
                ) : mode === 'signup' ? (
                  'Create Account'
                ) : mode === 'forgot' ? (
                  'Send Reset Email'
                ) : (
                  'Sign In'
                )}
              </GradientButton>
            </form>

            {/* Footer Links */}
            <div className="mt-8 space-y-4">
              {mode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setMessage(null);
                      setErrors({});
                    }}
                    className="block w-full text-center text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    Forgot your password?
                  </button>
                  <div className="text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setMessage(null);
                        setErrors({});
                      }}
                      className="text-red-600 hover:text-red-700 font-medium transition-colors"
                    >
                      Sign up
                    </button>
                  </div>
                </>
              )}

              {mode === 'signup' && (
                <div className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setMessage(null);
                      setErrors({});
                    }}
                    className="text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </div>
              )}

              {mode === 'forgot' && (
                <div className="text-center text-sm text-gray-600">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setMessage(null);
                      setErrors({});
                    }}
                    className="text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </div>
              )}
            </div>

            {/* Terms (Signup only) */}
            {mode === 'signup' && (
              <div className="mt-6 text-center text-xs text-gray-500">
                By creating an account, you agree to our{' '}
                <a href="/terms" className="text-red-600 hover:text-red-700">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-red-600 hover:text-red-700">Privacy Policy</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}