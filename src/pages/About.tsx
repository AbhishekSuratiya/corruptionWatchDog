import React from 'react';
import { Shield, Users, Target, Heart, Globe, Lock, Zap, Award } from 'lucide-react';

export default function About() {
  const features = [
    {
      icon: Lock,
      title: 'Anonymous Reporting',
      description: 'Report corruption safely without revealing your identity. Your privacy and safety are our top priorities.'
    },
    {
      icon: Globe,
      title: 'Global Platform',
      description: 'Fighting corruption worldwide with a unified platform that connects citizens across borders.'
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Get instant notifications about corruption trends and updates in your area.'
    },
    {
      icon: Award,
      title: 'Verified Reports',
      description: 'Our AI-powered verification system ensures the authenticity and accuracy of reports.'
    }
  ];

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'Founder & CEO',
      description: 'Former anti-corruption investigator with 15 years of experience in transparency advocacy.'
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      description: 'Security expert specializing in anonymous reporting systems and data protection.'
    },
    {
      name: 'Dr. Priya Sharma',
      role: 'Head of Research',
      description: 'PhD in Political Science, researcher in governance and corruption prevention strategies.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-white bg-opacity-20 rounded-full">
                <Shield className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About Corruption Watchdog
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
              We're on a mission to create a corruption-free world through technology, 
              transparency, and collective action.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Corruption Watchdog was born from the belief that every citizen deserves to live 
                in a transparent, accountable society. We provide a secure platform where people 
                can report corruption without fear, creating a powerful database that helps 
                communities identify and address corrupt practices.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Through technology and collective action, we're building a world where corruption 
                has nowhere to hide and transparency is the norm, not the exception.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-red-50 rounded-lg">
                <Target className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Transparency</h3>
                <p className="text-gray-600">Making corruption visible to all</p>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Community</h3>
                <p className="text-gray-600">Empowering citizens to act</p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Protection</h3>
                <p className="text-gray-600">Keeping whistleblowers safe</p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <Heart className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Justice</h3>
                <p className="text-gray-600">Fighting for what's right</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How We're Different
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge technology with human-centered design 
              to create the most effective anti-corruption tool available.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-red-100 rounded-full">
                    <feature.icon className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Dedicated professionals with expertise in anti-corruption, technology, 
              and social justice working together for change.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-xl text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-red-600 font-medium mb-4">
                  {member.role}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Impact So Far
            </h2>
            <p className="text-xl max-w-3xl mx-auto">
              Together, we're making a real difference in the fight against corruption.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">2,847</div>
              <div className="text-red-200">Reports Filed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">1,203</div>
              <div className="text-red-200">Cases Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">156</div>
              <div className="text-red-200">Regions Covered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">15,432</div>
              <div className="text-red-200">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join the Movement
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Be part of the solution. Every report, every voice, every action counts 
            in our fight against corruption.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/report" 
              className="bg-red-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Report Corruption
            </a>
            <a 
              href="/directory" 
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors"
            >
              View Directory
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}