import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { useMenu } from '@/shared/hooks/useMenu';
import type { DynamicMenuItem } from '@/shared/utils/module-registry-api';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Building2,
  UserCircle,
  Circle,
  Home,
  Users,
  Search,
  Target,
  ArrowLeftRight,
  CalendarDays,
  MessageSquare,
  Megaphone,
  TrendingUp,
  DollarSign,
  FileText,
} from 'lucide-react';

// Static icon map — tree-shakeable, avoids bundling all lucide icons
const ICON_MAP: Record<string, React.ElementType> = {
  Home,
  Building2,
  Users,
  Search,
  Target,
  ArrowLeftRight,
  CalendarDays,
  MessageSquare,
  Megaphone,
  TrendingUp,
  DollarSign,
  FileText,
  Circle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
};

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggleCollapse }) => {
  const router = useRouter();
  const { menuItems, loading } = useMenu();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Prefetch all menu routes so subsequent navigations are instant
  useEffect(() => {
    const allPaths = (items: DynamicMenuItem[]): string[] =>
      items.flatMap((item) => [
        ...(item.path && item.moduleId !== 'section' ? [item.path.split('?')[0]] : []),
        ...(item.children ? allPaths(item.children) : []),
      ]);
    allPaths(menuItems).forEach((path) => router.prefetch(path));
  }, [menuItems, router]);

  // Auto-expand parent items when the current route matches a child
  useEffect(() => {
    const path = router.pathname;
    const toExpand = new Set<string>();
    const checkChildren = (items: DynamicMenuItem[]) => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          const childMatch = item.children.some(
            (c) => path === c.path || path.startsWith(c.path + '/')
          );
          if (childMatch) toExpand.add(item.id);
          // Check deeper nesting
          for (const child of item.children) {
            if (child.children && child.children.length > 0) {
              const deepMatch = child.children.some(
                (gc) => path === gc.path || path.startsWith(gc.path + '/')
              );
              if (deepMatch) {
                toExpand.add(item.id);
                toExpand.add(child.id);
              }
            }
          }
        }
      }
    };
    checkChildren(menuItems);
    if (toExpand.size > 0) {
      setExpandedItems((prev) => new Set([...prev, ...toExpand]));
    }
  }, [router.pathname, menuItems]);

  const isActive = (path?: string) => {
    if (!path) return false;
    // Support query params in menu paths (e.g. /gestion-immobiliere?tab=owners)
    if (path.includes('?')) {
      const [basePath, query] = path.split('?');
      if (router.pathname !== basePath) return false;
      const params = new URLSearchParams(query);
      for (const [key, value] of params.entries()) {
        if (router.query[key] !== value) return false;
      }
      return true;
    }
    return router.pathname === path || router.pathname.startsWith(path + '/');
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const getIcon = (iconName?: string): React.ElementType => {
    if (!iconName) return Circle;
    return ICON_MAP[iconName] || Circle;
  };

  const renderMenuItem = (item: DynamicMenuItem, level: number = 0) => {
    // Render section headers
    if (item.moduleId === 'section') {
      if (collapsed) return null;
      return (
        <div key={item.id} className="px-4 pt-5 pb-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {item.label}
          </span>
        </div>
      );
    }

    const active = isActive(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const Icon = getIcon(item.icon);

    return (
      <div key={item.id}>
        <div
          className={`
            flex items-center gap-3 cursor-pointer transition-all duration-150 rounded-lg mx-2 my-0.5
            ${level === 0 ? 'px-3 py-2.5' : level === 1 ? 'pl-9 pr-3 py-2' : 'pl-12 pr-3 py-1.5'}
            ${active ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}
            ${collapsed ? 'justify-center px-2' : ''}
          `}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
              // Also navigate to the parent path
              if (item.path) router.push(item.path);
            } else if (item.path) {
              router.push(item.path);
            }
          }}
        >
          <Icon
            className={`flex-shrink-0 ${active ? 'text-amber-400' : 'text-slate-400'} ${level > 0 ? 'w-4 h-4' : 'w-5 h-5'}`}
          />
          {!collapsed && (
            <>
              <span
                className={`flex-1 text-sm ${active ? 'font-semibold text-white' : 'font-medium'} truncate`}
              >
                {item.label}
              </span>
              {hasChildren && (
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

        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-0.5">
            {item.children!.map((child) => renderMenuItem(child, level + 1))}
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
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          title={collapsed ? 'Développer le menu' : 'Réduire le menu'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Menu - Dynamic from API */}
      <nav className="flex-1 overflow-y-auto py-4 px-1 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400" />
          </div>
        ) : (
          <div className="space-y-0.5">{menuItems.map((item) => renderMenuItem(item))}</div>
        )}
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
