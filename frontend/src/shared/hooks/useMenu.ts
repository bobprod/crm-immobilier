import { useState, useEffect } from 'react';
import { moduleRegistryApi, DynamicMenuItem } from '@/shared/utils/module-registry-api';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * useMenu Hook
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Hook React pour récupérer le menu dynamique depuis l'API Module Registry.
 * Le menu est filtré automatiquement par:
 * - Les modules actifs de l'agence de l'utilisateur
 * - Le rôle de l'utilisateur (USER, AGENT, ADMIN, SUPER_ADMIN)
 *
 * @returns {
 *   menuItems: DynamicMenuItem[] - Items du menu
 *   loading: boolean - État de chargement
 *   error: Error | null - Erreur éventuelle
 *   refetch: () => void - Fonction pour recharger le menu
 * }
 *
 * @example
 * ```tsx
 * function Sidebar() {
 *   const { menuItems, loading, error } = useMenu();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return (
 *     <nav>
 *       {menuItems.map(item => (
 *         <NavItem key={item.id} {...item} />
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 */
export function useMenu() {
  const [menuItems, setMenuItems] = useState<DynamicMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);

      const items = await moduleRegistryApi.getMyMenu();

      // Supporter deux formes de réponse:
      // 1) Array directly: [{...}, ...]
      // 2) Object with `menu` property: { menu: [...], message?: '...' }
      let menuArray: any[] = [];

      if (Array.isArray(items)) {
        menuArray = items;
      } else if (items && Array.isArray((items as any).menu)) {
        menuArray = (items as any).menu;
        if ((items as any).message) {
          console.info('ℹ️ Menu API message:', (items as any).message);
        }
      } else {
        console.warn('⚠️ Menu API response is not an array or does not contain `menu`:', items);
        setMenuItems(getDefaultMenu());
        return;
      }

      // Trier les items par ordre
      const sortedItems = menuArray.sort((a, b) => (a.order || 0) - (b.order || 0));

      // Si aucun module activé, utiliser le menu par défaut
      if (sortedItems.length === 0) {
        setMenuItems(getDefaultMenu());
        return;
      }

      setMenuItems(sortedItems);
    } catch (err) {
      console.error('❌ Erreur lors du chargement du menu:', err);
      setError(err as Error);

      // En cas d'erreur, utiliser un menu par défaut (fallback)
      setMenuItems(getDefaultMenu());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  return {
    menuItems,
    loading,
    error,
    refetch: fetchMenu,
  };
}

/**
 * Menu par défaut utilisé comme fallback en cas d'erreur API
 * (Backend non disponible ou erreur réseau)
 */
function getDefaultMenu(): DynamicMenuItem[] {
  return [
    // ── Tableau de bord ──────────────────────────────────────────────
    {
      id: 'default-dashboard',
      moduleId: 'core',
      label: 'Tableau de bord',
      icon: 'Home',
      path: '/dashboard',
      order: 0,
    },

    // ── Portefeuille immobilier ──────────────────────────────────────
    {
      id: 'default-properties',
      moduleId: 'inventory-properties',
      label: 'Propriétés',
      icon: 'Building2',
      path: '/properties',
      order: 2,
    },
    {
      id: 'default-owners',
      moduleId: 'business-owners',
      label: 'Propriétaires',
      icon: 'UserCheck',
      path: '/owners',
      order: 3,
    },
    {
      id: 'default-mandates',
      moduleId: 'business-mandates',
      label: 'Mandats',
      icon: 'FileSignature',
      path: '/mandates',
      order: 4,
    },
    {
      id: 'default-transactions',
      moduleId: 'business-transactions',
      label: 'Transactions',
      icon: 'ArrowLeftRight',
      path: '/transactions-dashboard',
      order: 5,
    },
    {
      id: 'default-finance',
      moduleId: 'business-finance',
      label: 'Finance',
      icon: 'DollarSign',
      path: '/finance',
      order: 6,
    },

    // ── Prospection & Vente ──────────────────────────────────────────
    {
      id: 'default-prospecting',
      moduleId: 'ai-prospecting',
      label: 'Prospection IA',
      icon: 'Search',
      path: '/prospection',
      order: 10,
    },
    {
      id: 'default-prospects',
      moduleId: 'sales-prospects',
      label: 'Prospects',
      icon: 'Users',
      path: '/prospects',
      order: 11,
    },
    {
      id: 'default-matching',
      moduleId: 'sales-matching',
      label: 'Matching',
      icon: 'Target',
      path: '/matching',
      order: 12,
    },

    // ── Planning & Tâches ────────────────────────────────────────────
    {
      id: 'default-appointments',
      moduleId: 'business-appointments',
      label: 'Rendez-vous',
      icon: 'Calendar',
      path: '/appointments',
      order: 20,
    },
    {
      id: 'default-tasks',
      moduleId: 'business-tasks',
      label: 'Tâches',
      icon: 'CheckSquare',
      path: '/tasks',
      order: 21,
    },
    {
      id: 'default-planification',
      moduleId: 'business-planification',
      label: 'Planification',
      icon: 'CalendarDays',
      path: '/planification',
      order: 22,
    },

    // ── Communications ───────────────────────────────────────────────
    {
      id: 'default-communications',
      moduleId: 'communications',
      label: 'Communications',
      icon: 'MessageSquare',
      path: '/communications-dashboard',
      order: 30,
    },
    {
      id: 'default-notifications',
      moduleId: 'business-notifications',
      label: 'Notifications',
      icon: 'Bell',
      path: '/notifications',
      order: 31,
    },

    // ── Marketing & Analytiques ──────────────────────────────────────
    {
      id: 'default-marketing',
      moduleId: 'marketing-tracking',
      label: 'Marketing',
      icon: 'TrendingUp',
      path: '/marketing-dashboard',
      order: 40,
    },
    {
      id: 'default-analytics',
      moduleId: 'business-analytics',
      label: 'Analytiques',
      icon: 'BarChart',
      path: '/analytics',
      order: 41,
    },
    {
      id: 'default-ai-assistant',
      moduleId: 'ai-assistant',
      label: 'Assistant IA',
      icon: 'Bot',
      path: '/ai-assistant',
      order: 42,
    },
    {
      id: 'default-seo-ai',
      moduleId: 'seo-ai',
      label: 'SEO & IA',
      icon: 'Sparkles',
      path: '/seo-ai',
      order: 43,
    },
    {
      id: 'default-investment',
      moduleId: 'investment-intelligence',
      label: 'Investissement',
      icon: 'LineChart',
      path: '/investment',
      order: 44,
    },

    // ── Opérations ───────────────────────────────────────────────────
    {
      id: 'default-documents',
      moduleId: 'business-documents',
      label: 'Documents',
      icon: 'FileText',
      path: '/documents',
      order: 50,
    },
    {
      id: 'default-validation',
      moduleId: 'business-validation',
      label: 'Validation',
      icon: 'ShieldCheck',
      path: '/validation',
      order: 51,
    },
    {
      id: 'default-scraping',
      moduleId: 'data-scraping',
      label: 'Scraping',
      icon: 'Download',
      path: '/scraping',
      order: 52,
    },
    {
      id: 'default-integrations',
      moduleId: 'integrations',
      label: 'Intégrations',
      icon: 'Puzzle',
      path: '/integrations',
      order: 53,
    },

    // ── Vitrine publique ─────────────────────────────────────────────
    {
      id: 'default-vitrine',
      moduleId: 'public-vitrine',
      label: 'Vitrine',
      icon: 'Globe',
      path: '/vitrine',
      order: 60,
    },

    // ── Administration ───────────────────────────────────────────────
    {
      id: 'default-personnel',
      moduleId: 'business-personnel',
      label: 'Personnel',
      icon: 'Users',
      path: '/personnel',
      order: 80,
    },
    {
      id: 'default-settings',
      moduleId: 'core',
      label: 'Paramètres',
      icon: 'Settings',
      path: '/settings',
      order: 999,
    },
  ];
}

export default useMenu;
