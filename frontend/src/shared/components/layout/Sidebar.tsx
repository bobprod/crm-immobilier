import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Bot,
  Shuffle,
  CalendarDays,
  MessageSquare,
  FileText,
  Handshake,
  Megaphone,
  Gem,
  Globe,
  BarChart3,
  BrainCircuit,
  Bell,
  Settings,
  Key,
  Puzzle,
  Wrench,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  LucideIcon,
} from 'lucide-react';

/**
 * Sidebar Navigation Component
 *
 * Modern sidebar navigation with:
 * - Hierarchical menu structure
 * - Active state highlighting (Navy palette)
 * - Expandable sub-menus with smooth transitions
 * - Notification badges
 * - Responsive (collapsible)
 * - Lucide React icons for professional consistency
 *
 * Phase 2.1: UX/UI Restructuring — Navy/Amber premium palette
 */

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
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
    icon: Bot,
    path: '/prospection',
  },
  {
    id: 'matching',
    label: 'Matching',
    icon: Shuffle,
    path: '/matching-dashboard',
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
    icon: Handshake,
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
    icon: Gem,
    path: '/investment',
  },
  {
    id: 'vitrine',
    label: 'Sites Vitrines',
    icon: Globe,
    path: '/sites-vitrines-dashboard',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/analytics',
  },
  {
    id: 'ai-assistant',
    label: 'Assistant IA',
    icon: BrainCircuit,
    path: '/ai-assistant',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    path: '/notifications',
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: Settings,
    subItems: [
      {
        id: 'settings-api-keys',
        label: 'Clés API',
        icon: Key,
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
    const IconComponent = item.icon;

    return (
      <div key={item.id}>
        {/* Main Item */}
        <div
          className={`
            flex items-center gap-2.5 py-2.5 cursor-pointer transition-all duration-150 select-none
            ${level > 0 ? 'pl-11 pr-3' : 'px-3'}
            ${active
              ? 'bg-navy-100 text-navy-700 border-r-[3px] border-navy-600 font-semibold'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
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
          title={collapsed ? item.label : undefined}
        >
          {/* Icon */}
          <IconComponent
            className={`flex-shrink-0 transition-colors ${
              active ? 'text-navy-600' : 'text-gray-400 group-hover:text-gray-600'
            }`}
            size={18}
            strokeWidth={active ? 2.25 : 1.75}
          />

          {/* Label & Badge */}
          {!collapsed && (
            <>
              <span className="flex-1 text-sm">{item.label}</span>

              {/* Notification Badge */}
              {item.badge && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {item.badge}
                </span>
              )}

              {/* Expand Arrow */}
              {hasSubItems && (
                <span className="text-gray-400 transition-transform duration-200">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              )}
            </>
          )}
        </div>

        {/* Sub Items */}
        {hasSubItems && isExpanded && !collapsed && (
          <div className="bg-gray-50/60 border-l-2 border-gray-100 ml-5">
            {item.subItems!.map((subItem) => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`
        h-screen bg-white border-r border-gray-200 flex flex-col
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[60px]' : 'w-60'}
      `}
    >
      {/* Header */}
      <div className={`border-b border-gray-100 flex items-center ${collapsed ? 'p-3 justify-center' : 'px-4 py-3.5 justify-between'}`}>
        {!collapsed && (
          <div>
            <h1 className="text-base font-bold text-navy-600 tracking-tight">CRM Immo</h1>
            <p className="text-[11px] text-gray-400 font-medium tracking-wide uppercase">Prospection IA</p>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <PanelLeftOpen size={18} />
            : <PanelLeftClose size={18} />
          }
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        {MENU_ITEMS.map((item) => renderMenuItem(item))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3.5 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-navy-700 text-xs font-bold">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Admin User</p>
              <p className="text-[11px] text-gray-400 truncate">admin@crm.com</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
