import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X, AlertTriangle, LogIn, UserPlus, Settings, Home, FileText, Users, Map, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import UserMenu from '../Auth/UserMenu';
import AuthModal from '../Auth/AuthModal';
import GradientButton from '../UI/GradientButton';

interface HeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  shortName: string;
}

export default function Header({ isMenuOpen, setIsMenuOpen }: HeaderProps) {
  const location = useLocation();
  const { user, loading } = useAuth();
  const { isAdmin } = useAdmin();
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('login');

  const navigation: NavItem[] = [
    { name: 'Home', href: '/', icon: Home, shortName: 'Home' },
    { name: 'Report Corruption', href: '/report', icon: FileText, shortName: 'Report' },
    { name: 'Defaulter Directory', href: '/directory', icon: Users, shortName: 'Directory' },
    { name: 'Heat Map', href: '/heatmap', icon: Map, shortName: 'Heat Map' },
    { name: 'About', href: '/about', icon: Info, shortName: 'About' }
  ];

  // Add admin link for admin users
  if (isAdmin) {
    navigation.push({ 
      name: 'Admin Dashboard', 
      href: '/admin', 
      icon: Settings, 
      shortName: 'Admin' 
    });
  }

  const isActive = (path: string) => location.pathname === path;

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section - Compact and modern */}
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <Shield className="h-6 w-6 text-white" />
                    <AlertTriangle className="h-2.5 w-2.5 text-yellow-400 absolute -top-0.5 -right-0.5 animate-pulse" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-red-600 bg-clip-text text-transparent group-hover:from-red-600 group-hover:to-red-800 transition-all duration-300">
                    Corruption Watchdog
                  </h1>
                  <p className="text-xs text-gray-500 -mt-0.5">Fighting Corruption Together</p>
                </div>
              </Link>
            </div>

            {/* Modern Icon Navigation - Desktop */}
            <nav className="hidden lg:flex items-center space-x-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <div key={item.name} className="relative group">
                    <Link
                      to={item.href}
                      className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                        active
                          ? item.href === '/admin'
                            ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                            : 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                          : 'text-gray-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      
                      {/* Active indicator */}
                      {active && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </Link>
                    
                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Tablet Navigation - Condensed with icons and text */}
            <nav className="hidden md:flex lg:hidden items-center space-x-1">
              {navigation.slice(0, 4).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      active
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{item.shortName}</span>
                  </Link>
                );
              })}
              
              {/* More button for remaining items */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
              >
                <Menu className="h-4 w-4" />
                <span className="hidden xl:inline">More</span>
              </button>
            </nav>

            {/* Auth Section - Clean and compact */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {loading ? (
                <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              ) : user ? (
                <UserMenu user={user} />
              ) : (
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="relative group">
                    <button
                      onClick={() => openAuthModal('login')}
                      className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-300 transform hover:scale-105"
                    >
                      <LogIn className="w-5 h-5" />
                    </button>
                    
                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      Sign In
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <button
                      onClick={() => openAuthModal('signup')}
                      className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                    
                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      Sign Up
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-gray-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all duration-300 transform hover:scale-105"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation - Enhanced design */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200/50 py-4 animate-fade-in">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                        active
                          ? item.href === '/admin'
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                            : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                          : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="flex-1">{item.name}</span>
                      {active && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </Link>
                  );
                })}
                
                {/* Mobile Auth Buttons */}
                {!user && (
                  <div className="pt-4 border-t border-gray-200/50 space-y-2">
                    <button
                      onClick={() => {
                        openAuthModal('login');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-all duration-300"
                    >
                      <LogIn className="w-5 h-5" />
                      <span>Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        openAuthModal('signup');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>Sign Up</span>
                    </button>
                  </div>
                )}

                {/* User info in mobile menu */}
                {user && (
                  <div className="pt-4 border-t border-gray-200/50">
                    <div className="px-4 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg">
                          {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {user?.email}
                          </div>
                          <div className="flex items-center mt-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-xs text-green-600 font-medium">Online</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}