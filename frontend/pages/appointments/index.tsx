import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Calendar, Clock, MapPin, User, Plus } from 'lucide-react';
import { appointmentsAPI, Appointment } from '@/shared/utils/appointments-api';
import { useRouter } from 'next/router';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    console.log('[AppointmentsPage] 🔄 Starting to load appointments...');
    try {
      // Vérifier que le token existe avant de faire la requête
      const token = localStorage.getItem('auth_token');
      console.log('[AppointmentsPage] 🔑 Token check:', token ? 'Token found' : 'No token');

      if (!token) {
        console.warn('[AppointmentsPage] ⚠️ No token found, trying without auth...');
        // Ne pas arrêter, essayer quand même
      }

      console.log('[AppointmentsPage] 📡 Fetching upcoming appointments...');
      const data = await appointmentsAPI.getUpcoming();

      console.log('[AppointmentsPage] ✅ Response received:', {
        dataLength: data?.length || 0,
        data: data
      });

      const appointmentsData = Array.isArray(data) ? data : [];
      console.log('[AppointmentsPage] 📋 Setting appointments:', appointmentsData.length, 'items');
      setAppointments(appointmentsData);
    } catch (error: any) {
      console.error('[AppointmentsPage] ❌ Error loading appointments:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        stack: error.stack
      });
      // Définir un tableau vide en cas d'erreur au lieu de crasher
      setAppointments([]);
    } finally {
      console.log('[AppointmentsPage] ⏹️ Loading finished');
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Rendez-vous" breadcrumbs={[{ label: 'Rendez-vous' }]}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rendez-vous</h1>
        <Button onClick={() => router.push('/appointments/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau RDV
        </Button>
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
                  <span>{apt.attendees?.length || 0} participant(s)</span>
                </div>

                <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                  {apt.status}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MainLayout>
  );
}
