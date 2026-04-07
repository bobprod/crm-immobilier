import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import {
  LayoutDashboard,
  Search,
  Target,
  CalendarDays,
  MessageSquare,
  FileText,
  HeartHandshake,
  Megaphone,
  TrendingUp,
  Globe,
  BarChart3,
  Bot,
  Bell,
  Settings,
  KeyRound,
  Puzzle,
  Wrench,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Building2,
  UserCircle,
  Users,
} from 'lucide-react';

/**
 * Sidebar Navigation Component
 *
 * Elegant sidebar navigation with:
 * - Lucide icons (professional, consistent)
 * - Dark theme for a sophisticated real estate look
 * - Hierarchical menu structure
 * - Active state highlighting
 * - Expandable sub-menus
 * - Notification badges
 * - Responsive (collapsible)
 */

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  badge?: number;
  subItems?: MenuItem[];
}

export interface SidebarProps {
  /** Show sidebar collapsed (icons only) */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onToggleCollapse?: () => void;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    id: 'prospection',
    label: 'Prospection',
    icon: Search,
    path: '/prospection',
  },
  {
    id: 'prospects',
    label: 'Prospects',
    icon: UserCircle,
    path: '/prospects',
  },
  {
    id: 'properties',
    label: 'Propriétés',
    icon: Building2,
    path: '/properties',
  },
  {
    id: 'matching',
    label: 'Matching',
    icon: Target,
    path: '/matching',
  },
  {
    id: 'planification',
    label: 'Planification',
    icon: CalendarDays,
    path: '/planification',
  },
  {
    id: 'communications',
    label: 'Communications',
    icon: MessageSquare,
    path: '/communications-dashboard',
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    path: '/documents',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: HeartHandshake,
    path: '/transactions-dashboard',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    path: '/marketing-dashboard',
  },
  {
    id: 'investment',
    label: 'Investissement',
    icon: TrendingUp,
    path: '/investment',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/analytics',
  },
  {
    id: 'personnel',
    label: 'Personnel',
    icon: Users,
    path: '/personnel',
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: Settings,
    subItems: [
      {
        id: 'settings-api-keys',
        label: 'Clés API',
        icon: KeyRound,
        path: '/settings/ai-api-keys',
      },
      {
        id: 'settings-modules',
        label: 'Modules',
        icon: Puzzle,
        path: '/settings/modules',
      },
      {
        id: 'settings-config',
        label: 'Configuration',
        icon: Wrench,
        path: '/settings/config',
      },
      {
        id: 'settings-integrations',
        label: 'Intégrations',
        icon: Globe,
        path: '/settings/integrations',
      },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggleCollapse }) => {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['prospection']));

  const isActive = (path?: string) => {
    if (!path) return false;
    return router.pathname === path || router.pathname.startsWith(path + '/');
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const active = isActive(item.path);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const Icon = item.icon;

    return (
      <div key={item.id}>
        {/* Main Item */}
        <div
          className={`
            flex items-center gap-3 cursor-pointer transition-all duration-150 rounded-lg mx-2 my-1
            ${level > 0 ? 'pl-9 pr-3 py-2' : 'px-3 py-2.5'}
            ${
              active
                ? 'bg-white/15 text-white'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }
            ${collapsed ? 'justify-center px-2' : ''}
          `}
          onClick={() => {
            if (hasSubItems) {
              toggleExpanded(item.id);
            } else if (item.path) {
              router.push(item.path);
            }
          }}
        >
          {/* Icon */}
          <Icon
            className={`flex-shrink-0 ${active ? 'text-amber-400' : 'text-slate-400'} ${level > 0 ? 'w-4 h-4' : 'w-5 h-5'}`}
          />

          {/* Label & Badge */}
          {!collapsed && (
            <>
              <span
                className={`flex-1 text-sm ${active ? 'font-semibold text-white' : 'font-medium'}`}
              >
                {item.label}
              </span>

              {/* Badge */}
              {item.badge && (
                <span className="bg-amber-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}

              {/* Expand Arrow */}
              {hasSubItems && (
                <span className="text-slate-400">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>
              )}
            </>
          )}
        </div>

        {/* Sub Items */}
        {hasSubItems && isExpanded && !collapsed && (
          <div className="mt-0.5">
            {item.subItems!.map((subItem) => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`
        relative h-screen bg-slate-900 flex flex-col
        transition-all duration-300 ease-in-out shadow-xl
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Header */}
      <div
        className={`flex items-center border-b border-slate-700/60 ${collapsed ? 'justify-center p-4' : 'justify-between px-5 py-5'}`}
      >
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide">CRM Immo</h1>
              <p className="text-xs text-slate-400">Gestion Immobilière</p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center shadow-md">
            <Building2 className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          title={collapsed ? 'Développer le menu' : 'Réduire le menu'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-1 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
        <div className="space-y-0.5">{MENU_ITEMS.map((item) => renderMenuItem(item))}</div>
      </nav>

      {/* Footer */}
      <div className={`border-t border-slate-700/60 ${collapsed ? 'p-3' : 'p-4'}`}>
        {!collapsed && (
          <div className="mb-3">
            <LanguageSwitcher />
          </div>
        )}
        {collapsed ? (
          <div className="flex justify-center">
            <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-slate-300" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
              <UserCircle className="w-5 h-5 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin</p>
              <p className="text-xs text-slate-400 truncate">admin@crm-immo.fr</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
