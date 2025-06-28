import React from 'react';
import { Shield, Mail, Phone, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-8 w-8 text-red-500" />
              <div>
                <h3 className="text-xl font-bold">Corruption Watchdog</h3>
                <p className="text-sm text-gray-400">Fighting Corruption Together</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Empowering citizens to report corruption anonymously and create a transparent society. 
              Together, we can build a corruption-free future.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Heart className="h-4 w-4 text-red-500" />
              <span>Made with love for a better tomorrow</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/report" className="text-gray-300 hover:text-white transition-colors">Report Corruption</a></li>
              <li><a href="/directory" className="text-gray-300 hover:text-white transition-colors">Defaulter Directory</a></li>
              <li><a href="/heatmap" className="text-gray-300 hover:text-white transition-colors">Corruption Heat Map</a></li>
              <li><a href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-red-500" />
                <span className="text-gray-300">report@corruptionwatchdog.org</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-red-500" />
                <span className="text-gray-300">+1-800-CORRUPT</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-red-500" />
                <span className="text-gray-300">Global Platform</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 Corruption Watchdog. All rights reserved. | 
            <a href="/privacy" className="hover:text-white ml-1">Privacy Policy</a> | 
            <a href="/terms" className="hover:text-white ml-1">Terms of Service</a>
          </p>
        </div>
      </div>
    </footer>
  );
}