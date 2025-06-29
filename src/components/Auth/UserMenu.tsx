import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, FileText, Shield, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserMenuProps {
  user: any;
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button - Fixed layout with proper text visibility */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 group"
      >
        {/* Avatar - Fixed size */}
        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center text-black font-bold text-sm shadow-lg flex-shrink-0">
          {getUserInitials()}
        </div>
        
        {/* User Info - Visible on medium screens and up */}
        <div className="hidden md:flex flex-col text-left min-w-0">
          <div className="text-sm font-medium text-white leading-tight max-w-[150px] truncate">
            {getUserDisplayName()}
          </div>
          <div className="text-xs text-white/80 leading-tight max-w-[150px] truncate">
            {user?.email}
          </div>
        </div>
        
        {/* Chevron - Fixed size */}
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 text-white/80 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-fade-in">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                {getUserInitials()}
              </div>
              
              {/* User details */}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-900 break-words leading-tight">
                  {getUserDisplayName()}
                </div>
                <div className="text-sm text-gray-500 break-all leading-relaxed mt-1">
                  {user?.email}
                </div>
                {/* User status indicator */}
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <a
              href="/profile"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span>Profile Settings</span>
            </a>
            
            <a
              href="/my-reports"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span>My Reports</span>
            </a>
            
            <a
              href="/settings"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span>Account Settings</span>
            </a>
            
            <a
              href="/privacy"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Shield className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span>Privacy & Security</span>
            </a>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}