import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/components/ui/use-toast";
import {
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Home,
  Users,
  Clock,
  MessageSquare,
  History,
  TrendingUp,
  CheckCircle2,
  Circle,
  ArrowRight,
  User,
  Building2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useProspectsEnhanced, ProspectEnhanced, ProspectInteraction } from "@/shared/hooks/useProspectsEnhanced";

// Types
type ProspectType = 'requete_location' | 'requete_achat' | 'mandat_location' | 'mandat_vente' | 'promoteur';
type FunnelStage = 'lead' | 'contacted' | 'qualified' | 'negotiation' | 'closing' | 'converted' | 'lost';

interface ProspectManagementConnectedProps {
  language?: string;
  currency?: string;
}

// Funnel stages configuration
const FUNNEL_STAGES: { key: FunnelStage; label: string; color: string }[] = [
  { key: 'lead', label: 'Lead', color: 'bg-gray-500' },
  { key: 'contacted', label: 'Contacte', color: 'bg-blue-500' },
  { key: 'qualified', label: 'Qualifie', color: 'bg-indigo-500' },
  { key: 'negotiation', label: 'Negociation', color: 'bg-purple-500' },
  { key: 'closing', label: 'Closing', color: 'bg-orange-500' },
  { key: 'converted', label: 'Converti', color: 'bg-green-500' },
  { key: 'lost', label: 'Perdu', color: 'bg-red-500' },
];

// Prospect types configuration
const PROSPECT_TYPES: { key: ProspectType; label: string; icon: React.ReactNode }[] = [
  { key: 'requete_achat', label: 'Requete Achat', icon: <Home className="h-4 w-4" /> },
  { key: 'requete_location', label: 'Requete Location', icon: <Building2 className="h-4 w-4" /> },
  { key: 'mandat_vente', label: 'Mandat Vente', icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'mandat_location', label: 'Mandat Location', icon: <Users className="h-4 w-4" /> },
  { key: 'promoteur', label: 'Promoteur', icon: <Building2 className="h-4 w-4" /> },
];

export default function ProspectManagementConnected({
  language = "fr",
  currency = "TND",
}: ProspectManagementConnectedProps) {
  const { toast } = useToast();

  // Hook API
  const {
    prospects,
    loading,
    error,
    stats,
    loadProspectsByType,
    searchProspects,
    createProspect,
    getProspectFull,
    addInteraction,
    changeStage,
    loadStats,
    clearError,
    setProspects,
  } = useProspectsEnhanced();

  // Local state
  const [activeTab, setActiveTab] = useState<ProspectType>('requete_achat');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<ProspectEnhanced | null>(null);
  const [interactionType, setInteractionType] = useState<'phone' | 'email' | 'sms' | 'whatsapp' | 'meeting'>('phone');
  const [interactionNotes, setInteractionNotes] = useState("");
  const [interactionOutcome, setInteractionOutcome] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextActionDate, setNextActionDate] = useState("");

  // Form state for new prospect
  const [newProspect, setNewProspect] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    type: "buyer" as const,
    prospectType: activeTab,
    status: "lead" as const,
    budget: { min: 0, max: 0, currency },
    searchCriteria: {
      propertyType: "",
      city: "",
      bedrooms: 0,
      area: 0,
    },
    notes: "",
    source: "",
  });

  // Load prospects on tab change
  useEffect(() => {
    loadProspectsByType(activeTab).catch(console.error);
  }, [activeTab, loadProspectsByType]);

  // Load stats on mount
  useEffect(() => {
    loadStats().catch(console.error);
  }, [loadStats]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchProspects({ query: searchTerm, prospectType: activeTab }).catch(console.error);
      } else {
        loadProspectsByType(activeTab).catch(console.error);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, activeTab, searchProspects, loadProspectsByType]);

  // Filter prospects by status
  const filteredProspects = statusFilter === "all"
    ? prospects
    : prospects.filter(p => p.status === statusFilter);

  // Format currency
  const formatCurrency = (amount: number, curr: string = currency) => {
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: curr,
    }).format(amount);
  };

  // Get initials for avatar
  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'P';
  };

  // Handle create prospect
  const handleCreateProspect = async () => {
    try {
      await createProspect({
        ...newProspect,
        prospectType: activeTab,
      });
      toast({
        title: "Succes",
        description: "Prospect cree avec succes",
      });
      setIsAddDialogOpen(false);
      resetNewProspectForm();
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de creer le prospect",
        variant: "destructive",
      });
    }
  };

  // Reset form
  const resetNewProspectForm = () => {
    setNewProspect({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      type: "buyer",
      prospectType: activeTab,
      status: "lead",
      budget: { min: 0, max: 0, currency },
      searchCriteria: {
        propertyType: "",
        city: "",
        bedrooms: 0,
        area: 0,
      },
      notes: "",
      source: "",
    });
  };

  // Handle add interaction
  const handleAddInteraction = async () => {
    if (!selectedProspect) return;

    try {
      await addInteraction(selectedProspect.id, {
        channel: interactionType,
        type: interactionType,
        notes: interactionNotes,
        nextAction,
        nextActionDate: nextActionDate || undefined,
        sentiment: interactionOutcome === 'positive' ? 'positive' : interactionOutcome === 'negative' ? 'negative' : 'neutral',
      });
      toast({
        title: "Succes",
        description: "Interaction ajoutee",
      });
      setIsInteractionDialogOpen(false);
      resetInteractionForm();
      // Refresh prospect data
      if (selectedProspect) {
        const updated = await getProspectFull(selectedProspect.id);
        setSelectedProspect(updated);
      }
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'interaction",
        variant: "destructive",
      });
    }
  };

  // Reset interaction form
  const resetInteractionForm = () => {
    setInteractionNotes("");
    setInteractionOutcome("");
    setNextAction("");
    setNextActionDate("");
    setInteractionType('phone');
  };

  // Handle stage change
  const handleStageChange = async (prospectId: string, newStage: string) => {
    try {
      await changeStage(prospectId, newStage);
      toast({
        title: "Succes",
        description: `Etape changee vers ${newStage}`,
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de changer l'etape",
        variant: "destructive",
      });
    }
  };

  // View prospect details
  const handleViewProspect = async (prospect: ProspectEnhanced) => {
    try {
      const fullProspect = await getProspectFull(prospect.id);
      setSelectedProspect(fullProspect);
      setIsDetailDialogOpen(true);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les details",
        variant: "destructive",
      });
    }
  };

  // Open interaction dialog
  const handleOpenInteraction = (prospect: ProspectEnhanced, type: 'phone' | 'email' | 'sms' | 'whatsapp') => {
    setSelectedProspect(prospect);
    setInteractionType(type);
    setIsInteractionDialogOpen(true);
  };

  // Get interaction icon
  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  // Get stage color
  const getStageColor = (status: string) => {
    const stage = FUNNEL_STAGES.find(s => s.key === status);
    return stage?.color || 'bg-gray-500';
  };

  // Render prospect card
  const renderProspectCard = (prospect: ProspectEnhanced) => (
    <Card key={prospect.id} className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-purple-100 text-purple-600">
                {getInitials(prospect.firstName, prospect.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">
                {prospect.firstName} {prospect.lastName}
              </h3>
              <p className="text-sm text-gray-500">{prospect.email}</p>
              {prospect.phone && (
                <p className="text-sm text-gray-500">{prospect.phone}</p>
              )}
            </div>
          </div>
          <Badge className={`${getStageColor(prospect.status)} text-white`}>
            {FUNNEL_STAGES.find(s => s.key === prospect.status)?.label || prospect.status}
          </Badge>
        </div>

        {/* Budget & Criteria */}
        {prospect.budget && (
          <div className="mt-3 flex items-center text-sm text-gray-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            Budget: {formatCurrency(prospect.budget.min || 0)} - {formatCurrency(prospect.budget.max || 0)}
          </div>
        )}

        {prospect.searchCriteria?.city && (
          <div className="mt-1 flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-1" />
            {prospect.searchCriteria.city}
          </div>
        )}

        {/* Last interaction */}
        {prospect.interactions && prospect.interactions.length > 0 && (
          <div className="mt-2 p-2 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-500 flex items-center">
              <History className="h-3 w-3 mr-1" />
              Derniere interaction: {new Date(prospect.interactions[0].date).toLocaleDateString('fr-FR')}
            </p>
            <p className="text-sm text-gray-700 truncate">
              {prospect.interactions[0].notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); handleOpenInteraction(prospect, 'phone'); }}
              title="Appeler"
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); handleOpenInteraction(prospect, 'email'); }}
              title="Email"
            >
              <Mail className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); handleOpenInteraction(prospect, 'whatsapp'); }}
              title="WhatsApp"
            >
              <MessageSquare className="h-4 w-4 text-green-500" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewProspect(prospect)}
          >
            Voir details
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Prospects</h1>
          <p className="text-gray-600">
            {prospects.length} prospect{prospects.length > 1 ? 's' : ''} {activeTab.replace('_', ' ')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => loadProspectsByType(activeTab)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Prospect
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.byStatus.slice(0, 4).map((stat) => (
            <Card key={stat.status}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 capitalize">{stat.status}</p>
                    <p className="text-2xl font-bold">{stat._count}</p>
                  </div>
                  <Badge className={getStageColor(stat.status)}>{stat.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs by prospect type */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProspectType)}>
        <TabsList className="grid grid-cols-5 w-full">
          {PROSPECT_TYPES.map((type) => (
            <TabsTrigger key={type.key} value={type.key} className="flex items-center gap-2">
              {type.icon}
              <span className="hidden md:inline">{type.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Search and Filter */}
        <div className="mt-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par nom, email, telephone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {FUNNEL_STAGES.map((stage) => (
                <SelectItem key={stage.key} value={stage.key}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content for each tab */}
        {PROSPECT_TYPES.map((type) => (
          <TabsContent key={type.key} value={type.key} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : error ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-red-500">{error}</p>
                  <Button
                    variant="outline"
                    onClick={() => { clearError(); loadProspectsByType(activeTab); }}
                    className="mt-4"
                  >
                    Reessayer
                  </Button>
                </CardContent>
              </Card>
            ) : filteredProspects.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucun prospect trouve
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? "Essayez une autre recherche" : "Commencez par ajouter un prospect"}
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un prospect
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProspects.map(renderProspectCard)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Prospect Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau Prospect</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Prenom *</Label>
              <Input
                value={newProspect.firstName}
                onChange={(e) => setNewProspect({ ...newProspect, firstName: e.target.value })}
                placeholder="Prenom"
              />
            </div>
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={newProspect.lastName}
                onChange={(e) => setNewProspect({ ...newProspect, lastName: e.target.value })}
                placeholder="Nom"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newProspect.email}
                onChange={(e) => setNewProspect({ ...newProspect, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Telephone</Label>
              <Input
                value={newProspect.phone}
                onChange={(e) => setNewProspect({ ...newProspect, phone: e.target.value })}
                placeholder="+216 XX XXX XXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Type de client</Label>
              <Select
                value={newProspect.type}
                onValueChange={(v) => setNewProspect({ ...newProspect, type: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Acheteur</SelectItem>
                  <SelectItem value="seller">Vendeur</SelectItem>
                  <SelectItem value="renter">Locataire</SelectItem>
                  <SelectItem value="landlord">Proprietaire</SelectItem>
                  <SelectItem value="investor">Investisseur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select
                value={newProspect.source}
                onValueChange={(v) => setNewProspect({ ...newProspect, source: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Site web</SelectItem>
                  <SelectItem value="referral">Recommandation</SelectItem>
                  <SelectItem value="social">Reseaux sociaux</SelectItem>
                  <SelectItem value="phone">Appel entrant</SelectItem>
                  <SelectItem value="walk-in">Visite agence</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Budget Min ({currency})</Label>
              <Input
                type="number"
                value={newProspect.budget.min || ""}
                onChange={(e) => setNewProspect({
                  ...newProspect,
                  budget: { ...newProspect.budget, min: parseInt(e.target.value) || 0 }
                })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Budget Max ({currency})</Label>
              <Input
                type="number"
                value={newProspect.budget.max || ""}
                onChange={(e) => setNewProspect({
                  ...newProspect,
                  budget: { ...newProspect.budget, max: parseInt(e.target.value) || 0 }
                })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Ville recherchee</Label>
              <Input
                value={newProspect.searchCriteria.city}
                onChange={(e) => setNewProspect({
                  ...newProspect,
                  searchCriteria: { ...newProspect.searchCriteria, city: e.target.value }
                })}
                placeholder="Tunis, La Marsa..."
              />
            </div>
            <div className="space-y-2">
              <Label>Type de propriete</Label>
              <Select
                value={newProspect.searchCriteria.propertyType}
                onValueChange={(v) => setNewProspect({
                  ...newProspect,
                  searchCriteria: { ...newProspect.searchCriteria, propertyType: v }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Appartement</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="house">Maison</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="land">Terrain</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nombre de chambres</Label>
              <Input
                type="number"
                value={newProspect.searchCriteria.bedrooms || ""}
                onChange={(e) => setNewProspect({
                  ...newProspect,
                  searchCriteria: { ...newProspect.searchCriteria, bedrooms: parseInt(e.target.value) || 0 }
                })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Surface min (m2)</Label>
              <Input
                type="number"
                value={newProspect.searchCriteria.area || ""}
                onChange={(e) => setNewProspect({
                  ...newProspect,
                  searchCriteria: { ...newProspect.searchCriteria, area: parseInt(e.target.value) || 0 }
                })}
                placeholder="0"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={newProspect.notes}
                onChange={(e) => setNewProspect({ ...newProspect, notes: e.target.value })}
                placeholder="Notes sur le prospect..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateProspect} disabled={!newProspect.firstName || !newProspect.lastName}>
              Creer le prospect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Interaction Dialog */}
      <Dialog open={isInteractionDialogOpen} onOpenChange={setIsInteractionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getInteractionIcon(interactionType)}
              Nouvelle interaction - {selectedProspect?.firstName} {selectedProspect?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type d&apos;interaction</Label>
              <Select
                value={interactionType}
                onValueChange={(v) => setInteractionType(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Appel telephonique</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="meeting">Rendez-vous</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={interactionNotes}
                onChange={(e) => setInteractionNotes(e.target.value)}
                placeholder="Resume de l'echange..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Resultat</Label>
              <Select value={interactionOutcome} onValueChange={setInteractionOutcome}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positif</SelectItem>
                  <SelectItem value="neutral">Neutre</SelectItem>
                  <SelectItem value="negative">Negatif</SelectItem>
                  <SelectItem value="no_answer">Pas de reponse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prochaine action</Label>
              <Input
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="Ex: Rappeler pour confirmation..."
              />
            </div>
            <div className="space-y-2">
              <Label>Date prochaine action</Label>
              <Input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInteractionDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddInteraction}>
              Enregistrer l&apos;interaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prospect Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProspect?.firstName} {selectedProspect?.lastName}
            </DialogTitle>
          </DialogHeader>
          {selectedProspect && (
            <div className="space-y-6 py-4">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p>{selectedProspect.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Telephone</Label>
                  <p>{selectedProspect.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Statut</Label>
                  <Badge className={`${getStageColor(selectedProspect.status)} text-white`}>
                    {selectedProspect.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-500">Score</Label>
                  <p>{selectedProspect.score}/100</p>
                </div>
              </div>

              {/* Budget */}
              {selectedProspect.budget && (
                <div>
                  <Label className="text-gray-500">Budget</Label>
                  <p>
                    {formatCurrency(selectedProspect.budget.min || 0)} - {formatCurrency(selectedProspect.budget.max || 0)}
                  </p>
                </div>
              )}

              {/* Search Criteria */}
              {selectedProspect.searchCriteria && (
                <div>
                  <Label className="text-gray-500">Criteres de recherche</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    {selectedProspect.searchCriteria.city && (
                      <p><MapPin className="h-4 w-4 inline mr-1" />{selectedProspect.searchCriteria.city}</p>
                    )}
                    {selectedProspect.searchCriteria.propertyType && (
                      <p><Home className="h-4 w-4 inline mr-1" />{selectedProspect.searchCriteria.propertyType}</p>
                    )}
                    {selectedProspect.searchCriteria.bedrooms && (
                      <p>{selectedProspect.searchCriteria.bedrooms} chambres</p>
                    )}
                  </div>
                </div>
              )}

              {/* Change Stage */}
              <div>
                <Label className="text-gray-500">Changer l&apos;etape</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {FUNNEL_STAGES.map((stage) => (
                    <Button
                      key={stage.key}
                      size="sm"
                      variant={selectedProspect.status === stage.key ? "default" : "outline"}
                      className={selectedProspect.status === stage.key ? stage.color : ''}
                      onClick={() => handleStageChange(selectedProspect.id, stage.key)}
                    >
                      {stage.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Interactions History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-500">Historique des interactions</Label>
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      setIsInteractionDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
                {selectedProspect.interactions && selectedProspect.interactions.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedProspect.interactions.map((interaction, idx) => (
                      <div key={interaction.id || idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {getInteractionIcon(interaction.channel || interaction.type)}
                            <span className="font-medium capitalize">{interaction.type}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(interaction.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{interaction.notes}</p>
                        {interaction.nextAction && (
                          <p className="text-sm text-blue-600 mt-1">
                            <ArrowRight className="h-3 w-3 inline mr-1" />
                            {interaction.nextAction}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Aucune interaction enregistree</p>
                )}
              </div>

              {/* Notes */}
              {selectedProspect.notes && (
                <div>
                  <Label className="text-gray-500">Notes</Label>
                  <p className="mt-1 text-sm">{selectedProspect.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
