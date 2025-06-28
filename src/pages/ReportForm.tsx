import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Shield, Upload, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Textarea from '../components/UI/Textarea';
import { CORRUPTION_CATEGORIES } from '../lib/constants';

interface ReportFormData {
  corrupt_person_name: string;
  designation: string;
  address: string;
  area_region: string;
  description: string;
  category: string;
  approached_police: string;
  was_resolved: string;
  is_anonymous: boolean;
  reporter_name?: string;
  reporter_email?: string;
}

export default function ReportForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  
  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors, isValid }, 
    reset,
    trigger
  } = useForm<ReportFormData>({
    mode: 'onChange', // This enables real-time validation
    defaultValues: {
      is_anonymous: true,
      approached_police: '',
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

  const categoryOptions = Object.entries(CORRUPTION_CATEGORIES).map(([key, label]) => ({
    value: key,
    label
  }));

  const onSubmit = async (data: ReportFormData) => {
    console.log('Form data being submitted:', data);
    console.log('Form errors:', errors);
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Report submitted successfully:', data);
      console.log('Files:', files);
      
      setIsSubmitted(true);
      reset();
      setFiles([]);
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  // Debug function to check form state
  const debugForm = () => {
    console.log('Current form values:', watch());
    console.log('Form errors:', errors);
    console.log('Is form valid:', isValid);
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
              Thank you for your courage in reporting corruption. Your report has been recorded 
              and will be reviewed by our team. Together, we can build a more transparent society.
            </p>
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
        </div>

        {/* Debug Button - Remove in production */}
        <div className="mb-4 text-center">
          <button 
            type="button" 
            onClick={debugForm}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Debug Form (Check Console)
          </button>
        </div>

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
                      Report anonymously (recommended for safety)
                    </label>
                  </div>
                  <p className="text-sm text-yellow-600 mt-2">
                    Anonymous reports help protect your identity while still allowing us to investigate the corruption.
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
                <Input
                  label="Full Name *"
                  {...register('corrupt_person_name', { 
                    required: 'Full name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters'
                    }
                  })}
                  error={errors.corrupt_person_name?.message}
                  placeholder="Enter the corrupt person's full name"
                />
                
                <Input
                  label="Designation/Job Title *"
                  {...register('designation', { 
                    required: 'Designation is required',
                    minLength: {
                      value: 2,
                      message: 'Designation must be at least 2 characters'
                    }
                  })}
                  error={errors.designation?.message}
                  placeholder="e.g., Police Officer, Government Official"
                />
              </div>

              <Input
                label="Address (if known)"
                {...register('address')}
                placeholder="Enter address or workplace"
                helperText="This helps us verify the report"
              />
            </div>

            {/* Incident Details */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Incident Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <Input
                    label="Area/Region *"
                    {...register('area_region', { 
                      required: 'Area/Region is required',
                      minLength: {
                        value: 2,
                        message: 'Area must be at least 2 characters'
                      }
                    })}
                    error={errors.area_region?.message}
                    placeholder="Enter location where corruption occurred"
                  />
                  <MapPin className="absolute right-3 top-8 h-5 w-5 text-gray-400" />
                </div>
                
                <Select
                  label="Category of Corruption *"
                  {...register('category', { required: 'Category is required' })}
                  error={errors.category?.message}
                  options={categoryOptions}
                />
              </div>

              <Textarea
                label="Detailed Description *"
                {...register('description', { 
                  required: 'Description is required',
                  minLength: {
                    value: 10,
                    message: 'Description must be at least 10 characters'
                  }
                })}
                error={errors.description?.message}
                placeholder="Provide a detailed account of the corruption incident..."
                rows={6}
                helperText="Include dates, amounts, witnesses, and any other relevant details"
              />
            </div>

            {/* Police Involvement */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Police Involvement
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Did you approach the police? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="yes"
                        {...register('approached_police', { required: 'Please select an option' })}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="no"
                        {...register('approached_police', { required: 'Please select an option' })}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">No</span>
                    </label>
                  </div>
                  {errors.approached_police && (
                    <p className="text-sm text-red-600 mt-1">{errors.approached_police.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Was it resolved? *
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
                Evidence (Optional)
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
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, MP4, PDF up to 10MB each
                  </p>
                </div>
                {files.length > 0 && (
                  <div className="mt-4 text-left">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected files:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {files.map((file, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <span>📎</span>
                          <span>{file.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Reporter Details (if not anonymous) */}
            {!isAnonymous && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Your Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Your Name"
                    {...register('reporter_name', {
                      required: !isAnonymous ? 'Name is required for non-anonymous reports' : false
                    })}
                    error={errors.reporter_name?.message}
                    placeholder="Enter your full name"
                  />
                  
                  <Input
                    label="Your Email"
                    type="email"
                    {...register('reporter_email', {
                      required: !isAnonymous ? 'Email is required for non-anonymous reports' : false,
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    error={errors.reporter_email?.message}
                    placeholder="Enter your email address"
                    helperText="We'll use this to contact you for updates"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full py-4 text-lg font-semibold"
                size="lg"
              >
                {isSubmitting ? 'Submitting Report...' : 'Submit Corruption Report'}
              </Button>
              <p className="text-sm text-gray-500 text-center mt-4">
                By submitting this report, you agree to our terms of service and privacy policy.
                All reports are treated with strict confidentiality.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}