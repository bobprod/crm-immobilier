import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LogOut, Menu, X, ChevronDown, Settings, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import DynamicMenu from './DynamicMenu';

interface LayoutProps {
  children: React.ReactNode;
  initialTab?: string;
  disableAuthRedirect?: boolean;
}

// Splash Screen component with animated progress
function SplashScreen() {
  const [progress, setProgress] = useState(0);
  const steps = [
    'Chargement des modules...',
    'Connexion securisee...',
    'Preparation du tableau de bord...',
  ];
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 2;
      });
    }, 30);
    const stepInterval = setInterval(() => {
      setStepIdx((s) => Math.min(s + 1, steps.length - 1));
    }, 600);
    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, hsl(222,70%,14%) 0%, hsl(222,60%,22%) 100%)' }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-96 h-96 rounded-full border border-white/5 animate-ping"
          style={{ animationDuration: '3s' }}
        />
        <div
          className="absolute w-64 h-64 rounded-full border border-white/5 animate-ping"
          style={{ animationDuration: '2s' }}
        />
      </div>
      <div className="relative z-10 flex flex-col items-center">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
        >
          <svg
            className="w-10 h-10 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1 tracking-wide">CRM Immo</h1>
        <p className="text-slate-400 text-sm mb-10">Chargement de votre espace...</p>
        <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            }}
          />
        </div>
        <p className="text-xs text-slate-500 h-4">{steps[stepIdx]}</p>
      </div>
    </div>
  );
}

// User avatar with initials and role badge
function UserAvatar({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const roleColors: Record<string, string> = {
    ADMIN: 'bg-amber-500/20 text-amber-300',
    MANAGER: 'bg-blue-500/20 text-blue-300',
    AGENT: 'bg-green-500/20 text-green-300',
  };
  const roleLabel: Record<string, string> = {
    ADMIN: 'Administrateur',
    MANAGER: 'Manager',
    AGENT: 'Agent',
  };
  const roleKey = role?.toUpperCase() || 'AGENT';

  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white shadow-md"
        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
      >
        {initials || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate leading-tight">{name}</p>
        <span
          className={`inline-block text-xs px-1.5 py-0.5 rounded-md font-medium mt-0.5 ${roleColors[roleKey] || roleColors['AGENT']}`}
        >
          {roleLabel[roleKey] || role}
        </span>
      </div>
      <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
    </div>
  );
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
  const [isTestMode, setIsTestMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const isTestModeFallback =
      typeof window !== 'undefined' &&
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
    return <SplashScreen />;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleMenuNavigation = () => {
    setSidebarOpen(false);
  };

  const userName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    : 'Utilisateur';
  const userRole = user?.role || 'AGENT';

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 shadow-xl transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-auto
          flex flex-col
        `}
        style={{
          background: 'linear-gradient(180deg, hsl(222,50%,14%) 0%, hsl(222,45%,18%) 100%)',
        }}
      >
        {/* Logo / Header */}
        <div className="px-5 py-5 border-b border-slate-700/60 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">CRM Immo</h1>
            <p className="text-xs text-slate-400">Gestion Immobiliere</p>
          </div>
        </div>

        {/* Dynamic Menu */}
        <DynamicMenu onNavigate={handleMenuNavigation} />

        {/* User profile block */}
        <div className="border-t border-slate-700/60 px-3 pt-3 pb-2 mt-auto">
          <div className="relative">
            <div onClick={() => setShowUserMenu(!showUserMenu)}>
              <UserAvatar name={userName} role={userRole} />
            </div>
            {showUserMenu && (
              <div
                className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="px-4 py-3 border-b border-slate-700/60">
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push('/settings');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4" /> Mon profil
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push('/settings');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-left"
                >
                  <Settings className="w-4 h-4" /> Parametres
                </button>
                <div className="border-t border-slate-700/60">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" /> Deconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900 shadow-lg text-white"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
