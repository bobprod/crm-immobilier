import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import vitrineAPI from '@/shared/utils/vitrine-api';
import {
  Settings, Eye, BarChart3, Users, ExternalLink,
  Globe, Palette, Layout, TrendingUp, Star, ArrowRight
} from 'lucide-react';

/**
 * Page de gestion de la vitrine publique
 */
export default function VitrinePage() {
  const router = useRouter();
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
      const { id, userId, createdAt, updatedAt, templateId, ...payload } = updates;
      const updated = await vitrineAPI.updateConfig(payload);
      setConfig(updated);
    } catch (error) {
      console.error('Erreur mise à jour config:', error);
    }
  };

  if (loading) return (
    <MainLayout title="Site Vitrine">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    </MainLayout>
  );

  const siteUrl = config?.slug ? `/sites/${config.slug}` : null;

  return (
    <MainLayout title="Site Vitrine" breadcrumbs={[{ label: 'Site Vitrine' }]}>
      {/* Hero actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Vitrine</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez votre présence en ligne et capturez des leads</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Bouton voir le site public */}
          {siteUrl && (
            <button
              onClick={() => window.open(siteUrl, '_blank', 'noopener,noreferrer')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Voir le site
            </button>
          )}
          <button
            onClick={() => router.push('/vitrine/templates')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Palette className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={() => router.push('/vitrine/editeur')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg font-medium text-sm hover:bg-[#162d4a] transition-colors shadow-sm"
          >
            <Layout className="w-4 h-4" />
            Éditeur de pages
          </button>
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
            <span className="text-sm text-gray-600">{config?.isActive ? 'En ligne' : 'Hors ligne'}</span>
            <Switch
              id="vitrine-toggle"
              checked={config?.isActive || false}
              onCheckedChange={handleToggleVitrine}
            />
          </div>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-[#1E3A5F] to-[#2d5086] text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 opacity-70" />
              <span className="text-xs opacity-70">30 jours</span>
            </div>
            <p className="text-3xl font-bold">{analytics?.totalVisitors || 0}</p>
            <p className="text-sm opacity-80 mt-1">Visiteurs</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-amber-500" />
              <span className="text-xs text-gray-400">30 jours</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics?.totalViews || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Pages vues</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{leads.length}</p>
            <p className="text-sm text-gray-500 mt-1">Leads capturés</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{publishedProperties.length}</p>
            <p className="text-sm text-gray-500 mt-1">Biens publiés</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="bg-white border border-gray-200 shadow-sm p-1">
          <TabsTrigger value="config" className="data-[state=active]:bg-[#1E3A5F] data-[state=active]:text-white">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="properties" className="data-[state=active]:bg-[#1E3A5F] data-[state=active]:text-white">
            <Eye className="h-4 w-4 mr-2" />
            Biens ({publishedProperties.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-[#1E3A5F] data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="leads" className="data-[state=active]:bg-[#1E3A5F] data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Leads ({leads.length})
          </TabsTrigger>
        </TabsList>

        {/* Onglet Configuration */}
        <TabsContent value="config">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-900">Configuration Générale</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Nom de l'agence</Label>
                  <Input
                    className="mt-1"
                    value={config?.agencyName || ''}
                    onChange={(e) => setConfig({ ...config, agencyName: e.target.value })}
                    placeholder="Mon Agence Immobilière"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Slogan</Label>
                  <Input
                    className="mt-1"
                    value={config?.slogan || ''}
                    onChange={(e) => setConfig({ ...config, slogan: e.target.value })}
                    placeholder="Votre partenaire immobilier"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Téléphone</Label>
                  <Input
                    className="mt-1"
                    value={config?.phone || ''}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    className="mt-1"
                    type="email"
                    value={config?.email || ''}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    placeholder="contact@agence.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Adresse</Label>
                  <Input
                    className="mt-1"
                    value={config?.address || ''}
                    onChange={(e) => setConfig({ ...config, address: e.target.value })}
                    placeholder="123 Rue Example, 75001 Paris"
                  />
                </div>
              </div>
              <Button
                onClick={() => handleUpdateConfig(config)}
                className="bg-[#1E3A5F] hover:bg-[#162d4a] text-white"
              >
                Enregistrer la configuration
              </Button>
              {siteUrl && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2 font-medium">URL de votre site vitrine :</p>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 text-sm bg-white border border-gray-200 rounded px-3 py-2 text-gray-700 truncate">
                      {typeof window !== 'undefined' ? window.location.origin : ''}{siteUrl}
                    </code>
                    <button
                      onClick={() => window.open(siteUrl, '_blank', 'noopener,noreferrer')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors whitespace-nowrap"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ouvrir
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Biens affichés */}
        <TabsContent value="properties">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">Biens publiés sur la vitrine</CardTitle>
                <button
                  onClick={() => router.push('/properties')}
                  className="inline-flex items-center gap-1.5 text-sm text-[#1E3A5F] font-medium hover:underline"
                >
                  Gérer les biens <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {publishedProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Aucun bien publié</p>
                    <p className="text-gray-400 text-sm mt-1">Allez dans la section Biens pour publier des propriétés</p>
                    <button onClick={() => router.push('/properties')} className="mt-4 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#162d4a] transition-colors">
                      Voir les biens
                    </button>
                  </div>
                ) : (
                  publishedProperties.map((pub) => (
                    <div key={pub.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-3">
                        {pub.isFeatured && <Badge className="bg-amber-100 text-amber-700 border-amber-200">⭐ Vedette</Badge>}
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">{pub.property?.title || 'Bien'}</h3>
                          <p className="text-xs text-gray-500">{pub.property?.price?.toLocaleString()} € — {pub.property?.city}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => vitrineAPI.unpublishProperty(pub.propertyId)} className="text-xs">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Visiteurs (30j)', value: analytics?.totalVisitors || 0, icon: TrendingUp, color: 'text-blue-600' },
              { label: 'Pages vues', value: analytics?.totalViews || 0, icon: Eye, color: 'text-amber-600' },
              { label: 'Taux conversion', value: analytics?.totalVisitors > 0 ? `${((leads.length / analytics.totalVisitors) * 100).toFixed(1)}%` : '0%', icon: BarChart3, color: 'text-emerald-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="border-0 shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 bg-gray-50 rounded-xl ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-900">Biens les plus consultés</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {analytics?.topProperties?.length > 0 ? analytics.topProperties.map((prop: any, index: number) => (
                  <div key={prop.propertyId} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-medium">{index + 1}</span>
                      <span className="text-sm text-gray-900">{prop.title || 'Bien'}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{prop.views} vues</Badge>
                  </div>
                )) : (
                  <p className="text-gray-400 text-sm text-center py-6">Aucune donnée analytics disponible</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Leads */}
        <TabsContent value="leads">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-900">Leads capturés depuis la vitrine</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {leads.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Aucun lead capturé</p>
                    <p className="text-gray-400 text-sm mt-1">Les formulaires de contact de votre vitrine apparaîtront ici</p>
                  </div>
                ) : (
                  leads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">{lead.firstName} {lead.lastName}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{lead.email} • {lead.phone}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(lead.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <Badge className="text-xs capitalize">{lead.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
