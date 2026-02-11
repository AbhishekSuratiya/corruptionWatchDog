import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, MapPin, AlertTriangle, FileText, Eye, TrendingUp, Zap, Globe, Award } from 'lucide-react';
import GradientButton from '../components/UI/GradientButton';
import FloatingCard from '../components/UI/FloatingCard';
import AnimatedCounter from '../components/UI/AnimatedCounter';
import SkeletonLoader from '../components/UI/SkeletonLoader';
import { DatabaseService } from '../lib/database';

interface RealStats {
  totalReports: number;
  resolvedReports: number;
  activeRegions: number;
  pendingReports: number;
}

export default function Home() {
  const [statsLoading, setStatsLoading] = useState(true);
  const [realStats, setRealStats] = useState<RealStats>({
    totalReports: 0,
    resolvedReports: 0,
    activeRegions: 0,
    pendingReports: 0
  });
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    fetchRealStats();
  }, []);

  const fetchRealStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);

      // Fetch real statistics from database
      const stats = await DatabaseService.getStatistics();

      setRealStats({
        totalReports: stats.totalReports,
        resolvedReports: stats.resolvedReports,
        activeRegions: stats.regionStats.length, // Number of regions with reports
        pendingReports: stats.pendingReports
      });

    } catch (error) {
      console.error('Error fetching real stats:', error);
      setStatsError('Failed to load statistics');

      // Fallback to zero values if database fails
      setRealStats({
        totalReports: 0,
        resolvedReports: 0,
        activeRegions: 0,
        pendingReports: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Calculate active users estimate (since we don't track this directly)
  // We'll estimate based on non-anonymous reports
  const estimatedActiveUsers = Math.max(1, Math.floor(realStats.totalReports * 0.3)); // Rough estimate

  const stats = [
    {
      label: 'Reports Filed',
      value: realStats.totalReports,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      description: 'Total corruption reports in database'
    },
    {
      label: 'Cases Resolved',
      value: realStats.resolvedReports,
      icon: Shield,
      color: 'from-green-500 to-green-600',
      description: 'Reports marked as resolved'
    },
    {
      label: 'Active Users',
      value: estimatedActiveUsers,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      description: 'Estimated active community members'
    },
    {
      label: 'Regions Covered',
      value: realStats.activeRegions,
      icon: MapPin,
      color: 'from-orange-500 to-orange-600',
      description: 'Cities and states with reports'
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Anonymous Reporting',
      description: 'Report corruption safely without revealing your identity. Your privacy is our priority.',
      gradient: 'from-red-500 to-pink-500'
    },
    {
      icon: MapPin,
      title: 'Location-Based Tracking',
      description: 'Track corruption hotspots in your area with our interactive heat map visualization.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Eye,
      title: 'Transparency',
      description: 'All reports are publicly accessible to promote transparency and accountability.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Analytics',
      description: 'Monitor corruption trends and patterns with comprehensive data analytics.',
      gradient: 'from-purple-500 to-violet-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Hero Section with Beautiful Background */}
      <section className="relative overflow-hidden">
        {/* Modern Background with Geometric Patterns */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-900"></div>

          {/* Geometric overlay pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
                <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="1.5" fill="white" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)"/>
              <rect width="100%" height="100%" fill="url(#dots)"/>
            </svg>
          </div>

          {/* Floating geometric shapes */}
          <div className="absolute inset-0">
            {/* Large circle - top right */}
            <div className="absolute top-10 right-10 w-96 h-96 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl animate-float"></div>

            {/* Medium circle - bottom left */}
            <div className="absolute bottom-20 left-20 w-72 h-72 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-full blur-3xl animate-float-delayed"></div>

            {/* Small circles scattered */}
            <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-2xl animate-float"></div>
            <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-gradient-to-br from-green-400/20 to-teal-500/20 rounded-full blur-2xl animate-float-delayed"></div>
          </div>

          {/* Subtle texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

          {/* Justice/Legal themed elements */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-1/4 left-1/4 transform -rotate-12">
              <svg width="200" height="200" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
              </svg>
            </div>
            <div className="absolute bottom-1/4 right-1/4 transform rotate-12">
              <svg width="150" height="150" viewBox="0 0 24 24" fill="white">
                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8 animate-fade-in">
              <div className="relative group">
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse"></div>
                <div className="relative p-6 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-2xl">
                  <Shield className="h-16 w-16 text-white drop-shadow-lg" />
                  <AlertTriangle className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
                </div>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-16 animate-fade-in-up text-white" style={{ lineHeight: '1.1' }}>
              Fight Corruption
              <span className="block bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent animate-gradient-x mt-4" style={{ paddingBottom: '0.2em' }}>
                Together
              </span>
            </h1>

            <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed text-white/90 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              Empower your voice. Report corruption anonymously and help build a transparent,
              accountable society for everyone.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <Link to="/report">
                <GradientButton
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 font-bold px-10 py-5 text-lg shadow-2xl hover:shadow-yellow-500/25"
                  glow
                >
                  <Zap className="w-5 h-5" />
                  <span>Report Corruption Now</span>
                </GradientButton>
              </Link>
              <Link to="/directory">
                <GradientButton
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 px-10 py-5 text-lg"
                >
                  <Eye className="w-5 h-5" />
                  <span>View Directory</span>
                </GradientButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Real-Time Stats Section - Data Driven */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Live Platform
              <span className="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent"> Statistics</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real-time data from our corruption reports database, updated automatically as new reports are submitted.
            </p>

            {/* Refresh Button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={fetchRealStats}
                disabled={statsLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <TrendingUp className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
                <span>{statsLoading ? 'Updating...' : 'Refresh Stats'}</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {statsError && (
            <div className="mb-8 max-w-md mx-auto">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <p className="text-sm text-orange-700">{statsError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsLoading ? (
              // Show skeleton only for data-driven stats
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-6">
                    <SkeletonLoader variant="circular" className="w-16 h-16" />
                  </div>
                  <SkeletonLoader className="w-20 h-8 mx-auto mb-2" />
                  <SkeletonLoader className="w-24 h-4 mx-auto" />
                </div>
              ))
            ) : (
              stats.map((stat, index) => (
                <FloatingCard key={index} delay={index * 100} className="p-8 text-center group relative overflow-hidden">
                  {/* Background gradient on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                  <div className="relative z-10">
                    <div className="flex justify-center mb-6">
                      <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                        <stat.icon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      <AnimatedCounter end={stat.value} />
                    </div>
                    <div className="text-gray-600 font-medium mb-2">{stat.label}</div>
                    <div className="text-xs text-gray-500 leading-relaxed">{stat.description}</div>

                    {/* Real-time indicator */}
                    <div className="mt-4 flex items-center justify-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">Live Data</span>
                    </div>
                  </div>
                </FloatingCard>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Features Section - Static Content */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/50 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose
              <span className="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent"> Corruption Watchdog</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our platform combines cutting-edge technology with human-centered design
              to create the most effective anti-corruption tool available.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FloatingCard key={index} delay={index * 150} className="p-8 group relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                <div className="relative z-10">
                  <div className="flex justify-center mb-8">
                    <div className={`p-5 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 text-center group-hover:text-red-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </FloatingCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Beautiful Background */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Modern gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-900"></div>

          {/* Geometric pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="hexagons" width="28" height="24" patternUnits="userSpaceOnUse">
                  <polygon points="14,2 26,9 26,21 14,28 2,21 2,9" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hexagons)"/>
            </svg>
          </div>

          {/* Floating elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl animate-float-delayed"></div>

          {/* Justice scales silhouette */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <svg width="300" height="300" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7V9C15 10.1 15.9 11 17 11S19 10.1 19 11H21ZM9 7V9C9 10.1 8.1 11 7 11S5 10.1 5 11H3V9L9 7ZM12 7.5C11.2 7.5 10.5 8.2 10.5 9S11.2 10.5 12 10.5 13.5 9.8 13.5 9 12.8 7.5 12 7.5Z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-16 text-white" style={{ lineHeight: '1.1' }}>
              Ready to Make a
              <span className="block bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent mt-4" style={{ paddingBottom: '0.2em' }}>
                Difference
              </span>?
            </h2>
            <p className="text-xl mb-12 max-w-3xl mx-auto text-white/90 leading-relaxed">
              Join thousands of citizens who are actively fighting corruption in their communities.
              Your report could be the catalyst for change.
            </p>
            <Link to="/report">
              <GradientButton
                size="lg"
                className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 font-bold px-12 py-6 text-xl shadow-2xl hover:shadow-yellow-500/25 transform hover:scale-105"
                glow
              >
                <Shield className="w-6 h-6" />
                <span>Start Your Report</span>
              </GradientButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
