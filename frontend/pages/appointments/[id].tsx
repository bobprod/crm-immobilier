import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import {
  appointmentsAPI,
  Appointment,
  getAppointmentStatusColor,
  getAppointmentStatusLabel,
  getAppointmentTypeLabel,
  getAppointmentPriorityLabel,
  getAppointmentPriorityColor,
  formatAppointmentDate,
  formatAppointmentTime,
} from '@/shared/utils/appointments-api';

export default function AppointmentDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadAppointment(id);
    }
  }, [id]);

  const loadAppointment = async (appointmentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await appointmentsAPI.getById(appointmentId);
      setAppointment(data);
    } catch (err: any) {
      console.error('Erreur chargement RDV:', err);
      setError(err?.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!appointment || !confirm('Marquer ce rendez-vous comme termine?')) return;
    setActionLoading(true);
    try {
      await appointmentsAPI.complete(appointment.id);
      loadAppointment(appointment.id);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment || !confirm('Annuler ce rendez-vous?')) return;
    setActionLoading(true);
    try {
      await appointmentsAPI.cancel(appointment.id, 'Annule par utilisateur');
      loadAppointment(appointment.id);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment || !confirm('Supprimer definitivement ce rendez-vous?')) return;
    setActionLoading(true);
    try {
      await appointmentsAPI.delete(appointment.id);
      router.push('/appointments');
    } catch (err) {
      console.error('Erreur:', err);
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error || !appointment) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error || 'Rendez-vous non trouve'}</p>
          <Button onClick={() => router.push('/appointments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux rendez-vous
          </Button>
        </div>
      </Layout>
    );
  }

  const isPast = new Date(appointment.startTime) < new Date();
  const canModify = !['completed', 'cancelled'].includes(appointment.status);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/appointments')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{appointment.title}</h1>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline">{getAppointmentTypeLabel(appointment.type)}</Badge>
                <Badge className={getAppointmentStatusColor(appointment.status)}>
                  {getAppointmentStatusLabel(appointment.status)}
                </Badge>
              </div>
            </div>
          </div>

          {canModify && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/appointments/${id}/edit`)}
                disabled={actionLoading}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date et Heure */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Date et horaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-xl font-semibold">
                  {formatAppointmentDate(appointment.startTime)}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-5 w-5" />
                  <span className="text-lg">
                    {formatAppointmentTime(appointment.startTime, appointment.endTime)}
                  </span>
                </div>
                {isPast && appointment.status === 'scheduled' && (
                  <div className="bg-yellow-50 text-yellow-800 px-3 py-2 rounded text-sm">
                    Ce rendez-vous est passe mais n'a pas ete marque comme termine.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lieu */}
            {appointment.location && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-red-600" />
                    Lieu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">{appointment.location}</p>
                </CardContent>
              </Card>
            )}

            {/* Description / Notes */}
            {(appointment.description || appointment.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {appointment.description || appointment.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Resultat (si termine) */}
            {appointment.status === 'completed' && appointment.outcome && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Resultat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{appointment.outcome}</p>
                  {appointment.rating && (
                    <div className="mt-2 flex items-center gap-1">
                      <span>Note:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={star <= appointment.rating! ? 'text-yellow-400' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Priorite */}
            <Card>
              <CardHeader>
                <CardTitle>Priorite</CardTitle>
              </CardHeader>
              <CardContent>
                <span className={`font-semibold ${getAppointmentPriorityColor(appointment.priority)}`}>
                  {getAppointmentPriorityLabel(appointment.priority)}
                </span>
              </CardContent>
            </Card>

            {/* Prospect lie */}
            {appointment.prospects && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Prospect
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">
                    {appointment.prospects.firstName} {appointment.prospects.lastName}
                  </p>
                  {appointment.prospects.email && (
                    <p className="text-sm text-gray-500">{appointment.prospects.email}</p>
                  )}
                  {appointment.prospects.phone && (
                    <p className="text-sm text-gray-500">{appointment.prospects.phone}</p>
                  )}
                  <Button
                    variant="link"
                    className="p-0 mt-2"
                    onClick={() => router.push(`/prospects/${appointment.prospects.id}`)}
                  >
                    Voir le prospect →
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Bien lie */}
            {appointment.properties && (
              <Card>
                <CardHeader>
                  <CardTitle>Bien concerne</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{appointment.properties.title}</p>
                  {appointment.properties.address && (
                    <p className="text-sm text-gray-500">{appointment.properties.address}</p>
                  )}
                  <Button
                    variant="link"
                    className="p-0 mt-2"
                    onClick={() => router.push(`/properties/${appointment.properties.id}`)}
                  >
                    Voir le bien →
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Actions rapides */}
            {canModify && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full"
                    variant="default"
                    onClick={handleComplete}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marquer termine
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={actionLoading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Meta */}
            <Card>
              <CardContent className="pt-6 text-sm text-gray-500">
                <div>Cree le {new Date(appointment.createdAt).toLocaleDateString('fr-FR')}</div>
                <div>Mis a jour le {new Date(appointment.updatedAt).toLocaleDateString('fr-FR')}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
