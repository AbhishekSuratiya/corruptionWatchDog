import React from 'react';
import { Shield, Mail, Phone, MapPin, Heart, AlertTriangle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-200 border-t border-slate-900/60 relative overflow-hidden">
      {/* Background neon accent */}
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-red-650/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 space-y-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-white">Corruption Watchdog</h3>
                <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Fighting Corruption Together</p>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-md text-sm">
              Empowering citizens to report corruption anonymously and create a transparent society. 
              Together, we can build a corruption-free future.
            </p>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
              <span>Made for a transparent tomorrow</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/report" className="text-slate-400 hover:text-white transition-colors duration-200">Report Corruption</a></li>
              <li><a href="/directory" className="text-slate-400 hover:text-white transition-colors duration-200">Defaulter Directory</a></li>
              <li><a href="/heatmap" className="text-slate-400 hover:text-white transition-colors duration-200">Corruption Heat Map</a></li>
              <li><a href="/about" className="text-slate-400 hover:text-white transition-colors duration-200">About Us</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center space-x-2.5">
                <Mail className="h-4 w-4 text-red-500" />
                <span className="text-slate-400">report@corruptionwatchdog.org</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Phone className="h-4 w-4 text-red-500" />
                <span className="text-slate-400">+1-800-CORRUPT</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <MapPin className="h-4 w-4 text-red-500" />
                <span className="text-slate-400">Global Platform</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} Corruption Watchdog. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <span>|</span>
            <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}