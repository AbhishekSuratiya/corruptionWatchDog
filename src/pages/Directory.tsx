import React, { useState } from 'react';
import { Search, AlertTriangle, MapPin, Calendar, Flag, ExternalLink } from 'lucide-react';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import { CORRUPTION_CATEGORIES } from '../lib/constants';

interface DefaulterProfile {
  id: string;
  name: string;
  designation: string;
  location: string;
  reportCount: number;
  lastReported: string;
  categories: string[];
  status: 'active' | 'resolved' | 'disputed';
}

export default function Directory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Mock data - replace with actual API call
  const defaulters: DefaulterProfile[] = [
    {
      id: '1',
      name: 'John Doe',
      designation: 'Traffic Police Officer',
      location: 'Mumbai, Maharashtra',
      reportCount: 15,
      lastReported: '2024-01-15',
      categories: ['bribery', 'extortion'],
      status: 'active'
    },
    {
      id: '2',
      name: 'Jane Smith',
      designation: 'Municipal Corporation Officer',
      location: 'Delhi, NCR',
      reportCount: 8,
      lastReported: '2024-01-10',
      categories: ['nepotism', 'abuse_of_power'],
      status: 'disputed'
    },
    {
      id: '3',
      name: 'Robert Johnson',
      designation: 'Government Clerk',
      location: 'Bangalore, Karnataka',
      reportCount: 23,
      lastReported: '2024-01-20',
      categories: ['bribery', 'misuse_of_funds'],
      status: 'active'
    }
  ];

  const filteredDefaulters = defaulters.filter(defaulter => {
    const matchesSearch = defaulter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         defaulter.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         defaulter.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || defaulter.categories.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'disputed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBadgeColor = (count: number) => {
    if (count >= 20) return 'bg-red-600 text-white';
    if (count >= 10) return 'bg-orange-500 text-white';
    return 'bg-yellow-500 text-white';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Defaulter Directory
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Public registry of individuals with multiple corruption reports. 
            Help your community stay informed and vigilant.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by name, designation, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All Categories</option>
                {Object.entries(CORRUPTION_CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredDefaulters.length} defaulter{filteredDefaulters.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>

        {/* Defaulters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDefaulters.map((defaulter) => (
            <div key={defaulter.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Header with Badge */}
              <div className="relative p-6 pb-4">
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getBadgeColor(defaulter.reportCount)}`}>
                    {defaulter.reportCount} Reports
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2 pr-20">
                  {defaulter.name}
                </h3>
                <p className="text-gray-600 font-medium mb-1">
                  {defaulter.designation}
                </p>
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  {defaulter.location}
                </div>

                {/* Status Badge */}
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(defaulter.status)}`}>
                  {defaulter.status.charAt(0).toUpperCase() + defaulter.status.slice(1)}
                </span>
              </div>

              {/* Categories */}
              <div className="px-6 pb-4">
                <div className="flex flex-wrap gap-2">
                  {defaulter.categories.map((category) => (
                    <span key={category} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                      {CORRUPTION_CATEGORIES[category as keyof typeof CORRUPTION_CATEGORIES]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Last reported: {new Date(defaulter.lastReported).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button size="sm" className="flex-1 text-xs">
                    <Flag className="h-3 w-3 mr-1" />
                    View Reports
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Report to Police
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredDefaulters.length === 0 && (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No defaulters found</h3>
            <p className="text-gray-500">
              Try adjusting your search criteria or browse all categories.
            </p>
          </div>
        )}

        {/* Warning Notice */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Important Notice
              </h3>
              <p className="text-yellow-700 leading-relaxed">
                This directory contains individuals with multiple corruption reports. 
                All information is based on user submissions and should be verified independently. 
                If you believe any information is incorrect, you can file a dispute through our claim system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}