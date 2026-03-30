'use client';

import { useRouter } from 'next/router';
import * as LucideIcons from 'lucide-react';
import { useMenu } from '@/shared/hooks/useMenu';
import type { DynamicMenuItem } from '@/shared/utils/module-registry-api';

interface DynamicMenuProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

export default function DynamicMenu({ onNavigate, collapsed = false }: DynamicMenuProps) {
  const router = useRouter();
  const { menuItems, loading, error } = useMenu();

  const getActiveItemId = (): string | null => {
    const path = router.pathname;
    const findActiveItem = (items: DynamicMenuItem[]): string | null => {
      for (const item of items) {
        if (item.path === path) return item.id;
        if (path.startsWith(item.path) && item.path !== '/') return item.id;
        if (item.children) {
          const childMatch = findActiveItem(item.children);
          if (childMatch) return childMatch;
        }
      }
      return null;
    };
    return findActiveItem(menuItems);
  };

  const activeItemId = getActiveItemId();

  const handleNavigation = (path: string) => {
    router.push(path);
    onNavigate?.();
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return LucideIcons.Circle;
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Circle;
  };

  const renderMenuItem = (item: DynamicMenuItem, depth = 0) => {
    const Icon = getIcon(item.icon);
    const isActive = activeItemId === item.id;

    return (
      <div key={item.id} className="px-3 mb-1">
        <button
          onClick={() => handleNavigation(item.path)}
          title={collapsed ? item.label : undefined}
          className={`
            w-full flex items-center p-2.5 rounded-xl transition-all duration-200
            ${depth > 0 && !collapsed ? 'pl-8' : ''}
            ${collapsed ? 'justify-center' : 'gap-3'}
            ${
              isActive
                ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }
          `}
        >
          <Icon className={`${collapsed ? 'w-5 h-5' : 'w-5 h-5'} ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`} />
          {!collapsed && (
            <span className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
              {item.label}
            </span>
          )}
        </button>

        {/* Sous-menus (only if not collapsed for now for simplicity, or could be tooltips) */}
        {!collapsed && item.children &&
          item.children.length > 0 &&
          item.children.map((child) => renderMenuItem(child, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-full bg-secondary/50 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <nav className="flex-1 space-y-1">
      {menuItems.map((item) => renderMenuItem(item))}
    </nav>
  );
}
