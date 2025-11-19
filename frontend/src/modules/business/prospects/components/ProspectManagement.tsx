import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Checkbox } from "@/shared/components/ui/checkbox";
import { useToast } from "@/shared/components/ui/use-toast";
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Upload,
  Edit,
  Trash2,
  Home,
  Users,
  Clock,
  MessageSquare,
  Send,
  History,
  TrendingUp,
  CheckCircle2,
  Circle,
  ArrowRight,
  User,
  Building2,
} from "lucide-react";
import CalendarIntegrationService from "@/shared/utils/calendar-integration";

interface Requete {
  id: string;
  client: string;
  email: string;
  phone: string;
  budget: number;
  currency: string;
  localisation: string;
  typePropriete: string;
  sousType: string;
  nombreChambres: number;
  metresCarres: number;
  status: string;
  typeFinancement: string;
  destination: string;
  besoinsExigences: string;
  notes: string;
  avatarUrl: string;
  createdAt: string;
  negotiation: number;
  classeEnergetique: string;
  construction: boolean;
  meuble: boolean;
  neuf: boolean;
  gratuit: boolean;
  responsable: string;
}

interface Mandat {
  id: string;
  proprietaire: string;
  email: string;
  phone: string;
  prix: number;
  currency: string;
  localisation: string;
  typePropriete: string;
  sousType: string;
  nombreChambres: number;
  metresCarres: number;
  status: string;
  notes: string;
  avatarUrl: string;
  createdAt: string;
  propertyId?: string;
  propertyImage?: string;
  propertyTitle?: string;
}

interface Appointment {
  id: string;
  title: string;
  type: "viewing" | "signing" | "meeting" | "call";
  date: string;
  time: string;
  duration: number;
  location: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  propertyTitle?: string;
  notes: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
}

interface Interaction {
  id: string;
  type: 'call' | 'email' | 'sms' | 'whatsapp' | 'meeting';
  date: string;
  time: string;
  notes: string;
  outcome: string;
  nextAction?: string;
}

interface ProspectWithFunnel extends Requete {
  funnelStage: 'lead' | 'contacted' | 'qualified' | 'negotiation' | 'closing' | 'won' | 'lost';
  interactions: Interaction[];
  lastContact?: string;
  nextFollowUp?: string;
}

interface ProspectManagementProps {
  language?: string;
  currency?: string;
  onAppointmentCreated?: (appointment: Appointment) => void;
}

export default function ProspectManagement({
  language = "fr",
  currency = "TND",
}: ProspectManagementProps) {
  const { toast } = useToast();
  
  const [requetes, setRequetes] = useState<Requete[]>([
    {
      id: "1",
      client: "Sophie Martin",
      email: "sophie.martin@example.com",
      phone: "+216 55 123 456",
      budget: 900000,
      currency: "EUR",
      localisation: "La Marsa, Tunis",
      typePropriete: "Villa",
      sousType: "S+4",
      nombreChambres: 4,
      metresCarres: 250,
      status: "Requête chaude",
      typeFinancement: "Achat 100% avec crédit",
      destination: "Investissement",
      besoinsExigences: "Vue sur mer, parking",
      notes: "Cliente sérieuse, budget confirmé",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophie",
      createdAt: "2024-01-15",
      negotiation: 5,
      classeEnergetique: "B",
      construction: false,
      meuble: false,
      neuf: true,
      gratuit: false,
      responsable: "Agent Commercial",
    },
    {
      id: "2",
      client: "Ahmed Ben Ali",
      email: "ahmed.benali@example.com",
      phone: "+216 99 876 543",
      budget: 500000,
      currency: "EUR",
      localisation: "Lac 2, Tunis",
      typePropriete: "Appartement",
      sousType: "S+2",
      nombreChambres: 2,
      metresCarres: 120,
      status: "En négociation",
      typeFinancement: "Achat comptant",
      destination: "Résidence principale",
      besoinsExigences: "Moderne, ascenseur, parking",
      notes: "Première acquisition, besoin d'accompagnement",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed",
      createdAt: "2024-01-20",
      negotiation: 8,
      classeEnergetique: "A",
      construction: false,
      meuble: true,
      neuf: false,
      gratuit: false,
      responsable: "Agent Commercial",
    },
  ]);

  // Load prospects from localStorage on component mount
  useEffect(() => {
    const loadProspects = () => {
      try {
        const savedProspects = localStorage.getItem("crm-prospects");
        if (savedProspects) {
          const prospects = JSON.parse(savedProspects);
          // Merge with existing default prospects, avoiding duplicates
          const existingIds = requetes.map((r) => r.id);
          const newProspects = prospects.filter(
            (p: Requete) => !existingIds.includes(p.id),
          );
          if (newProspects.length > 0) {
            setRequetes((prev) => [...prev, ...newProspects]);
          }
        }
      } catch (error) {
        console.error("Error loading prospects:", error);
      }
    };

    loadProspects();

    // Listen for storage changes to update prospects in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "crm-prospects") {
        loadProspects();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const [mandats, setMandats] = useState<Mandat[]>([
    {
      id: "1",
      proprietaire: "Mohamed Trabelsi",
      email: "m.trabelsi@example.com",
      phone: "+216 98 765 432",
      prix: 850000,
      currency: "EUR",
      localisation: "Sidi Bou Said, Tunis",
      typePropriete: "Villa",
      sousType: "S+5",
      nombreChambres: 5,
      metresCarres: 300,
      status: "Mandat exclusif",
      notes: "Villa avec vue mer, jardin 500m²",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=mohamed",
      createdAt: "2024-01-10",
      propertyId: "MANDAT-001",
      propertyImage:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      propertyTitle: "Villa Moderne avec Piscine",
    },
  ]);

  const [activeTab, setActiveTab] = useState("requetes");
  const [isAddRequeteDialogOpen, setIsAddRequeteDialogOpen] = useState(false);
  const [isAddMandatDialogOpen, setIsAddMandatDialogOpen] = useState(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState<{
    name: string;
    type: "requete" | "mandat";
  } | null>(null);
  const [appointmentData, setAppointmentData] = useState({
    date: "",
    time: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    notes: "",
    type: "viewing" as "viewing" | "meeting" | "call" | "signing",
  });
  const [newRequete, setNewRequete] = useState<Partial<Requete>>({
    client: "",
    email: "",
    phone: "",
    budget: 0,
    currency: currency,
    localisation: "",
    typePropriete: "",
    sousType: "",
    nombreChambres: 0,
    metresCarres: 0,
    status: "Requête chaude",
    typeFinancement: "",
    destination: "",
    besoinsExigences: "",
    notes: "",
    negotiation: 0,
    classeEnergetique: "",
    construction: false,
    meuble: false,
    neuf: false,
    gratuit: false,
    responsable: "",
  });
  const [newMandat, setNewMandat] = useState<Partial<Mandat>>({
    proprietaire: "",
    email: "",
    phone: "",
    prix: 0,
    currency: currency,
    localisation: "",
    typePropriete: "",
    sousType: "",
    nombreChambres: 0,
    metresCarres: 0,
    status: "Mandat simple",
    notes: "",
  });

  const [selectedProspect, setSelectedProspect] = useState<ProspectWithFunnel | null>(null);
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false);
  const [interactionType, setInteractionType] = useState<'call' | 'email' | 'sms' | 'whatsapp'>('call');
  const [interactionNotes, setInteractionNotes] = useState("");
  const [interactionOutcome, setInteractionOutcome] = useState("");
  const [nextAction, setNextAction] = useState("");

  // Enhanced requetes with funnel stages
  const [requetesWithFunnel, setRequetesWithFunnel] = useState<ProspectWithFunnel[]>([
    {
      id: "1",
      client: "Sophie Martin",
      email: "sophie.martin@example.com",
      phone: "+216 55 123 456",
      budget: 900000,
      currency: "EUR",
      localisation: "La Marsa, Tunis",
      typePropriete: "Villa",
      sousType: "S+4",
      nombreChambres: 4,
      metresCarres: 250,
      status: "Requête chaude",
      typeFinancement: "Achat 100% avec crédit",
      destination: "Investissement",
      besoinsExigences: "Vue sur mer, parking",
      notes: "Cliente sérieuse, budget confirmé",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophie",
      createdAt: "2024-01-15",
      negotiation: 5,
      classeEnergetique: "B",
      construction: false,
      meuble: false,
      neuf: true,
      gratuit: false,
      responsable: "Agent Commercial",
      funnelStage: 'qualified',
      interactions: [
        {
          id: "int-1",
          type: 'call',
          date: "2024-01-15",
          time: "10:30",
          notes: "Premier contact, très intéressée par une villa avec vue mer",
          outcome: "Positif - Budget confirmé",
          nextAction: "Envoyer 3 propositions de villas"
        },
        {
          id: "int-2",
          type: 'email',
          date: "2024-01-16",
          time: "14:00",
          notes: "Envoyé 3 propositions de villas à La Marsa",
          outcome: "En attente de retour",
          nextAction: "Relance téléphonique dans 2 jours"
        }
      ],
      lastContact: "2024-01-16",
      nextFollowUp: "2024-01-18"
    },
  ]);

  const formatCurrency = (amount: number, curr: string) => {
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: curr,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Requête chaude":
        return "bg-red-500";
      case "En négociation":
        return "bg-orange-500";
      case "Requête froide":
        return "bg-blue-500";
      case "Convertie":
        return "bg-green-500";
      case "Mandat exclusif":
        return "bg-purple-500";
      case "Mandat simple":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getFunnelStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      lead: 'bg-gray-500',
      contacted: 'bg-blue-500',
      qualified: 'bg-indigo-500',
      negotiation: 'bg-purple-500',
      closing: 'bg-orange-500',
      won: 'bg-green-500',
      lost: 'bg-red-500'
    };
    return colors[stage] || 'bg-gray-500';
  };

  const getFunnelStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      lead: language === "fr" ? "Lead" : "Lead",
      contacted: language === "fr" ? "Contacté" : "Contacted",
      qualified: language === "fr" ? "Qualifié" : "Qualified",
      negotiation: language === "fr" ? "Négociation" : "Negotiation",
      closing: language === "fr" ? "Closing" : "Closing",
      won: language === "fr" ? "Gagné" : "Won",
      lost: language === "fr" ? "Perdu" : "Lost"
    };
    return labels[stage] || stage;
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const handleAddRequete = () => {
    const requete: Requete = {
      ...newRequete,
      id: Date.now().toString(),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newRequete.client}`,
      createdAt: new Date().toISOString().split("T")[0],
    } as Requete;

    setRequetes([...requetes, requete]);
    setNewRequete({
      client: "",
      email: "",
      phone: "",
      budget: 0,
      currency: currency,
      localisation: "",
      typePropriete: "",
      sousType: "",
      nombreChambres: 0,
      metresCarres: 0,
      status: "Requête chaude",
      typeFinancement: "",
      destination: "",
      besoinsExigences: "",
      notes: "",
      negotiation: 0,
      classeEnergetique: "",
      construction: false,
      meuble: false,
      neuf: false,
      gratuit: false,
      responsable: "",
    });
    setIsAddRequeteDialogOpen(false);
  };

  const handleAddMandat = () => {
    const mandat: Mandat = {
      ...newMandat,
      id: Date.now().toString(),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newMandat.proprietaire}`,
      createdAt: new Date().toISOString().split("T")[0],
    } as Mandat;

    setMandats([...mandats, mandat]);
    setNewMandat({
      proprietaire: "",
      email: "",
      phone: "",
      prix: 0,
      currency: currency,
      localisation: "",
      typePropriete: "",
      sousType: "",
      nombreChambres: 0,
      metresCarres: 0,
      status: "Mandat simple",
      notes: "",
    });
    setIsAddMandatDialogOpen(false);
  };

  const filteredRequetes = requetes.filter((requete) => {
    const matchesSearch = requete.client
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || requete.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredMandats = mandats.filter((mandat) => {
    const matchesSearch = mandat.proprietaire
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || mandat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Add interaction to prospect
  const addInteraction = () => {
    if (!selectedProspect || !interactionNotes.trim()) return;

    const newInteraction: Interaction = {
      id: `int-${Date.now()}`,
      type: interactionType,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      notes: interactionNotes,
      outcome: interactionOutcome,
      nextAction: nextAction
    };

    setRequetesWithFunnel(prev =>
      prev.map(req =>
        req.id === selectedProspect.id
          ? {
              ...req,
              interactions: [...req.interactions, newInteraction],
              lastContact: newInteraction.date,
              nextFollowUp: nextAction ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : req.nextFollowUp
            }
          : req
      )
    );

    // Reset form
    setInteractionNotes("");
    setInteractionOutcome("");
    setNextAction("");
    setIsInteractionDialogOpen(false);
  };

  // Update funnel stage
  const updateFunnelStage = (prospectId: string, newStage: ProspectWithFunnel['funnelStage']) => {
    setRequetesWithFunnel(prev =>
      prev.map(req =>
        req.id === prospectId
          ? { ...req, funnelStage: newStage }
          : req
      )
    );
  };

  // Enhanced appointment creation with calendar integration
  const handleCreateAppointmentFromProspect = (prospect: ProspectWithFunnel) => {
    setSelectedProspect(prospect);
    setAppointmentData({
      date: "",
      time: "",
      clientName: prospect.client,
      clientEmail: prospect.email,
      clientPhone: prospect.phone,
      notes: `Rendez-vous avec ${prospect.client} - ${prospect.typePropriete} ${prospect.sousType}`,
      type: "viewing",
    });
    setIsAppointmentDialogOpen(true);
  };

  // Create appointment using calendar integration service
  const handleSaveAppointment = () => {
    if (!selectedProspect || !appointmentData.date || !appointmentData.time) return;

    const appointment = CalendarIntegrationService.createProspectAppointment(
      selectedProspect.id,
      appointmentData.clientName,
      appointmentData.clientEmail,
      appointmentData.clientPhone,
      appointmentData.date,
      appointmentData.time,
      appointmentData.notes
    );

    // Add interaction to track the appointment
    const newInteraction: Interaction = {
      id: `int-${Date.now()}`,
      type: 'meeting',
      date: appointmentData.date,
      time: appointmentData.time,
      notes: `Rendez-vous planifié: ${appointmentData.notes}`,
      outcome: "Planifié",
      nextAction: "Confirmer 24h avant"
    };

    setRequetesWithFunnel(prev =>
      prev.map(req =>
        req.id === selectedProspect.id
          ? {
              ...req,
              interactions: [...req.interactions, newInteraction],
              nextFollowUp: appointmentData.date
            }
          : req
      )
    );

    toast({
      title: language === "fr" ? "Rendez-vous créé avec succès!" : "Appointment created successfully!",
      description:
        language === "fr"
          ? "Le rendez-vous a été ajouté au calendrier."
          : "The appointment has been added to the calendar.",
    });

    setIsAppointmentDialogOpen(false);
    setAppointmentData({
      date: "",
      time: "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      notes: "",
      type: "viewing",
    });
  };

  const handleConvertMandatToProperty = (mandat: Mandat) => {
    if (mandat.status !== "Mandat exclusif") {
      toast({
        title: language === "fr" ? "Conversion impossible" : "Cannot convert",
        description:
          language === "fr"
            ? "Seuls les mandats exclusifs peuvent être convertis en biens immobiliers"
            : "Only exclusive mandates can be converted to properties",
        variant: "destructive",
      });
      return;
    }

    const confirmMessage =
      language === "fr"
        ? `Convertir ce mandat exclusif en bien immobilier?\n\nPropriétaire: ${mandat.proprietaire}\nMandat: ${mandat.id}\nType: ${mandat.typePropriete} ${mandat.sousType}\nPrix: ${formatCurrency(mandat.prix, mandat.currency)}`
        : `Convert this exclusive mandate to property?\n\nOwner: ${mandat.proprietaire}\nMandat: ${mandat.id}\nType: ${mandat.typePropriete} ${mandat.sousType}\nPrice: ${formatCurrency(mandat.prix, mandat.currency)}`;

    if (confirm(confirmMessage)) {
      // Create property from mandat
      const newProperty = {
        id: `PROP-${Date.now()}`,
        mandatId: mandat.id,
        title: `${mandat.typePropriete} ${mandat.sousType} - ${mandat.localisation}`,
        price: mandat.prix,
        currency: mandat.currency,
        location: mandat.localisation,
        bedrooms: mandat.nombreChambres,
        bathrooms: Math.floor(mandat.nombreChambres / 2) || 1,
        area: mandat.metresCarres,
        type: mandat.typePropriete,
        status: language === "fr" ? "À Vendre" : "For Sale",
        image: mandat.propertyImage || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
        featured: true,
        documents: mandat.propertyImage ? [mandat.propertyImage] : [],
        ownerId: mandat.id,
        ownerName: mandat.proprietaire,
      };

      // Save to localStorage
      const existingProperties = JSON.parse(
        localStorage.getItem("crm-properties") || "[]",
      );
      existingProperties.push(newProperty);
      localStorage.setItem(
        "crm-properties",
        JSON.stringify(existingProperties),
      );

      // Trigger storage event
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "crm-properties",
          newValue: JSON.stringify(existingProperties),
          storageArea: localStorage,
        }),
      );

      toast({
        title: language === "fr" ? "Bien créé avec succès" : "Property created successfully",
        description:
          language === "fr"
            ? `Le mandat ${mandat.id} a été converti en bien immobilier`
            : `Mandate ${mandat.id} has been converted to property`,
      });
    }
  };

  return (
    <div className="w-full bg-background p-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            {language === "fr"
              ? "Gestion Requêtes & Mandats"
              : "Requests & Mandates Management"}
          </h1>
        </div>

        {/* Tabs for Requêtes and Mandats */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="requetes" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {language === "fr" ? "Requêtes" : "Requests"}
              </TabsTrigger>
              <TabsTrigger value="mandats" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                {language === "fr" ? "Mandats" : "Mandates"}
              </TabsTrigger>
            </TabsList>

            <div className="flex space-x-2">
              {activeTab === "requetes" && (
                <Dialog
                  open={isAddRequeteDialogOpen}
                  onOpenChange={setIsAddRequeteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      {language === "fr" ? "Nouvelle Requête" : "New Request"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {language === "fr" ? "Nouvelle Requête" : "New Request"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="client">
                          {language === "fr" ? "Client" : "Client"}
                        </Label>
                        <Input
                          id="client"
                          value={newRequete.client}
                          onChange={(e) =>
                            setNewRequete({
                              ...newRequete,
                              client: e.target.value,
                            })
                          }
                          placeholder={
                            language === "fr" ? "Nom du client" : "Client name"
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newRequete.email}
                          onChange={(e) =>
                            setNewRequete({
                              ...newRequete,
                              email: e.target.value,
                            })
                          }
                          placeholder="client@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          {language === "fr" ? "Téléphone" : "Phone"}
                        </Label>
                        <Input
                          id="phone"
                          value={newRequete.phone}
                          onChange={(e) =>
                            setNewRequete({
                              ...newRequete,
                              phone: e.target.value,
                            })
                          }
                          placeholder="+216 XX XXX XXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget">
                          {language === "fr" ? "Budget" : "Budget"}
                        </Label>
                        <Input
                          id="budget"
                          type="number"
                          value={newRequete.budget}
                          onChange={(e) =>
                            setNewRequete({
                              ...newRequete,
                              budget: Number(e.target.value),
                            })
                          }
                          placeholder="500000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="localisation">
                          {language === "fr" ? "Localisation" : "Location"}
                        </Label>
                        <Input
                          id="localisation"
                          value={newRequete.localisation}
                          onChange={(e) =>
                            setNewRequete({
                              ...newRequete,
                              localisation: e.target.value,
                            })
                          }
                          placeholder="Tunis, La Marsa"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="typePropriete">
                          {language === "fr"
                            ? "Type de propriété"
                            : "Property Type"}
                        </Label>
                        <Select
                          value={newRequete.typePropriete}
                          onValueChange={(value) =>
                            setNewRequete({
                              ...newRequete,
                              typePropriete: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                language === "fr"
                                  ? "Sélectionner type"
                                  : "Select type"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Villa">Villa</SelectItem>
                            <SelectItem value="Appartement">
                              Appartement
                            </SelectItem>
                            <SelectItem value="Maison">Maison</SelectItem>
                            <SelectItem value="Studio">Studio</SelectItem>
                            <SelectItem value="Commercial">
                              Commercial
                            </SelectItem>
                            <SelectItem value="Terrain">Terrain</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sousType">
                          {language === "fr" ? "Sous-type" : "Sub-type"}
                        </Label>
                        <Select
                          value={newRequete.sousType}
                          onValueChange={(value) =>
                            setNewRequete({ ...newRequete, sousType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="S+1, S+2..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Studio">Studio</SelectItem>
                            <SelectItem value="S+1">S+1</SelectItem>
                            <SelectItem value="S+2">S+2</SelectItem>
                            <SelectItem value="S+3">S+3</SelectItem>
                            <SelectItem value="S+4">S+4</SelectItem>
                            <SelectItem value="S+5">S+5</SelectItem>
                            <SelectItem value="S+6+">S+6+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nombreChambres">
                          {language === "fr"
                            ? "Nombre de chambres"
                            : "Number of rooms"}
                        </Label>
                        <Input
                          id="nombreChambres"
                          type="number"
                          value={newRequete.nombreChambres}
                          onChange={(e) =>
                            setNewRequete({
                              ...newRequete,
                              nombreChambres: Number(e.target.value),
                            })
                          }
                          placeholder="2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="metresCarres">
                          {language === "fr"
                            ? "Mètres carrés"
                            : "Square meters"}
                        </Label>
                        <Input
                          id="metresCarres"
                          type="number"
                          value={newRequete.metresCarres}
                          onChange={(e) =>
                            setNewRequete({
                              ...newRequete,
                              metresCarres: Number(e.target.value),
                            })
                          }
                          placeholder="120"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="typeFinancement">
                          {language === "fr"
                            ? "Type de financement"
                            : "Financing type"}
                        </Label>
                        <Select
                          value={newRequete.typeFinancement}
                          onValueChange={(value) =>
                            setNewRequete({
                              ...newRequete,
                              typeFinancement: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                language === "fr" ? "Sélectionner" : "Select"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Achat comptant">
                              Achat comptant
                            </SelectItem>
                            <SelectItem value="Achat 100% avec crédit">
                              Achat 100% avec crédit
                            </SelectItem>
                            <SelectItem value="Achat avec apport">
                              Achat avec apport
                            </SelectItem>
                            <SelectItem value="Location">Location</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="destination">
                          {language === "fr" ? "Destination" : "Purpose"}
                        </Label>
                        <Select
                          value={newRequete.destination}
                          onValueChange={(value) =>
                            setNewRequete({ ...newRequete, destination: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                language === "fr" ? "Sélectionner" : "Select"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Résidence principale">
                              Résidence principale
                            </SelectItem>
                            <SelectItem value="Résidence secondaire">
                              Résidence secondaire
                            </SelectItem>
                            <SelectItem value="Investissement">
                              Investissement
                            </SelectItem>
                            <SelectItem value="Location saisonnière">
                              Location saisonnière
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="classeEnergetique">
                          {language === "fr"
                            ? "Classe énergétique"
                            : "Energy class"}
                        </Label>
                        <Select
                          value={newRequete.classeEnergetique}
                          onValueChange={(value) =>
                            setNewRequete({
                              ...newRequete,
                              classeEnergetique: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="A, B, C..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                            <SelectItem value="D">D</SelectItem>
                            <SelectItem value="E">E</SelectItem>
                            <SelectItem value="F">F</SelectItem>
                            <SelectItem value="G">G</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3 grid grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="construction"
                            checked={newRequete.construction}
                            onCheckedChange={(checked) =>
                              setNewRequete({
                                ...newRequete,
                                construction: !!checked,
                              })
                            }
                          />
                          <Label htmlFor="construction">
                            {language === "fr"
                              ? "Construction"
                              : "Construction"}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="meuble"
                            checked={newRequete.meuble}
                            onCheckedChange={(checked) =>
                              setNewRequete({
                                ...newRequete,
                                meuble: !!checked,
                              })
                            }
                          />
                          <Label htmlFor="meuble">
                            {language === "fr" ? "Meublé" : "Furnished"}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="neuf"
                            checked={newRequete.neuf}
                            onCheckedChange={(checked) =>
                              setNewRequete({ ...newRequete, neuf: !!checked })
                            }
                          />
                          <Label htmlFor="neuf">
                            {language === "fr" ? "Neuf/Récent" : "New/Recent"}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="gratuit"
                            checked={newRequete.gratuit}
                            onCheckedChange={(checked) =>
                              setNewRequete({
                                ...newRequete,
                                gratuit: !!checked,
                              })
                            }
                          />
                          <Label htmlFor="gratuit">
                            {language === "fr" ? "Gratuit/Libre" : "Free"}
                          </Label>
                        </div>
                      </div>
                      <div className="col-span-3 space-y-2">
                        <Label htmlFor="besoinsExigences">
                          {language === "fr"
                            ? "Besoins/Exigences"
                            : "Needs/Requirements"}
                        </Label>
                        <Textarea
                          id="besoinsExigences"
                          value={newRequete.besoinsExigences}
                          onChange={(e) =>
                            setNewRequete({
                              ...newRequete,
                              besoinsExigences: e.target.value,
                            })
                          }
                          placeholder={
                            language === "fr"
                              ? "Détails des besoins et exigences du client..."
                              : "Client needs and requirements details..."
                          }
                        />
                      </div>
                      <div className="col-span-3 space-y-2">
                        <Label htmlFor="notes">
                          {language === "fr" ? "Notes" : "Notes"}
                        </Label>
                        <Textarea
                          id="notes"
                          value={newRequete.notes}
                          onChange={(e) =>
                            setNewRequete({
                              ...newRequete,
                              notes: e.target.value,
                            })
                          }
                          placeholder={
                            language === "fr"
                              ? "Notes additionnelles..."
                              : "Additional notes..."
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddRequeteDialogOpen(false)}
                      >
                        {language === "fr" ? "Annuler" : "Cancel"}
                      </Button>
                      <Button onClick={handleAddRequete}>
                        {language === "fr" ? "Ajouter" : "Add"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {activeTab === "mandats" && (
                <Dialog
                  open={isAddMandatDialogOpen}
                  onOpenChange={setIsAddMandatDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      {language === "fr" ? "Nouveau Mandat" : "New Mandate"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {language === "fr" ? "Nouveau Mandat" : "New Mandate"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="proprietaire">
                          {language === "fr" ? "Propriétaire" : "Owner"}
                        </Label>
                        <Input
                          id="proprietaire"
                          value={newMandat.proprietaire}
                          onChange={(e) =>
                            setNewMandat({
                              ...newMandat,
                              proprietaire: e.target.value,
                            })
                          }
                          placeholder={
                            language === "fr"
                              ? "Nom du propriétaire"
                              : "Owner name"
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newMandat.email}
                          onChange={(e) =>
                            setNewMandat({
                              ...newMandat,
                              email: e.target.value,
                            })
                          }
                          placeholder="proprietaire@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          {language === "fr" ? "Téléphone" : "Phone"}
                        </Label>
                        <Input
                          id="phone"
                          value={newMandat.phone}
                          onChange={(e) =>
                            setNewMandat({
                              ...newMandat,
                              phone: e.target.value,
                            })
                          }
                          placeholder="+216 XX XXX XXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prix">
                          {language === "fr" ? "Prix" : "Price"}
                        </Label>
                        <Input
                          id="prix"
                          type="number"
                          value={newMandat.prix}
                          onChange={(e) =>
                            setNewMandat({
                              ...newMandat,
                              prix: Number(e.target.value),
                            })
                          }
                          placeholder="850000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="localisation">
                          {language === "fr" ? "Localisation" : "Location"}
                        </Label>
                        <Input
                          id="localisation"
                          value={newMandat.localisation}
                          onChange={(e) =>
                            setNewMandat({
                              ...newMandat,
                              localisation: e.target.value,
                            })
                          }
                          placeholder="Sidi Bou Said, Tunis"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="typePropriete">
                          {language === "fr"
                            ? "Type de propriété"
                            : "Property Type"}
                        </Label>
                        <Select
                          value={newMandat.typePropriete}
                          onValueChange={(value) =>
                            setNewMandat({ ...newMandat, typePropriete: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                language === "fr"
                                  ? "Sélectionner type"
                                  : "Select type"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Villa">Villa</SelectItem>
                            <SelectItem value="Appartement">
                              Appartement
                            </SelectItem>
                            <SelectItem value="Maison">Maison</SelectItem>
                            <SelectItem value="Studio">Studio</SelectItem>
                            <SelectItem value="Commercial">
                              Commercial
                            </SelectItem>
                            <SelectItem value="Terrain">Terrain</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">
                          {language === "fr"
                            ? "Type de mandat"
                            : "Mandate type"}
                        </Label>
                        <Select
                          value={newMandat.status}
                          onValueChange={(value) =>
                            setNewMandat({ ...newMandat, status: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                language === "fr" ? "Sélectionner" : "Select"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mandat simple">
                              Mandat simple
                            </SelectItem>
                            <SelectItem value="Mandat exclusif">
                              Mandat exclusif
                            </SelectItem>
                            <SelectItem value="Mandat semi-exclusif">
                              Mandat semi-exclusif
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="notes">
                          {language === "fr" ? "Notes" : "Notes"}
                        </Label>
                        <Textarea
                          id="notes"
                          value={newMandat.notes}
                          onChange={(e) =>
                            setNewMandat({
                              ...newMandat,
                              notes: e.target.value,
                            })
                          }
                          placeholder={
                            language === "fr"
                              ? "Description du bien, particularités..."
                              : "Property description, particularities..."
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddMandatDialogOpen(false)}
                      >
                        {language === "fr" ? "Annuler" : "Cancel"}
                      </Button>
                      <Button onClick={handleAddMandat}>
                        {language === "fr" ? "Ajouter" : "Add"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "fr" ? "Rechercher..." : "Search..."}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue
                  placeholder={
                    language === "fr"
                      ? "Filtrer par statut"
                      : "Filter by status"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {language === "fr" ? "Tous" : "All"}
                </SelectItem>
                {activeTab === "requetes" && (
                  <>
                    <SelectItem value="Requête chaude">
                      Requête chaude
                    </SelectItem>
                    <SelectItem value="En négociation">
                      En négociation
                    </SelectItem>
                    <SelectItem value="Requête froide">
                      Requête froide
                    </SelectItem>
                    <SelectItem value="Convertie">Convertie</SelectItem>
                  </>
                )}
                {activeTab === "mandats" && (
                  <>
                    <SelectItem value="Mandat simple">Mandat simple</SelectItem>
                    <SelectItem value="Mandat exclusif">
                      Mandat exclusif
                    </SelectItem>
                    <SelectItem value="Mandat semi-exclusif">
                      Mandat semi-exclusif
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Requêtes Tab */}
          <TabsContent value="requetes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requetesWithFunnel.map((requete) => (
                <Card key={requete.id} className="overflow-hidden bg-white hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={requete.avatarUrl}
                          alt={requete.client}
                        />
                        <AvatarFallback>
                          {requete.client.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {requete.client}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge
                            className={`${getFunnelStageColor(requete.funnelStage)} text-white text-xs`}
                          >
                            {getFunnelStageLabel(requete.funnelStage)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {requete.interactions.length} {language === "fr" ? "interactions" : "interactions"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{requete.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{requete.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{requete.localisation}</span>
                    </div>
                    
                    <div className="pt-2 space-y-1 border-t">
                      <div className="text-sm font-medium">
                        {language === "fr" ? "Budget:" : "Budget:"}{" "}
                        {formatCurrency(requete.budget, requete.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {requete.typePropriete} {requete.sousType} • {requete.metresCarres}m²
                      </div>
                    </div>

                    {/* Last Interaction */}
                    {requete.interactions.length > 0 && (
                      <div className="bg-blue-50 p-2 rounded text-xs border border-blue-200">
                        <div className="flex items-center space-x-1 text-blue-900 font-semibold mb-1">
                          <History className="h-3 w-3" />
                          <span>{language === "fr" ? "Dernière interaction:" : "Last interaction:"}</span>
                        </div>
                        <div className="text-blue-800">
                          {requete.interactions[requete.interactions.length - 1].notes.substring(0, 60)}...
                        </div>
                        <div className="text-blue-600 mt-1">
                          {requete.interactions[requete.interactions.length - 1].date} • {requete.interactions[requete.interactions.length - 1].time}
                        </div>
                      </div>
                    )}

                    {/* Next Follow-up */}
                    {requete.nextFollowUp && (
                      <div className="bg-orange-50 p-2 rounded text-xs border border-orange-200">
                        <div className="flex items-center space-x-1 text-orange-900 font-semibold">
                          <Clock className="h-3 w-3" />
                          <span>{language === "fr" ? "Prochain suivi:" : "Next follow-up:"} {requete.nextFollowUp}</span>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions - ENHANCED WITH CALENDAR */}
                    <div className="flex justify-between pt-2 border-t">
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProspect(requete);
                            setInteractionType('call');
                            setIsInteractionDialogOpen(true);
                          }}
                          title={language === "fr" ? "Appel" : "Call"}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProspect(requete);
                            setInteractionType('email');
                            setIsInteractionDialogOpen(true);
                          }}
                          title="Email"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProspect(requete);
                            setInteractionType('sms');
                            setIsInteractionDialogOpen(true);
                          }}
                          title="SMS"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProspect(requete);
                            setInteractionType('whatsapp');
                            setIsInteractionDialogOpen(true);
                          }}
                          title="WhatsApp"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCreateAppointmentFromProspect(requete)}
                          title={language === "fr" ? "Planifier RDV" : "Schedule"}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProspect(requete);
                            // Show full history dialog
                          }}
                          title={language === "fr" ? "Historique" : "History"}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Funnel Stage Selector */}
                    <div className="pt-2 border-t">
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        {language === "fr" ? "Étape du funnel:" : "Funnel stage:"}
                      </Label>
                      <Select
                        value={requete.funnelStage}
                        onValueChange={(value) => updateFunnelStage(requete.id, value as any)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="contacted">{language === "fr" ? "Contacté" : "Contacted"}</SelectItem>
                          <SelectItem value="qualified">{language === "fr" ? "Qualifié" : "Qualified"}</SelectItem>
                          <SelectItem value="negotiation">{language === "fr" ? "Négociation" : "Negotiation"}</SelectItem>
                          <SelectItem value="closing">Closing</SelectItem>
                          <SelectItem value="won">{language === "fr" ? "Gagné" : "Won"}</SelectItem>
                          <SelectItem value="lost">{language === "fr" ? "Perdu" : "Lost"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Mandats Tab */}
          <TabsContent value="mandats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMandats.map((mandat) => (
                <Card key={mandat.id} className="overflow-hidden bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={mandat.avatarUrl}
                          alt={mandat.proprietaire}
                        />
                        <AvatarFallback>
                          {mandat.proprietaire.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {mandat.proprietaire}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={`${getStatusColor(mandat.status)} text-white`}
                          >
                            {mandat.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{mandat.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{mandat.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{mandat.localisation}</span>
                    </div>
                    <div className="pt-2 space-y-1">
                      <div className="text-sm font-medium">
                        {language === "fr" ? "Prix:" : "Price:"}{" "}
                        {formatCurrency(mandat.prix, mandat.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language === "fr" ? "Bien:" : "Property:"}{" "}
                        {mandat.typePropriete} {mandat.sousType}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {mandat.metresCarres}m² • {mandat.nombreChambres}{" "}
                        {language === "fr" ? "ch." : "beds"}
                      </div>
                      {mandat.propertyId && (
                        <div className="text-xs text-blue-600 font-medium">
                          ID: {mandat.propertyId}
                        </div>
                      )}
                    </div>
                    {mandat.propertyImage && (
                      <div className="mt-2">
                        <img
                          src={mandat.propertyImage}
                          alt={mandat.propertyTitle || "Property"}
                          className="w-full h-32 object-cover rounded-md"
                        />
                        {mandat.propertyTitle && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {mandat.propertyTitle}
                          </p>
                        )}
                      </div>
                    )}
                    {mandat.notes && (
                      <div className="text-sm text-muted-foreground border-t pt-2">
                        {mandat.notes}
                      </div>
                    )}
                    <div className="flex justify-between pt-2">
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const choice = confirm(
                              language === "fr"
                                ? "Choisissez: OK pour appel téléphonique, Annuler pour WhatsApp"
                                : "Choose: OK for phone call, Cancel for WhatsApp",
                            );
                            if (choice) {
                              window.open(`tel:${mandat.phone}`);
                            } else {
                              window.open(
                                `https://wa.me/${mandat.phone.replace(/[^0-9]/g, "")}`,
                              );
                            }
                          }}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            window.open(
                              `mailto:${mandat.email}?subject=${encodeURIComponent(language === "fr" ? "Concernant votre mandat immobilier" : "Regarding your property mandate")}`,
                            );
                          }}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedContact({
                              name: mandat.proprietaire,
                              type: "mandat",
                            });
                            setIsAppointmentDialogOpen(true);
                          }}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {mandat.status === "Mandat exclusif" && (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            onClick={() => handleConvertMandatToProperty(mandat)}
                          >
                            <Building2 className="h-4 w-4 mr-2" />
                            {language === "fr" ? "Ajouter au Biens" : "Add to Properties"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Interaction Dialog */}
        <Dialog
          open={isInteractionDialogOpen}
          onOpenChange={setIsInteractionDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {getInteractionIcon(interactionType)}
                <span>
                  {language === "fr" ? "Nouvelle Interaction" : "New Interaction"} - {selectedProspect?.client}
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="interaction-type">
                  {language === "fr" ? "Type d'interaction" : "Interaction Type"}
                </Label>
                <Select
                  value={interactionType}
                  onValueChange={(value) => setInteractionType(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{language === "fr" ? "Appel téléphonique" : "Phone Call"}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="email">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="sms">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>SMS</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <div className="flex items-center space-x-2">
                        <Send className="h-4 w-4" />
                        <span>WhatsApp</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interaction-notes">
                  {language === "fr" ? "Notes de la conversation" : "Conversation Notes"}
                </Label>
                <Textarea
                  id="interaction-notes"
                  value={interactionNotes}
                  onChange={(e) => setInteractionNotes(e.target.value)}
                  placeholder={
                    language === "fr"
                      ? "Qu'avez-vous discuté? Quels sont les points importants?"
                      : "What did you discuss? What are the key points?"
                  }
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interaction-outcome">
                  {language === "fr" ? "Résultat de l'interaction" : "Interaction Outcome"}
                </Label>
                <Input
                  id="interaction-outcome"
                  value={interactionOutcome}
                  onChange={(e) => setInteractionOutcome(e.target.value)}
                  placeholder={
                    language === "fr"
                      ? "Ex: Positif, En attente, Besoin de relance..."
                      : "Ex: Positive, Pending, Needs follow-up..."
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="next-action">
                  {language === "fr" ? "Prochaine action à faire" : "Next Action"}
                </Label>
                <Textarea
                  id="next-action"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder={
                    language === "fr"
                      ? "Que devez-vous faire ensuite?"
                      : "What should you do next?"
                  }
                  rows={2}
                />
              </div>

              {/* Interaction History */}
              {selectedProspect && selectedProspect.interactions.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center space-x-2">
                    <History className="h-4 w-4" />
                    <span>{language === "fr" ? "Historique des interactions" : "Interaction History"}</span>
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedProspect.interactions.slice().reverse().map((interaction) => (
                      <div key={interaction.id} className="bg-gray-50 p-3 rounded text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            {getInteractionIcon(interaction.type)}
                            <span className="font-semibold capitalize">{interaction.type}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {interaction.date} • {interaction.time}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-1">{interaction.notes}</p>
                        <div className="flex items-center space-x-2 text-xs">
                          <Badge variant="outline">{interaction.outcome}</Badge>
                          {interaction.nextAction && (
                            <span className="text-muted-foreground">
                              <ArrowRight className="h-3 w-3 inline mr-1" />
                              {interaction.nextAction}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsInteractionDialogOpen(false);
                  setInteractionNotes("");
                  setInteractionOutcome("");
                  setNextAction("");
                }}
              >
                {language === "fr" ? "Annuler" : "Cancel"}
              </Button>
              <Button
                onClick={addInteraction}
                disabled={!interactionNotes.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {language === "fr" ? "Enregistrer" : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ENHANCED Appointment Dialog with Calendar Integration */}
        <Dialog
          open={isAppointmentDialogOpen}
          onOpenChange={setIsAppointmentDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span>
                  {language === "fr"
                    ? "Planifier un rendez-vous"
                    : "Schedule Appointment"}
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <div className="flex items-center space-x-2 text-blue-900">
                  <User className="h-4 w-4" />
                  <span className="font-semibold">{appointmentData.clientName}</span>
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  {appointmentData.clientEmail} • {appointmentData.clientPhone}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment-date">
                  {language === "fr" ? "Date" : "Date"}
                </Label>
                <Input
                  id="appointment-date"
                  type="date"
                  value={appointmentData.date}
                  onChange={(e) =>
                    setAppointmentData({
                      ...appointmentData,
                      date: e.target.value,
                    })
                  }
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointment-time">
                  {language === "fr" ? "Heure" : "Time"}
                </Label>
                <Input
                  id="appointment-time"
                  type="time"
                  value={appointmentData.time}
                  onChange={(e) =>
                    setAppointmentData({
                      ...appointmentData,
                      time: e.target.value,
                    })
                  }
                  step="900"
                  min="06:00"
                  max="22:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointment-notes">
                  {language === "fr" ? "Notes" : "Notes"}
                </Label>
                <Textarea
                  id="appointment-notes"
                  value={appointmentData.notes}
                  onChange={(e) =>
                    setAppointmentData({
                      ...appointmentData,
                      notes: e.target.value,
                    })
                  }
                  placeholder={
                    language === "fr"
                      ? "Objet du rendez-vous..."
                      : "Appointment purpose..."
                  }
                  rows={3}
                />
              </div>

              <div className="bg-green-50 p-3 rounded border border-green-200">
                <div className="flex items-center space-x-2 text-green-900 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {language === "fr"
                      ? "Le rendez-vous sera automatiquement ajouté au calendrier"
                      : "Appointment will be automatically added to calendar"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAppointmentDialogOpen(false);
                  setAppointmentData({
                    date: "",
                    time: "",
                    clientName: "",
                    clientEmail: "",
                    clientPhone: "",
                    notes: "",
                    type: "viewing",
                  });
                }}
              >
                {language === "fr" ? "Annuler" : "Cancel"}
              </Button>
              <Button
                onClick={handleSaveAppointment}
                disabled={!appointmentData.date || !appointmentData.time}
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {language === "fr" ? "Créer Rendez-vous" : "Create Appointment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}