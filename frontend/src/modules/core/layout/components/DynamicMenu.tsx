'use client';

import { useRouter } from 'next/router';
import * as LucideIcons from 'lucide-react';
import { useMenu } from '@/shared/hooks/useMenu';
import type { DynamicMenuItem } from '@/shared/utils/module-registry-api';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * DynamicMenu Component
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Composant de menu dynamique qui charge ses items depuis l'API Module Registry.
 *
 * Le menu est généré automatiquement en fonction:
 * - Des modules activés pour l'agence de l'utilisateur
 * - Du rôle de l'utilisateur (filtrage RBAC côté API)
 * - De l'ordre défini dans le manifest du module
 *
 * @props
 * - onNavigate: (optional) Callback appelé après navigation (ex: fermer sidebar mobile)
 */

interface DynamicMenuProps {
  onNavigate?: () => void;
}

export default function DynamicMenu({ onNavigate }: DynamicMenuProps) {
  const router = useRouter();
  const { menuItems, loading, error } = useMenu();

  // Déterminer l'item actif en fonction de l'URL
  const getActiveItemId = (): string | null => {
    const path = router.pathname;

    // Trouver l'item qui match le path actuel
    const findActiveItem = (items: DynamicMenuItem[]): string | null => {
      for (const item of items) {
        // Match exact
        if (item.path === path) return item.id;

        // Match prefix (ex: /properties/123 match /properties)
        if (path.startsWith(item.path) && item.path !== '/') return item.id;

        // Rechercher dans les enfants
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

  /**
   * Gestion de la navigation
   */
  const handleNavigation = (path: string) => {
    router.push(path);
    onNavigate?.();
  };

  /**
   * Résoudre l'icône Lucide depuis le nom de string
   * Ex: "Home" → <Home />
   */
  const getIcon = (iconName?: string) => {
    if (!iconName) return LucideIcons.Circle;

    // Récupérer l'icône depuis lucide-react
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Circle;
  };

  /**
   * Rendu d'un item de menu (récursif pour les sous-menus)
   */
  const renderMenuItem = (item: DynamicMenuItem, depth = 0) => {
    const Icon = getIcon(item.icon);
    const isActive = activeItemId === item.id;

    return (
      <div key={item.id} className="px-2">
        <button
          onClick={() => handleNavigation(item.path)}
          className={`
            w-full flex items-center gap-3 rounded-lg transition-all duration-150 text-left
            ${depth > 0 ? 'pl-9 pr-3 py-2' : 'px-3 py-2.5'}
            ${
              isActive
                ? 'bg-white/15 text-white'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }
          `}
        >
          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className={`text-sm ${isActive ? 'font-semibold text-white' : 'font-medium'}`}>
            {item.label}
          </span>
        </button>

        {/* Sous-menus récursifs */}
        {item.children &&
          item.children.length > 0 &&
          item.children.map((child) => renderMenuItem(child, depth + 1))}
      </div>
    );
  };

  /**
   * États de chargement et d'erreur
   */
  if (loading) {
    return (
      <nav className="mt-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400"></div>
        </div>
      </nav>
    );
  }

  if (error) {
    return (
      <nav className="mt-4 flex-1 overflow-y-auto">
        <div className="px-5 py-3 text-xs text-slate-400">
          <p className="text-red-400">Erreur de chargement du menu</p>
          <p className="text-slate-500 mt-0.5">Menu par défaut utilisé</p>
        </div>
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
    );
  }

  /**
   * Rendu normal du menu
   */
  return (
    <nav className="mt-4 flex-1 overflow-y-auto py-1">
      {menuItems.length === 0 ? (
        <div className="px-5 py-4 text-sm text-slate-400">
          Aucun module activé
        </div>
      ) : (
        menuItems.map((item) => renderMenuItem(item))
      )}
    </nav>
  );
}
