import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  ArrowLeft,
  Settings,
  Save,
  Power,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';

/**
 * Module Configuration Page
 *
 * Configuration détaillée d'un module spécifique
 * Rôles: ADMIN, SUPER_ADMIN
 */

interface ModuleConfig {
  id: string;
  name: string;
  slug: string;
  version: string;
  isActive: boolean;
  settings: Record<string, any>;
  permissions: {
    roles: string[];
    features: Record<string, boolean>;
  };
}

export default function ModuleConfigPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [module, setModule] = useState<ModuleConfig | null>(null);

  useEffect(() => {
    if (slug) {
      fetchModuleConfig();
    }
  }, [slug]);

  const fetchModuleConfig = async () => {
    try {
      // TODO: Remplacer par vrai appel API
      // const response = await fetch(`/api/modules/${slug}/config`);
      // const data = await response.json();

      // Données de démo
      setModule({
        id: '1',
        name: 'AI Chat Assistant',
        slug: slug as string,
        version: '1.2.0',
        isActive: true,
        settings: {
          defaultProvider: 'claude',
          maxHistoryItems: 50,
          enableExport: true,
          autoSave: true,
          showTimestamps: true,
        },
        permissions: {
          roles: ['AGENT', 'ADMIN', 'SUPER_ADMIN'],
          features: {
            chat: true,
            export: true,
            history: true,
            multiProvider: true,
          },
        },
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching module config:', error);
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!module) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/modules/${slug}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(module),
      });

      if (response.ok) {
        alert('Configuration enregistrée avec succès');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!module) return;

    const newModule = { ...module, isActive: !module.isActive };
    setModule(newModule);
  };

  const handleSettingChange = (key: string, value: any) => {
    if (!module) return;

    setModule({
      ...module,
      settings: {
        ...module.settings,
        [key]: value,
      },
    });
  };

  const handlePermissionChange = (feature: string, value: boolean) => {
    if (!module) return;

    setModule({
      ...module,
      permissions: {
        ...module.permissions,
        features: {
          ...module.permissions.features,
          [feature]: value,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Module non trouvé</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Configuration {module.name}</title>
      </Head>

      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/settings/modules')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center">
                <Settings className="h-8 w-8 mr-3" />
                {module.name}
                <Badge variant="secondary" className="ml-3">
                  v{module.version}
                </Badge>
              </h1>
              <p className="text-muted-foreground mt-1">
                Configuration et permissions du module
              </p>
            </div>
          </div>

          <Button onClick={handleSaveConfig} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Power className="h-5 w-5 mr-2" />
                Statut du Module
              </span>
              <Switch checked={module.isActive} onCheckedChange={handleToggleActive} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {module.isActive ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">Module actif</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-600 font-medium">Module désactivé</span>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {module.isActive
                ? 'Le module est actuellement actif et accessible aux utilisateurs autorisés.'
                : 'Le module est désactivé et non accessible.'}
            </p>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
            <CardDescription>
              Configuration générale du module
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultProvider">Provider par défaut</Label>
                <Input
                  id="defaultProvider"
                  value={module.settings.defaultProvider || ''}
                  onChange={(e) =>
                    handleSettingChange('defaultProvider', e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxHistoryItems">
                  Nombre max d'éléments d'historique
                </Label>
                <Input
                  id="maxHistoryItems"
                  type="number"
                  value={module.settings.maxHistoryItems || 50}
                  onChange={(e) =>
                    handleSettingChange('maxHistoryItems', parseInt(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableExport">Activer l'export</Label>
                  <p className="text-sm text-muted-foreground">
                    Permettre l'export des données
                  </p>
                </div>
                <Switch
                  id="enableExport"
                  checked={module.settings.enableExport}
                  onCheckedChange={(checked) =>
                    handleSettingChange('enableExport', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoSave">Sauvegarde automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Sauvegarder automatiquement les modifications
                  </p>
                </div>
                <Switch
                  id="autoSave"
                  checked={module.settings.autoSave}
                  onCheckedChange={(checked) =>
                    handleSettingChange('autoSave', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showTimestamps">Afficher les timestamps</Label>
                  <p className="text-sm text-muted-foreground">
                    Afficher la date et l'heure des actions
                  </p>
                </div>
                <Switch
                  id="showTimestamps"
                  checked={module.settings.showTimestamps}
                  onCheckedChange={(checked) =>
                    handleSettingChange('showTimestamps', checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              Gérer les permissions et fonctionnalités par rôle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Rôles autorisés</Label>
              <div className="flex gap-2 mt-2">
                {module.permissions.roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <Label>Fonctionnalités</Label>
              {Object.entries(module.permissions.features).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={feature} className="capitalize">
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                  </div>
                  <Switch
                    id={feature}
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(feature, checked)
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Zone de danger</CardTitle>
            <CardDescription>
              Actions irréversibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => {
                if (
                  confirm(
                    'Êtes-vous sûr de vouloir désinstaller ce module ? Cette action est irréversible.'
                  )
                ) {
                  router.push('/settings/modules');
                }
              }}
            >
              Désinstaller le module
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
