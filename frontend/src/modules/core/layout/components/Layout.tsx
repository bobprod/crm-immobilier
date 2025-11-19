'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Home, Users, Building2, Calendar, BarChart3, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';

interface LayoutProps {
  children: React.ReactNode;
  initialTab?: string;
}

export default function Layout({ children, initialTab = 'dashboard' }: LayoutProps) {
  const router = useRouter();
  const { user, loading, logout } = useAuth(); // Destructure loading from useAuth
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid server-side rendering issues and initial hydration mismatches
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle redirection only after client-side mount and auth loading is complete
  if (!user && mounted && !loading) {
    router.push('/login');
    return null; // Return null to prevent rendering content before redirection
  }

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home, href: '/dashboard' },
    { id: 'properties', label: 'Propriétés', icon: Building2, href: '/properties' },
    { id: 'prospects', label: 'Prospects', icon: Users, href: '/prospects' },
    { id: 'appointments', label: 'Rendez-vous', icon: Calendar, href: '/appointments' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { id: 'settings', label: 'Paramètres', icon: Settings, href: '/settings' },
  ];

  const handleNavigation = (tabId: string, href: string) => {
    setActiveTab(tabId);
    if (mounted) {
      router.push(href);
    }
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    // Redirect to login page after logout
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block lg:w-64 bg-white shadow-lg`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">CRM Immobilier</h1>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id, item.href)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-100 ${activeTab === item.id ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'
                }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-6">
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
