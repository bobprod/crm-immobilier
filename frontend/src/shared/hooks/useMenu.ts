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
    {
      id: 'default-dashboard',
      moduleId: 'core',
      label: 'Tableau de bord',
      icon: 'Home',
      path: '/dashboard',
      order: 0,
    },
    {
      id: 'default-prospects',
      moduleId: 'sales-prospects',
      label: 'Prospects',
      icon: 'Users',
      path: '/prospects',
      order: 1,
    },
    {
      id: 'default-properties',
      moduleId: 'inventory-properties',
      label: 'Propriétés',
      icon: 'Building',
      path: '/properties',
      order: 2,
    },
    {
      id: 'default-matching',
      moduleId: 'sales-matching',
      label: 'Matching',
      icon: 'Target',
      path: '/matching-dashboard',
      order: 3,
    },
    {
      id: 'default-communications',
      moduleId: 'communications',
      label: 'Communications',
      icon: 'MessageSquare',
      path: '/communications-dashboard',
      order: 4,
    },
    {
      id: 'default-appointments',
      moduleId: 'business-appointments',
      label: 'Rendez-vous',
      icon: 'Calendar',
      path: '/appointments',
      order: 5,
    },
    {
      id: 'default-tasks',
      moduleId: 'business-tasks',
      label: 'Tâches',
      icon: 'CheckSquare',
      path: '/tasks',
      order: 6,
    },
    {
      id: 'default-prospecting',
      moduleId: 'ai-prospecting',
      label: 'Prospection IA',
      icon: 'Search',
      path: '/prospecting',
      order: 7,
    },
    {
      id: 'default-marketing',
      moduleId: 'marketing-tracking',
      label: 'Marketing',
      icon: 'TrendingUp',
      path: '/marketing',
      order: 8,
    },
    {
      id: 'default-analytics',
      moduleId: 'business-analytics',
      label: 'Analytiques',
      icon: 'BarChart',
      path: '/analytics',
      order: 9,
    },
    {
      id: 'default-documents',
      moduleId: 'business-documents',
      label: 'Documents',
      icon: 'FileText',
      path: '/documents',
      order: 10,
    },
    {
      id: 'default-personnel',
      moduleId: 'business-personnel',
      label: 'Personnel',
      icon: 'Users',
      path: '/personnel',
      order: 11,
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
