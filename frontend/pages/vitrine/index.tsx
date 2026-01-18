import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import vitrineAPI from '@/shared/utils/vitrine-api';
import { Settings, Eye, BarChart3, Users, Check, X } from 'lucide-react';

/**
 * Page de gestion de la vitrine publique
 */
export default function VitrinePage() {
  const [config, setConfig] = useState<any>(null);
  const [publishedProperties, setPublishedProperties] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configData, propertiesData, analyticsData, leadsData] = await Promise.all([
        vitrineAPI.getConfig().catch(() => null),
        vitrineAPI.getPublishedProperties().catch(() => []),
        vitrineAPI.getAnalytics(30).catch(() => null),
        vitrineAPI.getVitrineLeads().catch(() => []),
      ]);

      setConfig(configData);
      setPublishedProperties(propertiesData || []);
      setAnalytics(analyticsData);
      setLeads(leadsData || []);
    } catch (error) {
      // Erreurs API gérées silencieusement
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVitrine = async (isActive: boolean) => {
    try {
      await vitrineAPI.toggleVitrine(isActive);
      setConfig({ ...config, isActive });
    } catch (error) {
      console.error('Erreur toggle vitrine:', error);
    }
  };

  const handleUpdateConfig = async (updates: any) => {
    try {
      const updated = await vitrineAPI.updateConfig(updates);
      setConfig(updated);
    } catch (error) {
      console.error('Erreur mise à jour config:', error);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">🌐 Vitrine Publique</h1>
          <p className="text-gray-600">Gérez votre site vitrine et capturez des leads</p>
        </div>

        <div className="flex items-center gap-3">
          <Label htmlFor="vitrine-toggle">
            {config?.isActive ? '✅ Vitrine active' : '❌ Vitrine inactive'}
          </Label>
          <Switch
            id="vitrine-toggle"
            checked={config?.isActive || false}
            onCheckedChange={handleToggleVitrine}
          />
        </div>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="properties">
            <Eye className="h-4 w-4 mr-2" />
            Biens affichés ({publishedProperties.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="leads">
            <Users className="h-4 w-4 mr-2" />
            Leads capturés ({leads.length})
          </TabsTrigger>
        </TabsList>

        {/* Onglet Configuration */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Générale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom de l'agence</Label>
                  <Input
                    value={config?.agencyName || ''}
                    onChange={(e) => setConfig({ ...config, agencyName: e.target.value })}
                    placeholder="Mon Agence Immobilière"
                  />
                </div>

                <div>
                  <Label>Slogan</Label>
                  <Input
                    value={config?.slogan || ''}
                    onChange={(e) => setConfig({ ...config, slogan: e.target.value })}
                    placeholder="Votre partenaire immobilier"
                  />
                </div>

                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={config?.phone || ''}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={config?.email || ''}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    placeholder="contact@agence.com"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Adresse</Label>
                  <Input
                    value={config?.address || ''}
                    onChange={(e) => setConfig({ ...config, address: e.target.value })}
                    placeholder="123 Rue Example, 75001 Paris"
                  />
                </div>
              </div>

              <Button onClick={() => handleUpdateConfig(config)}>
                Enregistrer la configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Biens affichés */}
        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle>Biens publiés sur la vitrine</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {publishedProperties.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Aucun bien publié. Allez dans "Properties" pour publier des biens.
                  </p>
                ) : (
                  publishedProperties.map((pub) => (
                    <div
                      key={pub.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {pub.isFeatured && <Badge className="bg-yellow-500">⭐ En vedette</Badge>}
                        <div>
                          <h3 className="font-semibold">{pub.property.title}</h3>
                          <p className="text-sm text-gray-600">
                            {pub.property.price?.toLocaleString()} € - {pub.property.city}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => vitrineAPI.unpublishProperty(pub.propertyId)}
                      >
                        Dépublier
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Analytics */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Visiteurs (30j)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics?.totalVisitors || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pages vues</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics?.totalViews || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Taux conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {analytics?.totalVisitors > 0
                    ? ((leads.length / analytics.totalVisitors) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Biens les plus consultés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.topProperties?.map((prop: any, index: number) => (
                  <div key={prop.propertyId} className="flex justify-between items-center">
                    <span>
                      {index + 1}. {prop.title || 'Bien'}
                    </span>
                    <Badge>{prop.views} vues</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Leads */}
        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle>Leads capturés depuis la vitrine</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leads.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Aucun lead capturé pour le moment
                  </p>
                ) : (
                  leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">
                          {lead.firstName} {lead.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {lead.email} • {lead.phone}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge>{lead.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
