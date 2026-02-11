import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, FileText, Shield, ChevronDown } from 'lucide-react';
import { auth } from '../../lib/firebase';

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
      await auth.signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Modern User Button - Icon-based with tooltip */}
      <div className="relative group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <span className="text-sm font-bold">
            {getUserInitials()}
          </span>

          {/* Small chevron indicator */}
          <ChevronDown className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-white text-gray-600 rounded-full p-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Tooltip - Only show when menu is closed */}
        {!isOpen && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {getUserDisplayName()}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        )}
      </div>

      {/* Dropdown Menu - Enhanced design */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-fade-in">
          {/* User Info Header - Modern gradient design */}
          <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 px-6 py-5 text-white">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                {getUserInitials()}
              </div>

              {/* User details */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-lg leading-tight truncate">
                  {getUserDisplayName()}
                </div>
                <div className="text-red-100 text-sm leading-tight truncate mt-1">
                  {user?.email}
                </div>
                {/* Status indicator */}
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs text-red-100 font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items - Clean and modern */}
          <div className="py-3">
            <a
              href="/profile"
              className="flex items-center space-x-4 px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Profile Settings</div>
                <div className="text-xs text-gray-500">Manage your account</div>
              </div>
            </a>

            <a
              href="/my-reports"
              className="flex items-center space-x-4 px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">My Reports</div>
                <div className="text-xs text-gray-500">View your submissions</div>
              </div>
            </a>

            <a
              href="/settings"
              className="flex items-center space-x-4 px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Account Settings</div>
                <div className="text-xs text-gray-500">Preferences & privacy</div>
              </div>
            </a>

            <a
              href="/privacy"
              className="flex items-center space-x-4 px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Privacy & Security</div>
                <div className="text-xs text-gray-500">Data protection</div>
              </div>
            </a>
          </div>

          {/* Sign Out - Prominent styling */}
          <div className="border-t border-gray-100 p-3">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-4 px-6 py-3 text-red-600 hover:bg-red-50 transition-colors w-full text-left rounded-xl group"
            >
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <LogOut className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="font-medium text-red-700">Sign Out</div>
                <div className="text-xs text-red-500">End your session</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}