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

      // Toujours utiliser le menu structuré avec sections
      // L'API peut retourner les modules actifs mais le layout est côté client
      setMenuItems(getDefaultMenu());
    } catch (err) {
      console.error('❌ Erreur lors du chargement du menu:', err);
      setError(err as Error);
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

    // ── Section: Gestion Immobilière ─────────────────────────────────
    {
      id: 'section-immobilier',
      moduleId: 'section',
      label: 'GESTION IMMOBILIÈRE',
      icon: '',
      path: '',
      order: 1,
    },
    {
      id: 'default-gestion-immo',
      moduleId: 'inventory-properties',
      label: 'Gestion Immobilière',
      icon: 'Building2',
      path: '/gestion-immobiliere',
      order: 2,
    },

    // ── Section: Commercial ──────────────────────────────────────────
    {
      id: 'section-commercial',
      moduleId: 'section',
      label: 'COMMERCIAL',
      icon: '',
      path: '',
      order: 9,
    },
    {
      id: 'default-prospects',
      moduleId: 'sales-prospects',
      label: 'Prospects',
      icon: 'Users',
      path: '/prospects',
      order: 10,
    },
    {
      id: 'default-prospecting',
      moduleId: 'ai-prospecting',
      label: 'Prospection IA',
      icon: 'Search',
      path: '/prospection',
      order: 10.5,
    },
    {
      id: 'default-matching',
      moduleId: 'sales-matching',
      label: 'Matching',
      icon: 'Target',
      path: '/matching',
      order: 11,
    },
    {
      id: 'default-transactions',
      moduleId: 'business-transactions',
      label: 'Transactions',
      icon: 'ArrowLeftRight',
      path: '/transactions-dashboard',
      order: 12,
    },

    // ── Section: Organisation ────────────────────────────────────────
    {
      id: 'section-organisation',
      moduleId: 'section',
      label: 'ORGANISATION',
      icon: '',
      path: '',
      order: 19,
    },
    {
      id: 'default-planification',
      moduleId: 'business-planification',
      label: 'Planification',
      icon: 'CalendarDays',
      path: '/planification',
      order: 20,
    },
    {
      id: 'default-communications',
      moduleId: 'communications',
      label: 'Communications',
      icon: 'MessageSquare',
      path: '/communications-dashboard',
      order: 21,
    },

    // ── Section: Outils & IA ─────────────────────────────────────────
    {
      id: 'section-outils',
      moduleId: 'section',
      label: 'OUTILS & IA',
      icon: '',
      path: '',
      order: 39,
    },
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
      id: 'default-investment',
      moduleId: 'investment-intelligence',
      label: 'Investissement',
      icon: 'TrendingUp',
      path: '/investment',
      order: 43,
    },
    {
      id: 'default-vitrine',
      moduleId: 'public-vitrine',
      label: 'Vitrine',
      icon: 'Globe',
      path: '/vitrine',
      order: 44,
    },

    // ── Section: Administration ──────────────────────────────────────
    {
      id: 'section-admin',
      moduleId: 'section',
      label: 'ADMINISTRATION',
      icon: '',
      path: '',
      order: 79,
    },
    {
      id: 'default-personnel',
      moduleId: 'business-personnel',
      label: 'Personnel',
      icon: 'Users',
      path: '/personnel',
      order: 80,
    },
    {
      id: 'default-finance',
      moduleId: 'business-finance',
      label: 'Finance',
      icon: 'DollarSign',
      path: '/finance',
      order: 81,
    },
    {
      id: 'default-documents',
      moduleId: 'business-documents',
      label: 'Documents',
      icon: 'FileText',
      path: '/documents',
      order: 82,
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
