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

      // Trier les items par ordre
      const sortedItems = items.sort((a, b) => (a.order || 0) - (b.order || 0));

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
