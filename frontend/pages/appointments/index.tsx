import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Calendar, Clock, MapPin, User, Plus, Eye } from 'lucide-react';
import { appointmentsAPI, getAppointmentStatusColor, getAppointmentStatusLabel, getAppointmentTypeLabel } from '@/shared/utils/appointments-api';

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
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('[Appointments] No token found');
        setAppointments([]);
        setLoading(false);
        return;
      }

      const data = await appointmentsAPI.getUpcoming(20);
      setAppointments(data || []);
    } catch (error: any) {
      console.error('[Appointments] Erreur chargement RDV:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rendez-vous</h1>
        <Button onClick={() => router.push('/appointments/new')}>
          <Plus className="h-4 w-4 mr-2" />
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
            <Card
              key={apt.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/appointments/${apt.id}`)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{apt.title}</CardTitle>
                  <Badge variant="outline">{getAppointmentTypeLabel(apt.type)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(apt.startTime).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(apt.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {apt.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{apt.location}</span>
                  </div>
                )}

                {apt.attendees && apt.attendees.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{apt.attendees.length} participant(s)</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Badge className={getAppointmentStatusColor(apt.status)}>
                    {getAppointmentStatusLabel(apt.status)}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </Layout>
  );
}
