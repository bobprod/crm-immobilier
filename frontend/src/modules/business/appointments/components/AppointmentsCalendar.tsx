import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Calendar, Clock, MapPin, User, Phone, Home, Plus, Edit, Trash2, Check, X, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { appointmentsAPI, getAppointmentTypeLabel, getAppointmentStatusLabel, getAppointmentStatusColor, formatAppointmentTime, formatAppointmentDate, Appointment } from '@/shared/utils/appointments-api';
import { useToast } from '@/shared/components/ui/use-toast';

export default function AppointmentsCalendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, view]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const data = await appointmentsAPI.getAll({
        startDate,
        endDate,
      });
      setAppointments(data);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    if (view === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (view === 'week') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce rendez-vous ?')) return;

    try {
      await appointmentsAPI.delete(id);
      toast({
        title: 'Succès',
        description: '✅ Rendez-vous supprimé',
      });
      loadAppointments();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await appointmentsAPI.complete(id);
      toast({
        title: 'Succès',
        description: '✅ Rendez-vous marqué comme terminé',
      });
      loadAppointments();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Raison de l\'annulation (optionnel):');
    try {
      await appointmentsAPI.cancel(id, reason || undefined);
      toast({
        title: 'Succès',
        description: '✅ Rendez-vous annulé',
      });
      loadAppointments();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-gray-500 mt-1">
            Gérez vos rendez-vous immobiliers
          </p>
        </div>

        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau RDV
        </Button>
      </div>

      {/* Navigation & View Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
                Aujourd'hui
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-4 font-semibold text-lg">
                {selectedDate.toLocaleDateString('fr-FR', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="flex gap-2">
              <Button variant={view === 'day' ? 'default' : 'outline'} onClick={() => setView('day')}>
                Jour
              </Button>
              <Button variant={view === 'week' ? 'default' : 'outline'} onClick={() => setView('week')}>
                Semaine
              </Button>
              <Button variant={view === 'month' ? 'default' : 'outline'} onClick={() => setView('month')}>
                Mois
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-500">
            Chargement...
          </div>
        ) : appointments.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Aucun rendez-vous pour cette période</p>
          </div>
        ) : (
          appointments.map((apt) => (
            <Card key={apt.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{apt.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatAppointmentTime(apt.startTime, apt.endTime)}
                    </div>
                  </div>
                  <Badge className={getAppointmentStatusColor(apt.status)}>
                    {getAppointmentStatusLabel(apt.status)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-2 text-sm">
                  {apt.description && (
                    <p className="text-gray-600 line-clamp-2">{apt.description}</p>
                  )}

                  {apt.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{apt.location}</span>
                    </div>
                  )}

                  {apt.prospects && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4" />
                      <span>
                        {apt.prospects.firstName} {apt.prospects.lastName}
                      </span>
                    </div>
                  )}

                  {apt.properties && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Home className="h-4 w-4" />
                      <span className="truncate">{apt.properties.title}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-2">
                    <Badge variant="outline">{getAppointmentTypeLabel(apt.type)}</Badge>
                    {apt.priority === 'high' || apt.priority === 'urgent' ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {apt.priority === 'urgent' ? 'URGENT' : 'Prioritaire'}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex gap-2 pt-2 border-t mt-3">
                    {apt.status === 'scheduled' || apt.status === 'confirmed' ? (
                      <>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleComplete(apt.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSelectedAppointment(apt); setEditOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-red-600" onClick={() => handleCancel(apt.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDelete(apt.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <CreateAppointmentDialog 
        open={createOpen} 
        onOpenChange={setCreateOpen}
        onSuccess={loadAppointments}
      />

      {/* Edit Dialog */}
      {selectedAppointment && (
        <EditAppointmentDialog 
          open={editOpen}
          onOpenChange={setEditOpen}
          appointment={selectedAppointment}
          onSuccess={loadAppointments}
        />
      )}
    </div>
  );
}

// Create Dialog Component
function CreateAppointmentDialog({ open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('visit');
  const [priority, setPriority] = useState('medium');
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!title || !startTime || !endTime) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Convert datetime-local format to ISO string
      const startTimeISO = new Date(startTime).toISOString();
      const endTimeISO = new Date(endTime).toISOString();

      await appointmentsAPI.create({
        title,
        description,
        startTime: startTimeISO,
        endTime: endTimeISO,
        location,
        type,
        priority,
      });

      toast({
        title: 'Succès',
        description: '✅ Rendez-vous créé avec succès',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setLocation('');
      setType('visit');
      setPriority('medium');

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau Rendez-vous</DialogTitle>
          <DialogDescription>
            Créer un nouveau rendez-vous dans votre agenda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              placeholder="Visite appartement Paris 15ème"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visit">Visite</SelectItem>
                  <SelectItem value="signature">Signature</SelectItem>
                  <SelectItem value="expertise">Expertise</SelectItem>
                  <SelectItem value="estimation">Estimation</SelectItem>
                  <SelectItem value="meeting">Réunion</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Début *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="endTime">Fin *</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Lieu</Label>
            <Input
              id="location"
              placeholder="123 Rue de Paris, 75015 Paris"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Détails du rendez-vous..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Création...' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Edit Dialog Component (similaire mais avec données pré-remplies)
function EditAppointmentDialog({ open, onOpenChange, appointment, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(appointment.title);
  const [description, setDescription] = useState(appointment.description || '');
  const [location, setLocation] = useState(appointment.location || '');
  const [status, setStatus] = useState(appointment.status);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await appointmentsAPI.update(appointment.id, {
        title,
        description,
        location,
        status,
      });

      toast({
        title: 'Succès',
        description: '✅ Rendez-vous mis à jour',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier le Rendez-vous</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="edit-title">Titre</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="edit-status">Statut</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Planifié</SelectItem>
                <SelectItem value="confirmed">Confirmé</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
                <SelectItem value="rescheduled">Reprogrammé</SelectItem>
                <SelectItem value="no_show">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-location">Lieu</Label>
            <Input
              id="edit-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Mise à jour...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
