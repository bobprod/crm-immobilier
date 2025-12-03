import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/modules/core/layout/components/Layout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { ArrowLeft, Calendar, MapPin, User, Home, Loader2 } from 'lucide-react';
import { appointmentsAPI } from '@/shared/utils/appointments-api';
import apiClient from '@/shared/utils/backend-api';

interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface Property {
  id: string;
  title: string;
  address?: string;
  city?: string;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const { prospectId: urlProspectId, propertyId: urlPropertyId } = router.query;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedProspectId, setSelectedProspectId] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (urlProspectId && typeof urlProspectId === 'string') {
      setSelectedProspectId(urlProspectId);
    }
    if (urlPropertyId && typeof urlPropertyId === 'string') {
      setSelectedPropertyId(urlPropertyId);
    }
  }, [urlProspectId, urlPropertyId]);

  const loadData = async () => {
    try {
      const [prospectsRes, propertiesRes] = await Promise.all([
        apiClient.get('/prospects', { params: { limit: 100 } }),
        apiClient.get('/properties', { params: { limit: 100 } }),
      ]);
      setProspects(prospectsRes.data || []);
      setProperties(propertiesRes.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const date = formData.get('date') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;

    // Convert to ISO format
    const startDateTime = new Date(`${date}T${startTime}`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}`).toISOString();

    try {
      await appointmentsAPI.create({
        title: formData.get('title') as string,
        startTime: startDateTime,
        endTime: endDateTime,
        location: formData.get('location') as string || undefined,
        type: formData.get('type') as string || 'visit',
        priority: formData.get('priority') as string || 'medium',
        notes: formData.get('notes') as string || undefined,
        reminder: true,
        prospectId: selectedProspectId || undefined,
        propertyId: selectedPropertyId || undefined,
      });

      router.push('/appointments');
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      setError(err.response?.data?.message || 'Erreur lors de la creation du rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Nouveau Rendez-vous</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Titre */}
              <div className="space-y-2">
                <Label htmlFor="title">Titre du rendez-vous *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Ex: Visite appartement Tunis"
                  required
                />
              </div>

              {/* Type et Priorite */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    name="type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue="visit"
                  >
                    <option value="visit">Visite</option>
                    <option value="signature">Signature</option>
                    <option value="expertise">Expertise</option>
                    <option value="estimation">Estimation</option>
                    <option value="meeting">Reunion</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priorite</Label>
                  <select
                    id="priority"
                    name="priority"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue="medium"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Prospect et Propriete */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="prospectId">Prospect</Label>
                  </div>
                  {loadingData ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement...
                    </div>
                  ) : (
                    <select
                      id="prospectId"
                      value={selectedProspectId}
                      onChange={(e) => setSelectedProspectId(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">-- Aucun prospect --</option>
                      {prospects.map((prospect) => (
                        <option key={prospect.id} value={prospect.id}>
                          {prospect.firstName} {prospect.lastName}
                          {prospect.email ? ` (${prospect.email})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="propertyId">Bien immobilier</Label>
                  </div>
                  {loadingData ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement...
                    </div>
                  ) : (
                    <select
                      id="propertyId"
                      value={selectedPropertyId}
                      onChange={(e) => setSelectedPropertyId(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">-- Aucun bien --</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.title}
                          {property.city ? ` - ${property.city}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Date et Heures */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">Date et horaires</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      min={today}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime">Debut *</Label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      defaultValue="09:00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">Fin *</Label>
                    <Input
                      id="endTime"
                      name="endTime"
                      type="time"
                      defaultValue="10:00"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Lieu */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="location">Lieu</Label>
                </div>
                <Input
                  id="location"
                  name="location"
                  placeholder="Adresse du rendez-vous"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Informations complementaires..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creation...' : 'Creer le rendez-vous'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
