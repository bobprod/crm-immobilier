'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Home,
  Users,
  Building2,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Target,
  MessageSquare,
  Sparkles,
  CheckSquare,
  Zap,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';

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

  // Determine active tab based on current route
  const getActiveTab = () => {
    const path = router.pathname;
    if (path === '/dashboard' || path === '/') return 'dashboard';
    if (path.startsWith('/ai-assistant')) return 'ai-assistant';
    if (path.startsWith('/prospecting')) return 'prospecting';
    if (path.startsWith('/properties')) return 'properties';
    if (path.startsWith('/prospects')) return 'prospects';
    if (path.startsWith('/matching')) return 'matching';
    if (path.startsWith('/appointments')) return 'appointments';
    if (path.startsWith('/tasks')) return 'tasks';
    if (path.startsWith('/communications')) return 'communications';
    if (path.startsWith('/notifications')) return 'notifications';
    if (path.startsWith('/analytics') || path.startsWith('/ai-metrics')) return 'analytics';
    if (path.startsWith('/validation')) return 'validation';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  // Show loading only while actually loading, or while checking test mode
  if (!readyToRender || (loading && !disableAuthRedirect && !isTestMode)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
}

const menuItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: Home, href: '/dashboard' },
  { id: 'prospecting', label: 'Prospection IA', icon: Sparkles, href: '/prospecting', highlight: true },
  { id: 'properties', label: 'Propriétés', icon: Building2, href: '/properties' },
  { id: 'prospects', label: 'Prospects', icon: Users, href: '/prospects' },
  { id: 'matching', label: 'Matching', icon: Target, href: '/matching' },
  { id: 'appointments', label: 'Rendez-vous', icon: Calendar, href: '/appointments' },
  { id: 'tasks', label: 'Tâches', icon: CheckSquare, href: '/tasks' },
  { id: 'communications', label: 'Communications', icon: MessageSquare, href: '/communications' },
  { id: 'notifications', label: 'Notifications', icon: Bell, href: '/notifications' },
  { id: 'validation', label: 'Validation', icon: Shield, href: '/validation' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { id: 'settings', label: 'Paramètres', icon: Settings, href: '/settings' },
];

const handleNavigation = (tabId: string, href: string) => {
  if (mounted) {
    router.push(href);
    // ✅ FIX: Fermer la sidebar sur mobile après navigation
    setSidebarOpen(false);
  }
};

const handleLogout = async () => {
  await logout();
  // Redirect to login page after logout
  router.push('/login');
};

return (
  <div className="flex h-screen bg-gray-50">
    {/* Mobile overlay */}
    {sidebarOpen && (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={() => setSidebarOpen(false)}
      />
    )}

    {/* Sidebar */}
    <div className={`fixed lg:static inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out z-50 lg:z-auto w-64 bg-white shadow-lg flex flex-col`}>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">CRM Immobilier</h1>
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.id, item.href)}
            className={`w-full flex items-center px-6 py-3 text-left transition-colors ${activeTab === item.id
              ? 'bg-primary-foreground text-primary border-r-2 border-primary'
              : (item as any).highlight
                ? 'text-purple-700 bg-purple-50 hover:bg-purple-100 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <item.icon className={`w-5 h-5 mr-3 ${(item as any).highlight && activeTab !== item.id ? 'text-purple-600' : ''}`} />
            {item.label}
            {(item as any).highlight && activeTab !== item.id && (
              <span className="ml-auto text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">IA</span>
            )}
          </button>
        ))}
      </nav>

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
