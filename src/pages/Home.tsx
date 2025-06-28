import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, MapPin, AlertTriangle, FileText, Eye, TrendingUp } from 'lucide-react';
import Button from '../components/UI/Button';

export default function Home() {
  const stats = [
    { label: 'Reports Filed', value: '2,847', icon: FileText, color: 'text-blue-600' },
    { label: 'Cases Resolved', value: '1,203', icon: Shield, color: 'text-green-600' },
    { label: 'Active Users', value: '15,432', icon: Users, color: 'text-purple-600' },
    { label: 'Regions Covered', value: '156', icon: MapPin, color: 'text-orange-600' }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Anonymous Reporting',
      description: 'Report corruption safely without revealing your identity. Your privacy is our priority.'
    },
    {
      icon: MapPin,
      title: 'Location-Based Tracking',
      description: 'Track corruption hotspots in your area with our interactive heat map visualization.'
    },
    {
      icon: Eye,
      title: 'Transparency',
      description: 'All reports are publicly accessible to promote transparency and accountability.'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Analytics',
      description: 'Monitor corruption trends and patterns with comprehensive data analytics.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <Shield className="h-20 w-20 text-white" />
                <AlertTriangle className="h-8 w-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Fight Corruption
              <span className="block text-yellow-400">Together</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
              Empower your voice. Report corruption anonymously and help build a transparent, 
              accountable society for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/report">
                <Button size="lg" className="w-full sm:w-auto bg-yellow-500 text-black hover:bg-yellow-400 font-bold px-8 py-4 text-lg">
                  Report Corruption Now
                </Button>
              </Link>
              <Link to="/directory">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-red-600 px-8 py-4 text-lg">
                  View Directory
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gray-100 rounded-full group-hover:bg-red-50 transition-colors">
                    <stat.icon className={`h-8 w-8 ${stat.color} group-hover:scale-110 transition-transform`} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Corruption Watchdog?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides the tools and security you need to report corruption safely and effectively.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
                    <feature.icon className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of citizens who are actively fighting corruption in their communities. 
            Your report could be the catalyst for change.
          </p>
          <Link to="/report">
            <Button size="lg" className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold px-8 py-4 text-lg">
              Start Your Report
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}