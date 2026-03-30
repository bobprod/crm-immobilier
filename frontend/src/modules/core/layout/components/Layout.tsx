import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LogOut, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [readyToRender, setReadyToRender] = useState(false);

  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    const isTestModeFallback = typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('testMode') === 'true';

    setIsTestMode(isTestModeFallback);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const hasAuthToken = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');
    const shouldDisableRedirect = disableAuthRedirect || isTestMode;

    if (!shouldDisableRedirect && !user && !loading && !hasAuthToken) {
      router.push('/login');
    }
    setReadyToRender(true);
  }, [user, loading, mounted, disableAuthRedirect, isTestMode, router]);

  if (!readyToRender || (loading && !disableAuthRedirect && !isTestMode)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleMenuNavigation = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background font-inter antialiased">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 bg-white transform transition-all duration-300 ease-in-out shadow-ambient
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
          lg:translate-x-0 lg:static lg:inset-auto
          flex flex-col border-none
        `}
      >
        {/* Header / Logo */}
        <div className="p-6 flex items-center justify-between">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-extrabold tracking-tighter text-primary">
              CRM <span className="text-foreground">IMMO</span>
            </h1>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Dynamic Menu */}
        <div className="flex-1 overflow-y-auto py-4">
          <DynamicMenu onNavigate={handleMenuNavigation} collapsed={sidebarCollapsed} />
        </div>

        {/* User & Logout */}
        <div className="p-4 bg-secondary/30 mt-auto">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} mb-4`}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {user?.email?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-foreground">{user?.email || 'Admin'}</p>
                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">Agent Immobilier</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`
              flex items-center w-full p-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-2'}`} />
            {!sidebarCollapsed && 'Déconnexion'}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Trigger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white shadow-ambient border border-border"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-secondary/30 lg:m-2 lg:rounded-3xl lg:shadow-inner-soft">
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
