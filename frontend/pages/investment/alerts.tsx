import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { MainLayout } from '@/shared/components/layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { ArrowLeft, Bell, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/shared/utils/backend-api';

interface Alert {
  id: string;
  name: string;
  criteria: {
    minYield?: number;
    maxPrice?: number;
    cities?: string[];
    sources?: string[];
  };
  isActive: boolean;
  createdAt: string;
}

export default function InvestmentAlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    minYield: '',
    maxPrice: '',
    cities: '',
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const res = await apiClient.get('/investment-intelligence/alerts');
      const raw = res.data?.data ?? res.data?.alerts ?? res.data;
      setAlerts(Array.isArray(raw) ? raw : []);
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await apiClient.post('/investment-intelligence/alerts', {
        name: formData.name,
        criteria: {
          minYield: formData.minYield ? parseFloat(formData.minYield) : undefined,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : undefined,
          cities: formData.cities ? formData.cities.split(',').map((c) => c.trim()) : undefined,
        },
      });
      setShowForm(false);
      setFormData({ name: '', minYield: '', maxPrice: '', cities: '' });
      loadAlerts();
    } catch (error) {
      console.error('Erreur création alerte:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/investment-intelligence/alerts/${id}`);
      loadAlerts();
    } catch (error) {
      console.error('Erreur suppression alerte:', error);
    }
  };

  const toggleAlert = async (alert: Alert) => {
    try {
      await apiClient.patch(`/investment-intelligence/alerts/${alert.id}`, {
        isActive: !alert.isActive,
      });
      loadAlerts();
    } catch (error) {
      console.error('Erreur mise à jour alerte:', error);
    }
  };

  return (
    <MainLayout>
      <Head>
        <title>Alertes opportunités - Investment Intelligence</title>
      </Head>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/investment')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bell className="h-6 w-6" />
                Alertes opportunités
              </h1>
              <p className="text-muted-foreground text-sm">
                Recevez des notifications sur les opportunités d&apos;investissement
              </p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle alerte
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Créer une alerte</CardTitle>
              <CardDescription>Définissez vos critères de recherche</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nom de l&apos;alerte</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Rendement > 8% à Paris"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="minYield">Rendement minimum (%)</Label>
                  <Input
                    id="minYield"
                    type="number"
                    value={formData.minYield}
                    onChange={(e) => setFormData((prev) => ({ ...prev, minYield: e.target.value }))}
                    placeholder="Ex: 6"
                  />
                </div>
                <div>
                  <Label htmlFor="maxPrice">Prix maximum (€)</Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    value={formData.maxPrice}
                    onChange={(e) => setFormData((prev) => ({ ...prev, maxPrice: e.target.value }))}
                    placeholder="Ex: 500000"
                  />
                </div>
                <div>
                  <Label htmlFor="cities">Villes (séparées par virgule)</Label>
                  <Input
                    id="cities"
                    value={formData.cities}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cities: e.target.value }))}
                    placeholder="Ex: Paris, Lyon, Bordeaux"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={!formData.name}>
                  Créer
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Vos alertes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Chargement...</div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Aucune alerte configurée</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Créer votre première alerte
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{alert.name}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${alert.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {alert.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        {alert.criteria.minYield && (
                          <span>Rendement min: {alert.criteria.minYield}%</span>
                        )}
                        {alert.criteria.maxPrice && (
                          <span>Prix max: {alert.criteria.maxPrice.toLocaleString('fr-FR')} €</span>
                        )}
                        {alert.criteria.cities?.length && (
                          <span>Villes: {alert.criteria.cities.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleAlert(alert)}>
                        {alert.isActive ? 'Désactiver' : 'Activer'}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(alert.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
