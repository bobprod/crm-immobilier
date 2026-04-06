import React from 'react';
import { useRouter } from 'next/router';
import { Bell, Globe, Bot, Search } from 'lucide-react';

/**
 * TopBar - Barre d'outils secondaire (toolbar)
 *
 * UX Pattern: Utility Navigation
 * - S\u00e9pare la navigation principale (sidebar = workflow)
 *   des outils transversaux (notifications, vitrines, IA)
 * - Position fixe en haut, toujours accessible
 * - Ic\u00f4nes + labels courts pour scannabilit\u00e9 rapide
 * - Espacement a\u00e9r\u00e9 pour \u00e9viter la surcharge cognitive
 */

interface TopBarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
  accent?: boolean;
}

const TOOLBAR_ITEMS: TopBarItem[] = [
  {
    id: 'vitrine',
    label: 'Sites Vitrines',
    icon: Globe,
    path: '/vitrine',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    path: '/notifications',
    badge: 0,
  },
  {
    id: 'ai-assistant',
    label: 'Assistant IA',
    icon: Bot,
    path: '/ai-assistant',
    accent: true,
  },
];

export const TopBar: React.FC = () => {
  const router = useRouter();

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(path + '/');
  };

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-0 flex items-center justify-between shadow-sm">
      {/* Left: Search (contexte rapide) */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Recherche rapide..."
            className="w-full pl-9 pr-4 py-2 my-2 text-sm bg-slate-50 border border-slate-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400
                       placeholder:text-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Right: Utility actions */}
      <div className="flex items-center gap-1">
        {TOOLBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={`
                relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium
                transition-all duration-150
                ${
                  active
                    ? 'bg-slate-100 text-slate-900'
                    : item.accent
                      ? 'text-amber-700 hover:bg-amber-50 hover:text-amber-800'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }
              `}
              title={item.label}
            >
              <Icon
                className={`w-[18px] h-[18px] ${active ? 'text-amber-500' : item.accent ? 'text-amber-600' : ''}`}
              />
              <span className="hidden lg:inline">{item.label}</span>

              {/* Notification badge */}
              {item.id === 'notifications' && item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center min-w-[18px] px-1">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
