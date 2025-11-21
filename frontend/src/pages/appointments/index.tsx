import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { apiClient } from '@/src/shared/utils/api-client-backend';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/appointments/upcoming');
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Erreur chargement RDV:', error);
      setError('Impossible de charger les rendez-vous');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rendez-vous</h1>
        <Button>Nouveau RDV</Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">{error}</p>
          <Button onClick={loadAppointments} className="mt-2" variant="outline">
            Réessayer
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div>Chargement...</div>
        ) : appointments.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Aucun rendez-vous à venir
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
    </div>
  );
}
