import React, { useState, useEffect } from 'react';
import Layout from '../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { apiClient } from '../../src/shared/utils/api-client-backend';

interface Appointment {
  id: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees: string[];
  status: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      // Vérifier que le token existe avant de faire la requête
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('[Appointments] No token found, cannot fetch data');
        setAppointments([]);
        setLoading(false);
        return;
      }

      console.log('[Appointments] Fetching upcoming appointments...');
      const response = await apiClient.get('/appointments/upcoming');

      console.log('[Appointments] Response received:', response.data);
      setAppointments(response.data || []);
    } catch (error: any) {
      console.error('[Appointments] Erreur chargement RDV:', error);
      console.error('[Appointments] Error details:', error.response?.status, error.response?.data);
      // Définir un tableau vide en cas d'erreur au lieu de crasher
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rendez-vous</h1>
        <Button>Nouveau RDV</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rendez-vous</h3>
            <p className="text-gray-500">Vous n'avez aucun rendez-vous à venir pour le moment.</p>
          </div>
        ) : (
          appointments.map((apt) => (
            <Card key={apt.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{apt.title}</CardTitle>
                  <Badge>{apt.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(apt.startTime).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(apt.startTime).toLocaleTimeString()} -{' '}
                    {new Date(apt.endTime).toLocaleTimeString()}
                  </span>
                </div>

                {apt.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{apt.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>{apt.attendees.length} participant(s)</span>
                </div>

                <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                  {apt.status}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </Layout>
  );
}
