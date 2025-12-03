import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Clock,
  Home,
  Heart,
  X,
  Calendar,
  CalendarPlus,
  Eye,
  TrendingUp,
  MessageCircle,
  Video,
  CheckCircle,
} from 'lucide-react';
import { prospectsEnhancedAPI } from '@/shared/utils/prospects-enhanced-api';
import { prospectsAppointmentsAPI } from '@/shared/utils/prospects-appointments-api';

interface ProspectCardProps {
  prospectId: string;
}

export default function ProspectCard({ prospectId }: ProspectCardProps) {
  const router = useRouter();
  const [prospect, setProspect] = useState<any>(null);
  const [nextAction, setNextAction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  // Appointment form state
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentStartTime, setAppointmentStartTime] = useState('09:00');
  const [appointmentEndTime, setAppointmentEndTime] = useState('10:00');
  const [appointmentType, setAppointmentType] = useState('visit');
  const [appointmentLocation, setAppointmentLocation] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');

  useEffect(() => {
    loadProspect();
  }, [prospectId]);

  const loadProspect = async () => {
    try {
      const [prospectData, nextActionData] = await Promise.all([
        prospectsEnhancedAPI.getProspectFull(prospectId),
        prospectsAppointmentsAPI.getNextAction(prospectId),
      ]);

      setProspect(prospectData);
      setNextAction(nextActionData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!appointmentTitle || !appointmentDate) {
      alert('Veuillez remplir le titre et la date');
      return;
    }

    setAppointmentLoading(true);
    try {
      const startDateTime = new Date(`${appointmentDate}T${appointmentStartTime}`).toISOString();
      const endDateTime = new Date(`${appointmentDate}T${appointmentEndTime}`).toISOString();

      await prospectsAppointmentsAPI.createAppointment(prospectId, {
        title: appointmentTitle,
        startTime: startDateTime,
        endTime: endDateTime,
        type: appointmentType,
        location: appointmentLocation || undefined,
        notes: appointmentNotes || undefined,
      });

      // Reset form
      setAppointmentTitle('');
      setAppointmentDate('');
      setAppointmentStartTime('09:00');
      setAppointmentEndTime('10:00');
      setAppointmentType('visit');
      setAppointmentLocation('');
      setAppointmentNotes('');
      setShowAppointmentModal(false);

      // Reload to get updated next action
      loadProspect();
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      alert(error?.response?.data?.message || 'Erreur lors de la creation du rendez-vous');
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleViewAppointment = () => {
    if (nextAction?.details?.id) {
      router.push(`/appointments/${nextAction.details.id}`);
    }
  };

  const getProspectTypeLabel = (type: string) => {
    const labels: any = {
      requete_location: '🔎 Requête Location',
      requete_achat: '🏠 Requête Achat',
      mandat_location: '📝 Mandat Location',
      mandat_vente: '💰 Mandat Vente',
      promoteur: '🏗️ Promoteur',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-purple-100 text-purple-800',
      qualified: 'bg-green-100 text-green-800',
      searching: 'bg-yellow-100 text-yellow-800',
      visiting: 'bg-orange-100 text-orange-800',
      negotiating: 'bg-red-100 text-red-800',
      signed: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getNextActionIcon = (type: string, appointmentType?: string) => {
    if (type === 'appointment') {
      if (appointmentType === 'call') return <Phone className="h-4 w-4" />;
      if (appointmentType === 'visit') return <Eye className="h-4 w-4" />;
      if (appointmentType === 'meeting') return <Video className="h-4 w-4" />;
      return <Calendar className="h-4 w-4" />;
    }
    return <MessageCircle className="h-4 w-4" />;
  };

  const formatNextActionDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days === 0 && hours === 0) {
      return `Aujourd'hui à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 0) {
      return `Aujourd'hui à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} (dans ${hours}h)`;
    } else if (days === 1) {
      return `Demain à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days < 7) {
      return `${d.toLocaleDateString('fr-FR', { weekday: 'long' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-32 bg-gray-200 rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!prospect) {
    return null;
  }

  const criteria = prospect.searchCriteria || {};
  const budget = prospect.budget || {};

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {prospect.firstName?.[0]}{prospect.lastName?.[0]}
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {prospect.firstName} {prospect.lastName}
                </CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    {getProspectTypeLabel(prospect.prospectType)}
                  </Badge>
                  <Badge className={getStatusColor(prospect.status)}>
                    {prospect.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => setShowAppointmentModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              Nouveau Rendez-vous
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{prospect.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{prospect.email}</span>
            </div>
            {prospect.city && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{prospect.city}</span>
              </div>
            )}
            {prospect.timeline && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{prospect.timeline}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Prochaine Action Card */}
      {nextAction && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white">
                  {getNextActionIcon(nextAction.type, nextAction.appointmentType)}
                </div>
                <div>
                  <div className="font-semibold text-orange-900">
                    {nextAction.type === 'appointment' ? '📅 Prochain Rendez-vous' : '➡️ Prochaine Action'}
                  </div>
                  <div className="text-sm text-orange-700">
                    {nextAction.title}
                  </div>
                  <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatNextActionDate(nextAction.date)}
                  </div>
                </div>
              </div>
              {nextAction.type === 'appointment' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-500 text-orange-700"
                  onClick={handleViewAppointment}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Voir
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget & Critères */}
      <div className="grid md:grid-cols-2 gap-4">
        {budget.min && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {budget.min?.toLocaleString()} - {budget.max?.toLocaleString()} {budget.currency || 'TND'}
              </div>
            </CardContent>
          </Card>
        )}

        {criteria.propertyType && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-600" />
                Recherche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Type:</strong> {criteria.propertyType}</div>
                {criteria.rooms && <div><strong>Pièces:</strong> {criteria.rooms}</div>}
                {criteria.zones && (
                  <div><strong>Zones:</strong> {criteria.zones.join(', ')}</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Préférences */}
      {prospect.preferences && prospect.preferences.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-600" />
                Ce qu'il aime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {prospect.preferences
                  .flatMap((p: any) => p.liked || [])
                  .slice(0, 10)
                  .map((item: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {item}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <X className="h-5 w-5 text-red-600" />
                Ce qu'il n'aime pas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {prospect.preferences
                  .flatMap((p: any) => p.disliked || [])
                  .slice(0, 10)
                  .map((item: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-red-700 border-red-300">
                      <X className="h-3 w-3 mr-1" />
                      {item}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dernière Interaction */}
      {prospect.interactions && prospect.interactions[0] && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-600" />
              Dernière Interaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                {new Date(prospect.interactions[0].date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                <Badge variant="outline">{prospect.interactions[0].channel}</Badge>
                {prospect.interactions[0].sentiment && (
                  <Badge className={
                    prospect.interactions[0].sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                    prospect.interactions[0].sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {prospect.interactions[0].sentiment === 'positive' ? '😊' :
                     prospect.interactions[0].sentiment === 'negative' ? '😞' : '😐'}
                  </Badge>
                )}
              </div>
              <div className="font-semibold">{prospect.interactions[0].subject}</div>
              <div className="text-sm text-gray-600 italic">
                "{prospect.interactions[0].notes}"
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Biens Montrés */}
      {prospect.propertiesShown && prospect.propertiesShown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-600" />
              Biens Montrés ({prospect.propertiesShown.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prospect.propertiesShown.slice(0, 3).map((shown: any) => (
                <div
                  key={shown.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{shown.properties?.title}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(shown.shownDate).toLocaleDateString('fr-FR')}
                    </div>
                    {shown.feedback && (
                      <div className="text-sm text-gray-600 italic mt-1">
                        "{shown.feedback}"
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {shown.interestLevel && (
                      <Badge variant="outline">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {shown.interestLevel}/10
                      </Badge>
                    )}
                    <Badge className={
                      shown.outcome === 'interested' ? 'bg-green-100 text-green-800' :
                      shown.outcome === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {shown.outcome === 'interested' ? '✅ Intéressé' :
                       shown.outcome === 'rejected' ? '❌ Refusé' : '⏳ Peut-être'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Nouveau Rendez-vous */}
      <Dialog open={showAppointmentModal} onOpenChange={setShowAppointmentModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" />
              Nouveau Rendez-vous
            </DialogTitle>
            <DialogDescription>
              Creer un rendez-vous avec {prospect?.firstName} {prospect?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apt-title">Titre *</Label>
              <Input
                id="apt-title"
                placeholder="Ex: Visite appartement"
                value={appointmentTitle}
                onChange={(e) => setAppointmentTitle(e.target.value)}
                disabled={appointmentLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apt-type">Type</Label>
                <select
                  id="apt-type"
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={appointmentLoading}
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
                <Label htmlFor="apt-date">Date *</Label>
                <Input
                  id="apt-date"
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={appointmentLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apt-start">Heure debut</Label>
                <Input
                  id="apt-start"
                  type="time"
                  value={appointmentStartTime}
                  onChange={(e) => setAppointmentStartTime(e.target.value)}
                  disabled={appointmentLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apt-end">Heure fin</Label>
                <Input
                  id="apt-end"
                  type="time"
                  value={appointmentEndTime}
                  onChange={(e) => setAppointmentEndTime(e.target.value)}
                  disabled={appointmentLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apt-location">Lieu</Label>
              <Input
                id="apt-location"
                placeholder="Adresse du rendez-vous"
                value={appointmentLocation}
                onChange={(e) => setAppointmentLocation(e.target.value)}
                disabled={appointmentLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apt-notes">Notes</Label>
              <Textarea
                id="apt-notes"
                placeholder="Notes supplementaires..."
                value={appointmentNotes}
                onChange={(e) => setAppointmentNotes(e.target.value)}
                disabled={appointmentLoading}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAppointmentModal(false)}
              disabled={appointmentLoading}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateAppointment} disabled={appointmentLoading}>
              <CalendarPlus className="h-4 w-4 mr-2" />
              {appointmentLoading ? 'Creation...' : 'Creer le RDV'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
