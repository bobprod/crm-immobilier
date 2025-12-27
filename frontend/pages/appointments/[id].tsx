import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Home,
  AlertCircle,
  CheckCircle,
  Trash2,
  Edit,
  XCircle,
  Star,
  Bell,
  Users,
} from 'lucide-react';
import {
  appointmentsAPI,
  Appointment,
  getAppointmentTypeLabel,
  getAppointmentStatusLabel,
  getAppointmentPriorityLabel,
  getAppointmentStatusColor,
  getAppointmentPriorityColor,
  formatAppointmentTime,
  formatAppointmentDate,
  getAppointmentDuration,
} from '@/shared/utils/appointments-api';

export default function AppointmentDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadAppointment();
    }
  }, [id]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const data = await appointmentsAPI.getById(id as string);
      setAppointment(data);
    } catch (err: any) {
      console.error('Error loading appointment:', err);
      setError('Erreur lors du chargement du rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!appointment) return;
    const outcome = prompt('Résultat du rendez-vous :');
    if (outcome === null) return;

    const ratingStr = prompt('Note de 1 à 5 (optionnel) :');
    const rating = ratingStr ? parseInt(ratingStr) : undefined;

    try {
      await appointmentsAPI.complete(appointment.id, outcome, rating);
      loadAppointment();
    } catch (err) {
      console.error('Failed to complete appointment:', err);
      alert('Erreur lors de la finalisation');
    }
  };

  const handleCancel = async () => {
    if (!appointment) return;
    const reason = prompt('Raison de l\'annulation :');
    if (reason === null) return;

    try {
      await appointmentsAPI.cancel(appointment.id, reason);
      loadAppointment();
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      alert('Erreur lors de l\'annulation');
    }
  };

  const handleReschedule = async () => {
    if (!appointment) return;
    const newStartTime = prompt('Nouvelle date/heure de début (YYYY-MM-DD HH:MM) :');
    if (!newStartTime) return;

    const newEndTime = prompt('Nouvelle date/heure de fin (YYYY-MM-DD HH:MM) :');
    if (!newEndTime) return;

    try {
      await appointmentsAPI.reschedule(
        appointment.id,
        new Date(newStartTime).toISOString(),
        new Date(newEndTime).toISOString()
      );
      loadAppointment();
    } catch (err) {
      console.error('Failed to reschedule appointment:', err);
      alert('Erreur lors de la reprogrammation');
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) return;

    try {
      await appointmentsAPI.delete(appointment.id);
      router.push('/appointments');
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error || !appointment) {
    return (
      <Layout>
        <div className="flex items-center justify-center p-8 text-red-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error || 'Rendez-vous non trouvé'}
        </div>
      </Layout>
    );
  }

  const duration = getAppointmentDuration(appointment.startTime, appointment.endTime);
  const isUpcoming = new Date(appointment.startTime) > new Date();
  const isPast = new Date(appointment.endTime) < new Date();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{appointment.title}</h1>
              <div className="flex gap-2 mt-2">
                <Badge className={getAppointmentStatusColor(appointment.status)} variant="secondary">
                  {getAppointmentStatusLabel(appointment.status)}
                </Badge>
                <Badge variant="outline">{getAppointmentTypeLabel(appointment.type)}</Badge>
                <Badge variant="outline" className={getAppointmentPriorityColor(appointment.priority)}>
                  {getAppointmentPriorityLabel(appointment.priority)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {appointment.status === 'scheduled' && isUpcoming && (
              <>
                <Button variant="outline" onClick={handleReschedule}>
                  <Clock className="mr-2 h-4 w-4" />
                  Reprogrammer
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Annuler
                </Button>
              </>
            )}
            {appointment.status !== 'completed' && appointment.status !== 'cancelled' && isPast && (
              <Button onClick={handleComplete}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Marquer comme terminé
              </Button>
            )}
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>

        {/* Warning si rendez-vous passé mais pas marqué terminé */}
        {isPast && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800">Rendez-vous passé</p>
              <p className="text-sm text-orange-600">
                Ce rendez-vous est terminé mais n'a pas encore été marqué comme tel.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Date et heure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium text-lg">{formatAppointmentDate(appointment.startTime)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Horaire</p>
                    <p className="font-medium">{formatAppointmentTime(appointment.startTime, appointment.endTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Durée</p>
                    <p className="font-medium">{duration} minutes</p>
                  </div>
                </div>
                {appointment.isAllDay && (
                  <Badge variant="outline">Toute la journée</Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Détails du rendez-vous
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointment.description && (
                  <div>
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="mt-1">{appointment.description}</p>
                  </div>
                )}

                {appointment.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Lieu</p>
                      <p className="font-medium">{appointment.location}</p>
                    </div>
                  </div>
                )}

                {appointment.notes && (
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="mt-1 text-gray-700">{appointment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {appointment.status === 'completed' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Résultat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {appointment.outcome && (
                    <div>
                      <p className="text-sm text-gray-600">Compte-rendu</p>
                      <p className="mt-1">{appointment.outcome}</p>
                    </div>
                  )}
                  {appointment.rating && (
                    <div>
                      <p className="text-sm text-gray-600">Évaluation</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < appointment.rating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {appointment.rating}/5
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {appointment.attendees && appointment.attendees.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participants ({appointment.attendees.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {appointment.attendees.map((attendee: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{attendee.name || attendee.email}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Relations et Paramètres */}
          <div className="space-y-6">
            {appointment.reminder && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Rappel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Rappel activé</span>
                  </div>
                  {appointment.reminderTime && (
                    <p className="text-sm text-gray-600">
                      {appointment.reminderTime} minutes avant
                    </p>
                  )}
                  {appointment.reminderSent && (
                    <Badge variant="outline" className="text-xs">
                      Rappel envoyé
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {appointment.prospectId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Prospect
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appointment.prospects ? (
                    <div className="space-y-2">
                      <p className="font-medium">
                        {appointment.prospects.firstName} {appointment.prospects.lastName}
                      </p>
                      {appointment.prospects.email && (
                        <p className="text-sm text-gray-600">{appointment.prospects.email}</p>
                      )}
                      {appointment.prospects.phone && (
                        <p className="text-sm text-gray-600">{appointment.prospects.phone}</p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => router.push(`/prospects/${appointment.prospectId}`)}
                      >
                        Voir le prospect
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">ID: {appointment.prospectId}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push(`/prospects/${appointment.prospectId}`)}
                      >
                        Voir le prospect
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {appointment.propertyId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Propriété
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appointment.properties ? (
                    <div className="space-y-2">
                      <p className="font-medium">{appointment.properties.title}</p>
                      {appointment.properties.address && (
                        <p className="text-sm text-gray-600">{appointment.properties.address}</p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => router.push(`/properties/${appointment.propertyId}`)}
                      >
                        Voir la propriété
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">ID: {appointment.propertyId}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push(`/properties/${appointment.propertyId}`)}
                      >
                        Voir la propriété
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {appointment.color && (
              <Card>
                <CardHeader>
                  <CardTitle>Couleur</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: appointment.color }}
                    />
                    <span className="text-sm text-gray-600">{appointment.color}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Créé le</p>
                  <p className="font-medium">
                    {new Date(appointment.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Dernière modification</p>
                  <p className="font-medium">
                    {new Date(appointment.updatedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
