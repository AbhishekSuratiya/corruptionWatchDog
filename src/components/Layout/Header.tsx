import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X, AlertTriangle, LogIn, UserPlus, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import UserMenu from '../Auth/UserMenu';
import AuthModal from '../Auth/AuthModal';
import GradientButton from '../UI/GradientButton';

interface HeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

export default function Header({ isMenuOpen, setIsMenuOpen }: HeaderProps) {
  const location = useLocation();
  const { user, loading } = useAuth();
  const { isAdmin } = useAdmin();
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('login');

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Report Corruption', href: '/report' },
    { name: 'Defaulter Directory', href: '/directory' },
    { name: 'Heat Map', href: '/heatmap' },
    { name: 'About', href: '/about' }
  ];

  // Add admin link for admin users
  if (isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin' });
  }

  const isActive = (path: string) => location.pathname === path;

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section - Isolated with proper spacing */}
            <div className="flex items-center flex-shrink-0 mr-4 sm:mr-8 lg:mr-12">
              <Link to="/" className="flex items-center space-x-3 sm:space-x-4 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-lg blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative p-2 sm:p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    <AlertTriangle className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-red-600 bg-clip-text text-transparent group-hover:from-red-600 group-hover:to-red-800 transition-all duration-300 leading-tight">
                    Corruption Watchdog
                  </h1>
                  <p className="text-xs text-gray-500 -mt-0.5 leading-tight">Fighting Corruption Together</p>
                </div>
              </Link>
            </div>

            {/* Navigation Section - Flexible with proper constraints */}
            <div className="flex-1 flex justify-center min-w-0 mx-2 sm:mx-4">
              {/* Desktop Navigation - Better spacing and responsive breakpoints */}
              <nav className="hidden lg:flex items-center space-x-2 xl:space-x-3">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 xl:px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 whitespace-nowrap ${
                      isActive(item.href)
                        ? item.href === '/admin'
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                          : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                        : 'text-gray-700 hover:text-red-600 hover:bg-red-50/80 backdrop-blur-sm'
                    }`}
                  >
                    {item.name}
                    {item.href === '/admin' && (
                      <Settings className="w-3 h-3 ml-1 inline" />
                    )}
                  </Link>
                ))}
              </nav>

              {/* Tablet Navigation - Show condensed nav for medium screens */}
              <nav className="hidden md:flex lg:hidden items-center space-x-2">
                {navigation.slice(0, 3).map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                        : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {item.name === 'Report Corruption' ? 'Report' : item.name}
                  </Link>
                ))}
                {/* More menu for remaining items */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
                >
                  More
                </button>
              </nav>
            </div>

            {/* Auth Section - Right aligned with proper spacing and constraints */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 min-w-0">
              {loading ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              ) : user ? (
                <div className="max-w-[200px] sm:max-w-[240px] w-full">
                  <UserMenu user={user} />
                </div>
              ) : (
                <div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
                  <GradientButton
                    variant="secondary"
                    size="sm"
                    onClick={() => openAuthModal('login')}
                    className="bg-white/10 backdrop-blur-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="hidden md:inline ml-2">Sign In</span>
                  </GradientButton>
                  <GradientButton
                    size="sm"
                    onClick={() => openAuthModal('signup')}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden md:inline ml-2">Sign Up</span>
                  </GradientButton>
                </div>
              )}

              {/* Mobile menu button - Better positioning */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:flex lg:hidden p-2 sm:p-2.5 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50/80 backdrop-blur-sm transition-all duration-300 transform hover:scale-105 flex-shrink-0"
              >
                {isMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile/Tablet Navigation - Improved layout and spacing */}
          {isMenuOpen && (
            <div className="lg:hidden border-t border-gray-200/50 py-4 animate-fade-in">
              <nav className="flex flex-col space-y-3">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center justify-between px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive(item.href)
                        ? item.href === '/admin'
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                          : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                        : 'text-gray-700 hover:text-red-600 hover:bg-red-50/80 backdrop-blur-sm'
                    }`}
                  >
                    <span className="flex items-center">
                      {item.name}
                      {item.href === '/admin' && (
                        <Settings className="w-4 h-4 ml-2" />
                      )}
                    </span>
                    {isActive(item.href) && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </Link>
                ))}
                
                {/* Mobile Auth Buttons - Better spacing */}
                {!user && (
                  <div className="pt-4 border-t border-gray-200/50 space-y-3">
                    <button
                      onClick={() => {
                        openAuthModal('login');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center space-x-3 px-5 py-3 rounded-xl text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50/80 transition-all duration-300 border border-gray-200"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        openAuthModal('signup');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center space-x-3 px-5 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Sign Up</span>
                    </button>
                  </div>
                )}

                {/* User info in mobile menu */}
                {user && (
                  <div className="pt-4 border-t border-gray-200/50">
                    <div className="px-5 py-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {user?.email}
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