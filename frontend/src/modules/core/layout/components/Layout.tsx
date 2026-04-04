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
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 shadow-xl transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-auto
          flex flex-col
        `}
      >
        {/* Logo / Header */}
        <div className="px-5 py-5 border-b border-slate-700/60 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">CRM Immo</h1>
            <p className="text-xs text-slate-400">Gestion Immobilière</p>
          </div>
        </div>

        {/* Dynamic Menu - Replace hardcoded menu */}
        <DynamicMenu onNavigate={handleMenuNavigation} />

        {/* Logout button */}
        <div className="border-t border-slate-700/60 p-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-full px-3 py-2 rounded-lg hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900 shadow-lg text-white"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
