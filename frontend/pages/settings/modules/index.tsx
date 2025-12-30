import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Package,
  Search,
  Download,
  CheckCircle,
  Settings,
  Zap,
  TrendingUp,
  Users,
  MessageSquare,
  FileText,
  BarChart3,
} from 'lucide-react';

/**
 * Module Registry UI - Système Plug & Play
 *
 * Rôles:
 * - SUPER_ADMIN: Accès complet (gérer tous modules, publier modules)
 * - ADMIN: Installer/désinstaller modules pour son agence
 * - AGENT/USER: Voir modules disponibles (lecture seule)
 */

interface Module {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  category: string;
  icon: string;
  author: string;
  downloads: number;
  isInstalled: boolean;
  isActive: boolean;
  requiredRole: string[];
  features: string[];
  price?: number;
}

const CATEGORIES = [
  { id: 'all', name: 'Tous', icon: Package },
  { id: 'intelligence', name: 'Intelligence IA', icon: Zap },
  { id: 'business', name: 'Business', icon: TrendingUp },
  { id: 'communications', name: 'Communications', icon: MessageSquare },
  { id: 'content', name: 'Contenu', icon: FileText },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'integrations', name: 'Intégrations', icon: Users },
];

const MODULE_ICONS: Record<string, any> = {
  ai: Zap,
  business: TrendingUp,
  analytics: BarChart3,
  content: FileText,
  communication: MessageSquare,
};

export default function ModuleRegistryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [user, setUser] = useState<{ role: string; agencyId: string } | null>(null);

  useEffect(() => {
    fetchUser();
    fetchModules();
  }, []);

  useEffect(() => {
    filterModules();
  }, [searchQuery, selectedCategory, activeTab, modules]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      // Fallback dev
      setUser({ role: 'ADMIN', agencyId: 'agency-1' });
    }
  };

  const fetchModules = async () => {
    try {
      // TODO: Remplacer par vrai appel API
      // const response = await fetch('/api/modules/registry');
      // const data = await response.json();

      // Données de démo
      setModules([
        {
          id: '1',
          name: 'AI Chat Assistant',
          slug: 'ai-chat-assistant',
          description: 'Assistant conversationnel IA multi-providers avec historique',
          version: '1.2.0',
          category: 'intelligence',
          icon: 'ai',
          author: 'CRM Team',
          downloads: 1245,
          isInstalled: true,
          isActive: true,
          requiredRole: ['AGENT', 'ADMIN', 'SUPER_ADMIN'],
          features: [
            'Multi-providers (Claude, GPT, Gemini)',
            'Historique conversations',
            'Export conversations',
          ],
        },
        {
          id: '2',
          name: 'Smart Forms',
          slug: 'smart-forms',
          description: 'Générateur de formulaires intelligents avec IA',
          version: '1.0.5',
          category: 'intelligence',
          icon: 'ai',
          author: 'CRM Team',
          downloads: 892,
          isInstalled: true,
          isActive: true,
          requiredRole: ['AGENT', 'ADMIN', 'SUPER_ADMIN'],
          features: [
            'Génération automatique',
            'Validation IA',
            'Templates personnalisables',
          ],
        },
        {
          id: '3',
          name: 'Semantic Search',
          slug: 'semantic-search',
          description: 'Recherche sémantique avancée dans tous vos contenus',
          version: '2.1.0',
          category: 'intelligence',
          icon: 'ai',
          author: 'CRM Team',
          downloads: 654,
          isInstalled: false,
          isActive: false,
          requiredRole: ['AGENT', 'ADMIN', 'SUPER_ADMIN'],
          features: [
            'Embeddings sémantiques',
            'Recherche multi-langues',
            'Suggestions intelligentes',
          ],
        },
        {
          id: '4',
          name: 'Investment Intelligence',
          slug: 'investment-intelligence',
          description: 'Analyse et comparaison de projets d\'investissement immobilier',
          version: '1.0.0',
          category: 'business',
          icon: 'business',
          author: 'CRM Team',
          downloads: 423,
          isInstalled: false,
          isActive: false,
          requiredRole: ['ADMIN', 'SUPER_ADMIN'],
          features: [
            'Import multi-sources',
            'Analyse ROI IA',
            'Comparateur projets',
            'Alertes opportunités',
          ],
          price: 99,
        },
        {
          id: '5',
          name: 'Email AI Response',
          slug: 'email-ai-response',
          description: 'Réponses automatiques aux emails avec IA',
          version: '1.3.2',
          category: 'communications',
          icon: 'communication',
          author: 'CRM Team',
          downloads: 1876,
          isInstalled: true,
          isActive: true,
          requiredRole: ['AGENT', 'ADMIN', 'SUPER_ADMIN'],
          features: [
            'Analyse sentiment',
            'Génération réponses',
            'Templates personnalisés',
          ],
        },
        {
          id: '6',
          name: 'Auto Reports',
          slug: 'auto-reports',
          description: 'Génération automatique de rapports périodiques',
          version: '1.1.0',
          category: 'analytics',
          icon: 'analytics',
          author: 'CRM Team',
          downloads: 734,
          isInstalled: false,
          isActive: false,
          requiredRole: ['ADMIN', 'SUPER_ADMIN'],
          features: [
            'Planification automatique',
            'Templates rapports',
            'Export multi-formats',
          ],
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setLoading(false);
    }
  };

  const filterModules = () => {
    let filtered = modules;

    // Filter by tab
    if (activeTab === 'installed') {
      filtered = filtered.filter((m) => m.isInstalled);
    } else if (activeTab === 'available') {
      filtered = filtered.filter((m) => !m.isInstalled);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((m) => m.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query) ||
          m.features.some((f) => f.toLowerCase().includes(query))
      );
    }

    setFilteredModules(filtered);
  };

  const handleInstallModule = async (moduleId: string) => {
    if (!canManageModules()) {
      alert('Vous n\'avez pas les permissions pour installer des modules');
      return;
    }

    try {
      const response = await fetch('/api/modules/registry/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, agencyId: user?.agencyId }),
      });

      if (response.ok) {
        fetchModules();
      }
    } catch (error) {
      console.error('Error installing module:', error);
    }
  };

  const handleUninstallModule = async (moduleId: string) => {
    if (!canManageModules()) {
      alert('Vous n\'avez pas les permissions pour désinstaller des modules');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir désinstaller ce module ?')) return;

    try {
      const response = await fetch(`/api/modules/registry/${moduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchModules();
      }
    } catch (error) {
      console.error('Error uninstalling module:', error);
    }
  };

  const canManageModules = () => {
    return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  };

  const getIconComponent = (iconType: string) => {
    return MODULE_ICONS[iconType] || Package;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Module Registry - Système Plug & Play</title>
      </Head>

      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Package className="h-8 w-8 mr-3" />
            Module Registry
          </h1>
          <p className="text-muted-foreground mt-1">
            Système Plug & Play - Installez et gérez vos modules
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{modules.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Installés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {modules.filter((m) => m.isInstalled).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {modules.filter((m) => m.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {modules.filter((m) => !m.isInstalled).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un module..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          {cat.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Tous ({modules.length})</TabsTrigger>
            <TabsTrigger value="installed">
              Installés ({modules.filter((m) => m.isInstalled).length})
            </TabsTrigger>
            <TabsTrigger value="available">
              Disponibles ({modules.filter((m) => !m.isInstalled).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {filteredModules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun module trouvé</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredModules.map((module) => {
                  const Icon = getIconComponent(module.icon);
                  return (
                    <Card key={module.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{module.name}</CardTitle>
                              <p className="text-xs text-muted-foreground">
                                v{module.version}
                              </p>
                            </div>
                          </div>
                          {module.isInstalled && (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Installé
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground mb-4">
                          {module.description}
                        </p>
                        <div className="space-y-2">
                          <p className="text-xs font-semibold">Fonctionnalités:</p>
                          <ul className="text-xs space-y-1">
                            {module.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          {module.downloads.toLocaleString()} téléchargements
                        </div>
                        {module.isInstalled ? (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/settings/modules/${module.slug}`)
                              }
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Configurer
                            </Button>
                            {canManageModules() && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUninstallModule(module.id)}
                              >
                                Désinstaller
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleInstallModule(module.id)}
                            disabled={!canManageModules()}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            {module.price ? `$${module.price}/mois` : 'Installer'}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
