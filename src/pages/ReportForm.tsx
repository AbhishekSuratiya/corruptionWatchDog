import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Shield, Upload, AlertCircle, CheckCircle, Loader2, User, Mail, X, FileText, Image, Video } from 'lucide-react';
import Button from '../components/UI/Button';
import LocationAutocomplete from '../components/UI/LocationAutocomplete';
import { CORRUPTION_CATEGORIES } from '../lib/constants';
import { DatabaseService } from '../lib/database';
import { FileStorageService, UploadedFile } from '../lib/fileStorage';
import { useAuth } from '../hooks/useAuth';

interface ReportFormData {
  corrupt_person_name: string;
  designation: string;
  address: string;
  area_region: string;
  description: string;
  category: string;
  approached_authorities: string;
  was_resolved: string;
  is_anonymous: boolean;
  reporter_name?: string;
  reporter_email?: string;
}

export default function ReportForm() {
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  
  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue,
    formState: { errors }, 
    reset
  } = useForm<ReportFormData>({
    mode: 'onChange',
    defaultValues: {
      is_anonymous: !user, // Default to anonymous if not logged in
      approached_authorities: '',
      was_resolved: '',
      corrupt_person_name: '',
      designation: '',
      address: '',
      area_region: '',
      description: '',
      category: '',
      reporter_name: '',
      reporter_email: ''
    }
  });
  
  const isAnonymous = watch('is_anonymous');
  const areaRegion = watch('area_region');

  // Auto-fill user details when user is logged in
  useEffect(() => {
    if (user && !authLoading) {
      // Set default to non-anonymous for logged-in users
      setValue('is_anonymous', false);
      
      // Auto-fill user details
      const fullName = user.user_metadata?.full_name || '';
      const email = user.email || '';
      
      setValue('reporter_name', fullName);
      setValue('reporter_email', email);
    } else if (!user && !authLoading) {
      // Set default to anonymous for non-logged-in users
      setValue('is_anonymous', true);
      setValue('reporter_name', '');
      setValue('reporter_email', '');
    }
  }, [user, authLoading, setValue]);

  // Update form fields when anonymous toggle changes
  useEffect(() => {
    if (isAnonymous) {
      // Clear user details when switching to anonymous
      setValue('reporter_name', '');
      setValue('reporter_email', '');
    } else if (user) {
      // Re-fill user details when switching back to non-anonymous
      const fullName = user.user_metadata?.full_name || '';
      const email = user.email || '';
      
      setValue('reporter_name', fullName);
      setValue('reporter_email', email);
    }
  }, [isAnonymous, user, setValue]);

  const categoryOptions = Object.entries(CORRUPTION_CATEGORIES).map(([key, label]) => ({
    value: key,
    label
  }));

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Upload files first if any
      let evidenceUrls: string[] = [];
      
      if (files.length > 0) {
        setIsUploading(true);
        console.log('Uploading files:', files.map(f => f.name));
        
        try {
          const uploadedFiles = await FileStorageService.uploadFiles(files);
          evidenceUrls = uploadedFiles.map(file => file.url);
          console.log('Files uploaded successfully:', evidenceUrls);
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError);
          throw new Error('Failed to upload evidence files. Please try again.');
        } finally {
          setIsUploading(false);
        }
      }

      // Prepare data for database
      const reportData = {
        corrupt_person_name: data.corrupt_person_name.trim(),
        designation: data.designation.trim(),
        address: data.address?.trim() || undefined,
        area_region: data.area_region.trim(),
        description: data.description.trim(),
        category: data.category,
        approached_authorities: data.approached_authorities === 'yes',
        was_resolved: data.was_resolved === 'yes',
        is_anonymous: data.is_anonymous,
        reporter_name: data.is_anonymous ? undefined : data.reporter_name?.trim(),
        reporter_email: data.is_anonymous ? undefined : data.reporter_email?.trim(),
        evidence_files: evidenceUrls // Store actual file URLs
      };

      console.log('Submitting report with evidence URLs:', evidenceUrls);

      // Save to database
      const { data: savedReport, error } = await DatabaseService.createReport(reportData);
      
      if (error) {
        throw new Error(error.message || 'Failed to submit report');
      }

      console.log('Report saved successfully:', savedReport);
      
      setIsSubmitted(true);
      reset();
      setFiles([]);
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Validate files
      const validFiles: File[] = [];
      const errors: string[] = [];
      
      selectedFiles.forEach(file => {
        const validation = FileStorageService.validateFile(file);
        if (validation.isValid) {
          validFiles.push(file);
        } else {
          errors.push(validation.error!);
        }
      });
      
      if (errors.length > 0) {
        setSubmitError(errors.join('\n'));
        return;
      }
      
      setFiles(validFiles);
      setSubmitError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleLocationChange = (value: string) => {
    setValue('area_region', value, { shouldValidate: true });
  };

  const getFileIcon = (file: File) => {
    const type = FileStorageService.getFileType(file.name);
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4 text-blue-600" />;
      case 'video':
        return <Video className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Report Submitted Successfully
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for your courage in reporting corruption. Your report has been saved to our database 
              {files.length > 0 && ' along with your evidence files'} and will be reviewed by our team. 
              Together, we can build a more transparent society.
            </p>
            {uploadedFiles.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Evidence Files Uploaded:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      {getFileIcon({ name: file.name } as File)}
                      <span>{file.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="space-y-4">
              <Button onClick={() => setIsSubmitted(false)} className="w-full">
                Submit Another Report
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
                Return to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-100 rounded-full">
              <Shield className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Report Corruption
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your voice matters. Help us fight corruption by reporting incidents safely and securely.
          </p>
          
          {/* User Status Indicator */}
          {!authLoading && (
            <div className="mt-6 inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              {user ? (
                <>
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    Logged in as: <span className="font-medium">{user.email}</span>
                  </span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    Reporting as guest (anonymous by default)
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Error Alert */}
        {submitError && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800 whitespace-pre-line">{submitError}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Anonymous Reporting Toggle */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Reporting Options
                  </h3>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="is_anonymous"
                      {...register('is_anonymous')}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_anonymous" className="text-yellow-700">
                      Report anonymously {user ? '(override logged-in status)' : '(recommended for safety)'}
                    </label>
                  </div>
                  <p className="text-sm text-yellow-600 mt-2">
                    {user 
                      ? 'Your details are auto-filled from your account. Check this box to report anonymously instead.'
                      : 'Anonymous reports help protect your identity while still allowing us to investigate the corruption.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Corrupt Person Details */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Corrupt Person Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="corrupt_person_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="corrupt_person_name"
                    {...register('corrupt_person_name', { 
                      required: 'Full name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters'
                      },
                      validate: value => {
                        if (!value || value.trim().length === 0) {
                          return 'Full name is required';
                        }
                        return true;
                      }
                    })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="Enter the corrupt person's full name"
                  />
                  {errors.corrupt_person_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.corrupt_person_name.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">
                    Designation/Job Title *
                  </label>
                  <input
                    type="text"
                    id="designation"
                    {...register('designation', { 
                      required: 'Designation is required',
                      minLength: {
                        value: 2,
                        message: 'Designation must be at least 2 characters'
                      },
                      validate: value => {
                        if (!value || value.trim().length === 0) {
                          return 'Designation is required';
                        }
                        return true;
                      }
                    })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="e.g., Government Official, Manager, Inspector"
                  />
                  {errors.designation && (
                    <p className="text-sm text-red-600 mt-1">{errors.designation.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address (if known)
                </label>
                <input
                  type="text"
                  id="address"
                  {...register('address')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="Enter address or workplace"
                />
                <p className="text-sm text-gray-500 mt-1">This helps us verify the report</p>
              </div>
            </div>

            {/* Incident Details */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Incident Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <LocationAutocomplete
                    label="Area/Region"
                    value={areaRegion}
                    onChange={handleLocationChange}
                    placeholder="Start typing city or state name..."
                    error={errors.area_region?.message}
                    required
                  />
                  {/* Hidden input for form validation */}
                  <input
                    type="hidden"
                    {...register('area_region', { 
                      required: 'Area/Region is required',
                      minLength: {
                        value: 2,
                        message: 'Area must be at least 2 characters'
                      },
                      validate: value => {
                        if (!value || value.trim().length === 0) {
                          return 'Area/Region is required';
                        }
                        return true;
                      }
                    })}
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category of Corruption *
                  </label>
                  <select
                    id="category"
                    {...register('category', { required: 'Category is required' })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  >
                    <option value="">Select a category</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  id="description"
                  rows={6}
                  {...register('description', { 
                    required: 'Description is required',
                    minLength: {
                      value: 10,
                      message: 'Description must be at least 10 characters'
                    },
                    validate: value => {
                      if (!value || value.trim().length === 0) {
                        return 'Description is required';
                      }
                      if (value.trim().length < 10) {
                        return 'Description must be at least 10 characters';
                      }
                      return true;
                    }
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-vertical"
                  placeholder="Provide a detailed account of the corruption incident..."
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">Include dates, amounts, witnesses, and any other relevant details</p>
              </div>
            </div>

            {/* Authorities Involvement */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Authorities Involvement
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Did you approach any authorities or higher responsible person? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="yes"
                        {...register('approached_authorities', { required: 'Please select an option' })}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="no"
                        {...register('approached_authorities', { required: 'Please select an option' })}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">No</span>
                    </label>
                  </div>
                  {errors.approached_authorities && (
                    <p className="text-sm text-red-600 mt-1">{errors.approached_authorities.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    This includes law enforcement, supervisors, anti-corruption agencies, or any higher authority
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Was the issue resolved? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="yes"
                        {...register('was_resolved', { required: 'Please select an option' })}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="no"
                        {...register('was_resolved', { required: 'Please select an option' })}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">No</span>
                    </label>
                  </div>
                  {errors.was_resolved && (
                    <p className="text-sm text-red-600 mt-1">{errors.was_resolved.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Evidence Upload */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Evidence Files (Optional)
              </h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <label htmlFor="evidence" className="cursor-pointer">
                    <span className="text-red-600 font-medium hover:text-red-700">
                      Upload photos, videos, or documents
                    </span>
                    <input
                      id="evidence"
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, MP4, PDF, DOC up to 10MB each
                  </p>
                </div>
                
                {/* Selected Files Display */}
                {files.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <p className="text-sm font-medium text-gray-700">Selected files:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(file)}
                            <div className="text-left">
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                            title="Remove file"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      <span className="text-sm text-blue-700 font-medium">
                        Uploading evidence files...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reporter Details (if not anonymous and not auto-filled) */}
            {!isAnonymous && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Your Details
                  {user && (
                    <span className="text-sm font-normal text-green-600 ml-2">
                      (Auto-filled from your account)
                    </span>
                  )}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="reporter_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name {user && <span className="text-green-600">✓</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="reporter_name"
                        {...register('reporter_name', {
                          required: !isAnonymous ? 'Name is required for non-anonymous reports' : false
                        })}
                        className={`block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                          user ? 'bg-green-50 border-green-200' : ''
                        }`}
                        placeholder="Enter your full name"
                        readOnly={!!user}
                      />
                      {user && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <User className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                    </div>
                    {errors.reporter_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.reporter_name.message}</p>
                    )}
                    {user && (
                      <p className="text-sm text-green-600 mt-1">Auto-filled from your account</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="reporter_email" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Email {user && <span className="text-green-600">✓</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="reporter_email"
                        {...register('reporter_email', {
                          required: !isAnonymous ? 'Email is required for non-anonymous reports' : false,
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        className={`block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                          user ? 'bg-green-50 border-green-200' : ''
                        }`}
                        placeholder="Enter your email address"
                        readOnly={!!user}
                      />
                      {user && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Mail className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                    </div>
                    {errors.reporter_email && (
                      <p className="text-sm text-red-600 mt-1">{errors.reporter_email.message}</p>
                    )}
                    {user ? (
                      <p className="text-sm text-green-600 mt-1">Auto-filled from your account</p>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">We'll use this to contact you for updates</p>
                    )}
                  </div>
                </div>

                {!user && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      <p className="text-sm text-blue-700">
                        <strong>Tip:</strong> Sign up for an account to auto-fill your details and track your reports!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <Button
                type="submit"
                isLoading={isSubmitting || isUploading}
                className="w-full py-4 text-lg font-semibold"
                size="lg"
                disabled={isSubmitting || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Uploading Evidence Files...
                  </>
                ) : isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving Report to Database...
                  </>
                ) : (
                  'Submit Corruption Report'
                )}
              </Button>
              <p className="text-sm text-gray-500 text-center mt-4">
                By submitting this report, you agree to our terms of service and privacy policy.
                All reports and evidence files are stored securely and treated with strict confidentiality.
              </p>
              
              {/* Show validation errors summary */}
              {Object.keys(errors).length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field}>• {error?.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}