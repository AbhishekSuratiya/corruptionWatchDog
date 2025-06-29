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
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-lg blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <Shield className="h-6 w-6 text-white" />
                  <AlertTriangle className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-red-600 bg-clip-text text-transparent group-hover:from-red-600 group-hover:to-red-800 transition-all duration-300">
                  Corruption Watchdog
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Fighting Corruption Together</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
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

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              ) : user ? (
                <UserMenu user={user} />
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <GradientButton
                    variant="secondary"
                    size="sm"
                    onClick={() => openAuthModal('login')}
                    className="bg-white/10 backdrop-blur-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </GradientButton>
                  <GradientButton
                    size="sm"
                    onClick={() => openAuthModal('signup')}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up</span>
                  </GradientButton>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50/80 backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200/50 py-4 animate-fade-in">
              <nav className="flex flex-col space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center ${
                      isActive(item.href)
                        ? item.href === '/admin'
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                          : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                        : 'text-gray-700 hover:text-red-600 hover:bg-red-50/80 backdrop-blur-sm'
                    }`}
                  >
                    {item.name}
                    {item.href === '/admin' && (
                      <Settings className="w-4 h-4 ml-2" />
                    )}
                  </Link>
                ))}
                
                {/* Mobile Auth Buttons */}
                {!user && (
                  <div className="pt-4 border-t border-gray-200/50 space-y-2">
                    <button
                      onClick={() => {
                        openAuthModal('login');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50/80 transition-all duration-300"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        openAuthModal('signup');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Sign Up</span>
                    </button>
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