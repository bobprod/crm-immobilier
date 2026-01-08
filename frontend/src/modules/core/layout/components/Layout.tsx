import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import DynamicMenu from './DynamicMenu';

interface LayoutProps {
  children: React.ReactNode;
  initialTab?: string;
  disableAuthRedirect?: boolean;
}

export default function Layout({
  children,
  initialTab = 'dashboard',
  disableAuthRedirect = false,
}: LayoutProps) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [readyToRender, setReadyToRender] = useState(false);

  // Check test mode ASAP
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    // On client mount, check if testMode is in URL
    const isTestModeFallback = typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('testMode') === 'true';

    setIsTestMode(isTestModeFallback);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Handle redirection only after client-side mount and auth loading is complete
    // For testing purposes, also check for auth_token in localStorage
    const hasAuthToken = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');
    const shouldDisableRedirect = disableAuthRedirect || isTestMode;

    if (!shouldDisableRedirect && !user && !loading && !hasAuthToken) {
      console.log('Layout: Redirecting to login');
      router.push('/login');
    }

    // Always ready to render after mounted
    setReadyToRender(true);
  }, [user, loading, mounted, disableAuthRedirect, isTestMode, router]);

  // Show loading only while actually loading, or while checking test mode
  if (!readyToRender || (loading && !disableAuthRedirect && !isTestMode)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    // Redirect to login page after logout
    router.push('/login');
  };

  const handleMenuNavigation = () => {
    // Fermer la sidebar sur mobile après navigation
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-auto
          flex flex-col
        `}
      >
        {/* Logo / Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-primary">CRM Immobilier</h1>
        </div>

        {/* Dynamic Menu - Replace hardcoded menu */}
        <DynamicMenu onNavigate={handleMenuNavigation} />

        {/* Logout button */}
        <div className="border-t border-gray-200 p-6 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-700 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
