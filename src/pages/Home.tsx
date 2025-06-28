import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, MapPin, AlertTriangle, FileText, Eye, TrendingUp, Zap, Globe, Award } from 'lucide-react';
import GradientButton from '../components/UI/GradientButton';
import FloatingCard from '../components/UI/FloatingCard';
import AnimatedCounter from '../components/UI/AnimatedCounter';
import SkeletonLoader from '../components/UI/SkeletonLoader';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { label: 'Reports Filed', value: 2847, icon: FileText, color: 'from-blue-500 to-blue-600' },
    { label: 'Cases Resolved', value: 1203, icon: Shield, color: 'from-green-500 to-green-600' },
    { label: 'Active Users', value: 15432, icon: Users, color: 'from-purple-500 to-purple-600' },
    { label: 'Regions Covered', value: 156, icon: MapPin, color: 'from-orange-500 to-orange-600' }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Hero Skeleton */}
        <section className="relative py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-8">
              <SkeletonLoader variant="circular" className="w-20 h-20 mx-auto" />
              <SkeletonLoader variant="text" lines={2} className="max-w-2xl mx-auto" height="h-8" />
              <SkeletonLoader variant="text" lines={3} className="max-w-4xl mx-auto" height="h-6" />
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <SkeletonLoader className="w-48 h-14 mx-auto" />
                <SkeletonLoader className="w-48 h-14 mx-auto" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Skeleton */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="text-center">
                  <SkeletonLoader variant="circular" className="w-16 h-16 mx-auto mb-4" />
                  <SkeletonLoader className="w-20 h-8 mx-auto mb-2" />
                  <SkeletonLoader className="w-24 h-4 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Skeleton */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <SkeletonLoader className="w-96 h-10 mx-auto mb-4" />
              <SkeletonLoader variant="text" lines={2} className="max-w-3xl mx-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonLoader key={index} variant="card" />
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-900">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-20 w-72 h-72 bg-red-500/20 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-float-delayed"></div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8 animate-fade-in">
              <div className="relative group">
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse"></div>
                <div className="relative p-6 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <Shield className="h-16 w-16 text-white drop-shadow-lg" />
                  <AlertTriangle className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight animate-fade-in-up text-white">
              Fight Corruption
              <span className="block bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent animate-gradient-x">
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
                  <Zap className="w-5 h-5 mr-2" />
                  Report Corruption Now
                </GradientButton>
              </Link>
              <Link to="/directory">
                <GradientButton 
                  variant="secondary" 
                  size="lg" 
                  className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 px-10 py-5 text-lg"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  View Directory
                </GradientButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <FloatingCard key={index} delay={index * 100} className="p-8 text-center group">
                <div className="flex justify-center mb-6">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  <AnimatedCounter end={stat.value} />
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </FloatingCard>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
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

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-900">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M20 20c0-11.046-8.954-20-20-20v20h20z%22/%3E%3C/g%3E%3C/svg%3E')]"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl animate-float-delayed"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
              Ready to Make a 
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent"> Difference</span>?
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
                <Shield className="w-6 h-6 mr-3" />
                Start Your Report
              </GradientButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}