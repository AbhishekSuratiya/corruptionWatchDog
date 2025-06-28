import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, MapPin, Calendar, Flag, ExternalLink, Filter } from 'lucide-react';
import GradientButton from '../components/UI/GradientButton';
import ModernInput from '../components/UI/ModernInput';
import FloatingCard from '../components/UI/FloatingCard';
import SkeletonLoader from '../components/UI/SkeletonLoader';
import { CORRUPTION_CATEGORIES } from '../lib/constants';
import { DatabaseService } from '../lib/database';

interface DefaulterProfile {
  corrupt_person_name: string;
  designation: string;
  area_region: string;
  report_count: number;
  latest_report_date: string;
  categories: string[];
  status: string;
}

export default function Directory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [defaulters, setDefaulters] = useState<DefaulterProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDefaulters();
  }, []);

  const fetchDefaulters = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await DatabaseService.getDefaulters(2); // Minimum 2 reports to be considered a defaulter
      
      if (error) {
        throw new Error(error.message || 'Failed to fetch defaulters');
      }

      if (data) {
        // Transform the data to match our interface
        const transformedData: DefaulterProfile[] = data.map(item => ({
          corrupt_person_name: item.corrupt_person_name,
          designation: item.designation,
          area_region: item.area_region,
          report_count: Number(item.report_count),
          latest_report_date: item.latest_report_date,
          categories: item.categories || [],
          status: item.status === 'critical' ? 'active' : 
                  item.status === 'high' ? 'active' : 
                  item.status === 'medium' ? 'disputed' : 'resolved'
        }));
        
        setDefaulters(transformedData);
      } else {
        setDefaulters([]);
      }
    } catch (err) {
      console.error('Error fetching defaulters:', err);
      setError(err instanceof Error ? err.message : 'Failed to load defaulters');
      setDefaulters([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDefaulters = defaulters.filter(defaulter => {
    const matchesSearch = defaulter.corrupt_person_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         defaulter.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         defaulter.area_region.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || defaulter.categories.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800 border-red-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'disputed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBadgeColor = (count: number) => {
    if (count >= 20) return 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/25';
    if (count >= 10) return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25';
    return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/25';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Static Content */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-pulse"></div>
              <div className="relative p-6 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl">
                <AlertTriangle className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Defaulter 
            <span className="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent"> Directory</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Public registry of individuals with multiple corruption reports. 
            Help your community stay informed and vigilant.
          </p>
        </div>

        {/* Search and Filters - Static Content */}
        <FloatingCard className="p-8 mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3">
              <ModernInput
                placeholder="Search by name, designation, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-5 w-5" />}
              />
            </div>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:border-red-500 focus:outline-none focus:ring-0 transition-all duration-300 hover:border-gray-300 appearance-none"
              >
                <option value="">All Categories</option>
                {Object.entries(CORRUPTION_CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          {/* Refresh Button */}
          <div className="mt-4 flex justify-end">
            <GradientButton 
              onClick={fetchDefaulters} 
              size="sm"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </GradientButton>
          </div>
        </FloatingCard>

        {/* Error Message */}
        {error && (
          <FloatingCard className="mb-8 bg-red-50 border-2 border-red-200">
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Error Loading Data</h3>
                  <p className="text-red-700">{error}</p>
                  <button 
                    onClick={fetchDefaulters}
                    className="mt-2 text-red-600 hover:text-red-800 font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </FloatingCard>
        )}

        {/* Results Count - Show only when not loading */}
        {!isLoading && !error && (
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <p className="text-gray-600 text-lg">
              Showing <span className="font-semibold text-red-600">{filteredDefaulters.length}</span> defaulter{filteredDefaulters.length !== 1 ? 's' : ''}
              {searchTerm && ` matching "${searchTerm}"`}
              {defaulters.length > 0 && (
                <span className="text-sm text-gray-500 ml-2">
                  (Total: {defaulters.length} in database)
                </span>
              )}
            </p>
          </div>
        )}

        {/* Defaulters Grid - Data Driven */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            // Show skeleton only for data-driven content
            Array.from({ length: 6 }).map((_, index) => (
              <SkeletonLoader key={index} variant="card" className="h-80" />
            ))
          ) : filteredDefaulters.length > 0 ? (
            filteredDefaulters.map((defaulter, index) => (
              <FloatingCard 
                key={`${defaulter.corrupt_person_name}-${defaulter.designation}-${index}`}
                delay={index * 100}
                className="overflow-hidden group"
              >
                {/* Header with Badge */}
                <div className="relative p-6 pb-4 bg-gradient-to-br from-white to-gray-50">
                  <div className="absolute top-4 right-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold transform transition-all duration-300 group-hover:scale-110 ${getBadgeColor(defaulter.report_count)}`}>
                      {defaulter.report_count} Reports
                    </span>
                  </div>
                  
                  <div className="pr-24">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors duration-300">
                      {defaulter.corrupt_person_name}
                    </h3>
                    <p className="text-gray-600 font-medium mb-2">
                      {defaulter.designation}
                    </p>
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <MapPin className="h-4 w-4 mr-2 text-red-500" />
                      {defaulter.area_region}
                    </div>

                    {/* Status Badge */}
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(defaulter.status)}`}>
                      {defaulter.status.charAt(0).toUpperCase() + defaulter.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Categories */}
                <div className="px-6 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {defaulter.categories.map((category) => (
                      <span key={category} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg border hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all duration-200">
                        {CORRUPTION_CATEGORIES[category as keyof typeof CORRUPTION_CATEGORIES] || category}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-red-500" />
                      Last reported: {new Date(defaulter.latest_report_date).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <GradientButton size="sm" className="flex-1 text-xs">
                      <Flag className="h-3 w-3 mr-2" />
                      View Reports
                    </GradientButton>
                    <GradientButton variant="secondary" size="sm" className="flex-1 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Report to Police
                    </GradientButton>
                  </div>
                </div>
              </FloatingCard>
            ))
          ) : !error ? (
            // No Results - Show only when not loading and no results
            <div className="col-span-full">
              <FloatingCard className="text-center py-16">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <Search className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {defaulters.length === 0 ? 'No defaulters found' : 'No matching defaulters'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {defaulters.length === 0 
                    ? 'No individuals with multiple corruption reports have been found in the database yet.'
                    : 'Try adjusting your search criteria or browse all categories.'
                  }
                </p>
                {filteredDefaulters.length === 0 && defaulters.length > 0 && (
                  <GradientButton onClick={() => { setSearchTerm(''); setSelectedCategory(''); }}>
                    Clear Filters
                  </GradientButton>
                )}
              </FloatingCard>
            </div>
          ) : null}
        </div>

        {/* Warning Notice - Static Content */}
        <FloatingCard className="mt-12 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200" delay={600}>
          <div className="p-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-yellow-800 mb-3">
                  Important Notice
                </h3>
                <p className="text-yellow-700 leading-relaxed">
                  This directory contains individuals with multiple corruption reports from our database. 
                  All information is based on user submissions and should be verified independently. 
                  If you believe any information is incorrect, you can file a dispute through our claim system.
                </p>
                <p className="text-yellow-700 leading-relaxed mt-2">
                  <strong>Data Source:</strong> Real-time data from Supabase database. Last updated: {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
}