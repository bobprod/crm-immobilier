import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

/**
 * Sidebar Navigation Component
 *
 * Modern sidebar navigation with:
 * - Hierarchical menu structure
 * - Active state highlighting
 * - Expandable sub-menus
 * - Notification badges
 * - Responsive (collapsible)
 *
 * Phase 2.1: UX/UI Restructuring
 */

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
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
    icon: '📊',
    path: '/dashboard',
  },
  {
    id: 'prospection',
    label: 'Prospection',
    icon: '🤖',
    path: '/prospection',
  },
  {
    id: 'matching',
    label: 'Matching',
    icon: '🎯',
    path: '/matching-dashboard',
  },
  {
    id: 'planification',
    label: 'Planification',
    icon: '📅',
    path: '/planification',
  },
  {
    id: 'communications',
    label: 'Communications',
    icon: '💬',
    path: '/communications-dashboard',
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: '📄',
    path: '/documents',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: '🤝',
    path: '/transactions-dashboard',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: '📢',
    path: '/marketing-dashboard',
  },
  {
    id: 'investment',
    label: 'Investissement',
    icon: '💎',
    path: '/investment',
  },
  {
    id: 'vitrine',
    label: 'Sites Vitrines',
    icon: '🌐',
    path: '/sites-vitrines-dashboard',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: '📈',
    path: '/analytics',
  },
  {
    id: 'ai-assistant',
    label: 'Assistant IA',
    icon: '🤖',
    path: '/ai-assistant',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: '🔔',
    path: '/notifications',
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: '⚙️',
    subItems: [
      {
        id: 'settings-api-keys',
        label: 'Clés API',
        icon: '🔑',
        path: '/settings/ai-api-keys',
      },
      {
        id: 'settings-modules',
        label: 'Modules',
        icon: '🧩',
        path: '/settings/modules',
      },
      {
        id: 'settings-config',
        label: 'Configuration',
        icon: '🛠️',
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

    return (
      <div key={item.id}>
        {/* Main Item */}
        <div
          className={`
            flex items-center gap-3 px-4 py-3 cursor-pointer transition-all
            ${level > 0 ? 'pl-12' : ''}
            ${active ? 'bg-purple-100 text-purple-700 border-r-4 border-purple-700' : 'text-gray-700 hover:bg-gray-100'}
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
          <span className="text-2xl flex-shrink-0">{item.icon}</span>

          {/* Label & Badge */}
          {!collapsed && (
            <>
              <span className="flex-1 font-medium text-sm">{item.label}</span>

              {/* Badge */}
              {item.badge && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}

              {/* Expand Arrow */}
              {hasSubItems && (
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </>
          )}
        </div>

        {/* Sub Items */}
        {hasSubItems && isExpanded && !collapsed && (
          <div className="bg-gray-50">
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
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold text-purple-600">CRM Immo</h1>
            <p className="text-xs text-gray-500">Prospection IA</p>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            {collapsed ? (
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto">
        {MENU_ITEMS.map((item) => renderMenuItem(item))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-semibold">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@crm.com</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
