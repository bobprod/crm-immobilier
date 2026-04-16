import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import propertiesAPI, { Property, CreatePropertyData } from '@/shared/utils/properties-api';
import apiClient from '@/shared/utils/backend-api';
import { PropertyFilters } from './PropertyFilters';
import { PropertyBulkActions } from './PropertyBulkActions';
import { PropertyFormModal } from './PropertyFormModal';
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';
import {
  Plus,
  Eye,
  Edit,
  Trash,
  LayoutGrid,
  List,
  Download,
  RefreshCw,
  Home,
  CheckCircle2,
  DollarSign,
  Building2,
  MapPin,
  Bed,
  Bath,
  Map,
  Star,
  Zap,
  Flame,
  Printer,
  ChevronDown,
  SlidersHorizontal,
  Search,
  X,
} from 'lucide-react';
import { useToast } from '@/shared/components/ui/use-toast';
import dynamic from 'next/dynamic';

const PropertyMap = dynamic(() => import('./PropertyMap').then((mod) => mod.PropertyMap), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <MapPin className="h-8 w-8 text-gray-300" />
    </div>
  ),
});

// ─── Tecnocloud-style view presets ───────────────────────────────────────────
const VIEW_PRESETS = [
  { id: 'recent', label: 'Biens récents', filters: {} },
  { id: 'residential', label: 'Biens résidentiels', filters: { type: 'apartment' } },
  { id: 'nouvelles', label: 'Potentielle Nouvelle', filters: { status: 'draft' } },
  { id: 'active', label: 'Nouvelles actives', filters: { status: 'available' } },
  { id: 'mandates_open', label: 'Mandats ouverts', filters: { status: 'available' } },
  { id: 'residences', label: 'Résidences', filters: { type: 'villa' } },
  { id: 'blocs', label: 'Blocs', filters: { type: 'commercial' } },
  { id: 'closed', label: 'Nouvelles fermées', filters: { status: 'sold' } },
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface PropertyListProps {
  initialLoading?: boolean;
  initialError?: string | null;
  initialProperties?: Property[];
}

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Appartement',
  house: 'Maison',
  villa: 'Villa',
  studio: 'Studio',
  land: 'Terrain',
  commercial: 'Commercial',
  office: 'Bureau',
  garage: 'Garage',
  other: 'Autre',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  reserved: 'Réservé',
  sold: 'Vendu',
  rented: 'Loué',
  pending: 'En attente',
  draft: 'Brouillon',
  archived: 'Archivé',
};

const CATEGORY_LABELS: Record<string, string> = {
  sale: 'Vente',
  rent: 'Location',
  vacation_rental: 'Location saisonnière',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

export function PropertyList({
  initialLoading,
  initialError,
  initialProperties,
}: PropertyListProps) {
  const [properties, setProperties] = useState<Property[]>(initialProperties || []);
  const [loading, setLoading] = useState<boolean>(initialLoading ?? false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [stats, setStats] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showMapPanel, setShowMapPanel] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(VIEW_PRESETS[0]);
  const [presetOpen, setPresetOpen] = useState(false);
  const [letterFilter, setLetterFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const presetRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  });

  const fetchProperties = async (currentFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await propertiesAPI.list(currentFilters);
      const data = Array.isArray(response) ? response : (response as any).properties || [];
      setProperties(data);
    } catch (err) {
      const errorMessage = 'Impossible de charger les propriétés';
      setError(errorMessage);
      toast({ title: 'Erreur', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/properties/stats');
      setStats(res.data);
    } catch {}
  };

  useEffect(() => {
    if (!initialProperties && !initialLoading) {
      fetchProperties();
    }
    fetchStats();
  }, [initialProperties, initialLoading]);

  // Close preset dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (presetRef.current && !presetRef.current.contains(e.target as Node)) {
        setPresetOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Filtered view (letter + search applied client-side)
  const displayedProperties = properties.filter((p) => {
    const name = (p.title || '').toUpperCase();
    if (letterFilter && letterFilter !== 'TOUS' && !name.startsWith(letterFilter)) return false;
    if (searchQuery && !name.includes(searchQuery.toUpperCase())) return false;
    return true;
  });

  const handleRefresh = () => {
    fetchProperties();
    fetchStats();
  };

  const handlePresetSelect = (preset: (typeof VIEW_PRESETS)[0]) => {
    setSelectedPreset(preset);
    setPresetOpen(false);
    setLetterFilter(null);
    setSearchQuery('');
    const merged = { ...preset.filters };
    setFilters(merged);
    fetchProperties(merged);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    fetchProperties(newFilters);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? properties.map((p) => p.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((pid) => pid !== id)));
  };

  const handleBulkAction = async (action: string, value?: any) => {
    try {
      if (action === 'delete') {
        setConfirmDialog({
          open: true,
          title: 'Supprimer les propriétés',
          description: `Êtes-vous sûr de vouloir supprimer ${selectedIds.length} propriété(s) ? Cette action est irréversible.`,
          onConfirm: async () => {
            try {
              await propertiesAPI.bulkDelete(selectedIds);
              await fetchProperties();
              setSelectedIds([]);
              toast({
                title: 'Succès',
                description: `${selectedIds.length} propriété(s) supprimée(s)`,
              });
            } catch (err) {
              toast({
                title: 'Erreur',
                description: 'Impossible de supprimer les propriétés',
                variant: 'destructive',
              });
            }
          },
        });
        return;
      } else if (action === 'priority') {
        await propertiesAPI.bulkUpdatePriority(selectedIds, value);
      } else if (action === 'status') {
        await propertiesAPI.bulkUpdateStatus(selectedIds, value);
      }
      await fetchProperties();
      setSelectedIds([]);
      toast({ title: 'Succès', description: 'Propriétés mises à jour avec succès' });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les propriétés',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await apiClient.get('/properties/export', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `proprietes_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Erreur', description: "Impossible d'exporter", variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-red-100 text-red-800';
      case 'rented':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProperty(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (property: Property) => {
    setEditingProperty(property);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProperty(null);
  };

  const handleSubmitProperty = async (data: CreatePropertyData, pendingImages?: File[]) => {
    try {
      if (editingProperty) {
        await propertiesAPI.update(editingProperty.id, data);
        if (pendingImages && pendingImages.length > 0) {
          await propertiesAPI.uploadPropertyImages(editingProperty.id, pendingImages);
        }
        toast({ title: 'Succès', description: 'Propriété mise à jour avec succès' });
      } else {
        const created = await propertiesAPI.create(data);
        if (pendingImages && pendingImages.length > 0 && created?.id) {
          await propertiesAPI.uploadPropertyImages(created.id, pendingImages);
        }
        toast({ title: 'Succès', description: 'Propriété créée avec succès' });
      }
      handleCloseModal();
      await fetchProperties();
      fetchStats();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: editingProperty
          ? 'Impossible de mettre à jour la propriété'
          : 'Impossible de créer la propriété',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteProperty = useCallback(
    (property: Property) => {
      setConfirmDialog({
        open: true,
        title: 'Supprimer la propriété',
        description: `Êtes-vous sûr de vouloir supprimer "${property.title}" ? Cette action est irréversible.`,
        onConfirm: async () => {
          try {
            await propertiesAPI.delete(property.id);
            await fetchProperties();
            fetchStats();
            toast({ title: 'Succès', description: 'Propriété supprimée avec succès' });
          } catch (err) {
            toast({
              title: 'Erreur',
              description: 'Impossible de supprimer la propriété',
              variant: 'destructive',
            });
          }
        },
      });
    },
    [toast]
  );

  if (loading && properties.length === 0) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="loading-state">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-gray-600">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500" data-testid="error-state">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Tecnocloud-style toolbar ───────────────────────────────── */}
      <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2 shadow-sm flex-wrap">
        {/* Preset dropdown */}
        <div className="relative" ref={presetRef}>
          <button
            onClick={() => setPresetOpen((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-50 border rounded px-3 py-1.5 min-w-[190px]"
          >
            <span className="truncate">{selectedPreset.label}</span>
            <ChevronDown className="h-3.5 w-3.5 ml-auto flex-shrink-0 text-gray-400" />
          </button>
          {presetOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border rounded-lg shadow-lg w-64 py-1">
              {VIEW_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                    selectedPreset.id === p.id ? 'text-primary font-medium' : 'text-gray-700'
                  }`}
                >
                  {selectedPreset.id === p.id && <span className="text-primary text-xs">✓</span>}
                  <span className={selectedPreset.id === p.id ? '' : 'pl-4'}>{p.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-xs text-gray-500 whitespace-nowrap">
          à partir de 1 à {Math.min(displayedProperties.length, 50)} de {displayedProperties.length}
        </span>

        <div className="flex-1" />

        <div className="flex items-center gap-1 flex-wrap">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Imprimer">
            <Printer className="h-4 w-4 text-gray-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Exporter CSV"
            onClick={handleExportCSV}
            disabled={exporting}
          >
            <Download className="h-4 w-4 text-gray-500" />
          </Button>

          <Button
            variant={showMapPanel ? 'default' : 'outline'}
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setShowMapPanel((v) => !v)}
          >
            <Map className="h-3.5 w-3.5" />
            Carte des biens
            {showMapPanel && <span className="font-bold ml-1">({properties.length})</span>}
          </Button>

          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cherchez dans cette liste"
              className="pl-7 pr-6 py-1 text-xs border rounded w-44 outline-none focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex rounded border overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 ${viewMode === 'table' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              title="Vue tableau"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              title="Vue grille"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowFiltersPanel((v) => !v)}
            title="Filtres"
          >
            <SlidersHorizontal
              className={`h-4 w-4 ${showFiltersPanel ? 'text-primary' : 'text-gray-500'}`}
            />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </Button>
          <Button onClick={handleOpenCreateModal} size="sm" data-testid="create-property-button">
            <Plus className="h-4 w-4 mr-1" />
            Nouveau bien
          </Button>
        </div>
      </div>

      {/* ── Alphabet filter ──────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 flex-wrap">
        {ALPHABET.map((letter) => (
          <button
            key={letter}
            onClick={() => setLetterFilter(letterFilter === letter ? null : letter)}
            className={`w-6 h-6 text-xs rounded font-medium transition-colors ${
              letterFilter === letter ? 'bg-primary text-white' : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            {letter}
          </button>
        ))}
        <span className="text-gray-300 mx-1">-</span>
        <button
          onClick={() => setLetterFilter(null)}
          className={`px-2 h-6 text-xs rounded font-medium transition-colors ${
            !letterFilter ? 'bg-primary text-white' : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          TOUS
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Disponibles</p>
                <p className="text-xl font-bold text-green-600">{stats.byStatus?.available || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Home className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Vendus/Loués</p>
                <p className="text-xl font-bold text-red-600">
                  {(stats.byStatus?.sold || 0) + (stats.byStatus?.rented || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Prix moyen</p>
                <p className="text-base font-bold text-purple-600">
                  {new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(
                    stats.averagePrice || 0
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showFiltersPanel && <PropertyFilters onFilterChange={handleFilterChange} />}
      <PropertyBulkActions selectedCount={selectedIds.length} onAction={handleBulkAction} />

      <PropertyFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitProperty}
        property={editingProperty}
      />

      {/* ── Split view container ────────────────────────────────── */}
      <div className={`flex gap-4 ${showMapPanel ? 'items-start' : ''}`}>
        <div className="flex-1 min-w-0">
          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <Card>
              <CardContent className="p-0">
                <Table data-testid="properties-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={
                            properties.length > 0 && selectedIds.length === properties.length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Surface</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody data-testid="properties-tbody">
                    {displayedProperties.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                          <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                          Aucune propriété trouvée
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedProperties.map((property) => (
                        <TableRow key={property.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(property.id)}
                              onCheckedChange={(checked) =>
                                handleSelectOne(property.id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {property.images && (property.images as string[]).length > 0 ? (
                                <img
                                  src={
                                    (property.images as string[])[0].startsWith('http')
                                      ? (property.images as string[])[0]
                                      : `http://localhost:3001${(property.images as string[])[0]}`
                                  }
                                  className="h-9 w-12 object-cover rounded"
                                  alt=""
                                  onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                              ) : (
                                <div className="h-9 w-12 bg-gray-100 rounded flex items-center justify-center">
                                  <Home className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900 truncate max-w-[180px] flex items-center gap-1">
                                  {property.isFeatured && (
                                    <Star className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
                                  )}
                                  {property.priority === 'urgent' && (
                                    <Zap className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                                  )}
                                  {property.title}
                                </div>
                                {property.city && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {property.city}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <Badge variant="outline" className="text-xs">
                                {TYPE_LABELS[property.type] || property.type}
                              </Badge>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {CATEGORY_LABELS[property.category] || property.category}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {new Intl.NumberFormat('fr-TN', {
                              style: 'currency',
                              currency: 'TND',
                            }).format(property.price)}
                          </TableCell>
                          <TableCell>{property.area ? `${property.area} m²` : '—'}</TableCell>
                          <TableCell>
                            <Badge
                              className={getPriorityColor(property.priority)}
                              variant="secondary"
                            >
                              {PRIORITY_LABELS[property.priority || 'medium'] || property.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(property.status)} variant="secondary">
                              {STATUS_LABELS[property.status] || property.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => router.push(`/properties/${property.id}`)}
                                data-testid={`view-property-${property.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenEditModal(property)}
                                data-testid={`edit-property-${property.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteProperty(property)}
                                data-testid={`delete-property-${property.id}`}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* GRID VIEW */}
          {viewMode === 'grid' && (
            <div>
              {displayedProperties.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucune propriété trouvée</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedProperties.map((property) => (
                    <Card
                      key={property.id}
                      className="overflow-hidden hover:shadow-md transition-shadow group"
                    >
                      {/* Image */}
                      <div className="relative h-44 bg-gray-100">
                        {property.images && (property.images as string[]).length > 0 ? (
                          <img
                            src={
                              (property.images as string[])[0].startsWith('http')
                                ? (property.images as string[])[0]
                                : `http://localhost:3001${(property.images as string[])[0]}`
                            }
                            className="w-full h-full object-cover"
                            alt={property.title}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '';
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="h-10 w-10 text-gray-300" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                          <Badge className={getStatusColor(property.status)} variant="secondary">
                            {STATUS_LABELS[property.status] || property.status}
                          </Badge>
                          {property.isFeatured && (
                            <Badge className="bg-purple-600 text-white" variant="secondary">
                              <Star className="h-3 w-3 mr-0.5" /> Exclusif
                            </Badge>
                          )}
                          {property.priority === 'urgent' && (
                            <Badge
                              className="bg-red-600 text-white animate-pulse"
                              variant="secondary"
                            >
                              <Zap className="h-3 w-3 mr-0.5" /> Urgent
                            </Badge>
                          )}
                          {property.priority === 'high' && (
                            <Badge className="bg-orange-500 text-white" variant="secondary">
                              <Flame className="h-3 w-3 mr-0.5" /> Prioritaire
                            </Badge>
                          )}
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="bg-white text-xs">
                            {CATEGORY_LABELS[property.category] || property.category}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <div className="mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">{property.title}</h3>
                          {property.city && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {property.city}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-bold text-primary">
                            {new Intl.NumberFormat('fr-TN', {
                              style: 'currency',
                              currency: 'TND',
                              maximumFractionDigits: 0,
                            }).format(property.price)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {TYPE_LABELS[property.type] || property.type}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          {property.area && (
                            <span className="flex items-center gap-1">
                              <Home className="h-3.5 w-3.5" />
                              {property.area} m²
                            </span>
                          )}
                          {property.bedrooms ? (
                            <span className="flex items-center gap-1">
                              <Bed className="h-3.5 w-3.5" />
                              {property.bedrooms} ch
                            </span>
                          ) : null}
                          {property.bathrooms ? (
                            <span className="flex items-center gap-1">
                              <Bath className="h-3.5 w-3.5" />
                              {property.bathrooms} sdb
                            </span>
                          ) : null}
                        </div>

                        <div className="flex justify-between items-center border-t pt-3">
                          <Badge
                            className={getPriorityColor(property.priority)}
                            variant="secondary"
                          >
                            {PRIORITY_LABELS[property.priority || 'medium']}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => router.push(`/properties/${property.id}`)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleOpenEditModal(property)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:bg-red-50"
                              onClick={() => handleDeleteProperty(property)}
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Confirmation Dialog */}
          <ConfirmDialog
            open={confirmDialog.open}
            onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
            onConfirm={confirmDialog.onConfirm}
            title={confirmDialog.title}
            description={confirmDialog.description}
            confirmText="Supprimer"
            cancelText="Annuler"
            variant="destructive"
          />
        </div>
        {/* end main content */}

        {/* ── Map side panel ──────────────────────────────────────── */}
        {showMapPanel && (
          <div className="w-[420px] flex-shrink-0 sticky top-4 h-[600px] rounded-xl overflow-hidden border shadow-md">
            <div className="flex items-center justify-between px-3 py-2 bg-white border-b">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Map className="h-4 w-4 text-primary" />
                Carte des biens
                <Badge variant="secondary" className="ml-1 text-xs">
                  {properties.length}
                </Badge>
              </span>
              <button
                onClick={() => setShowMapPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <PropertyMap
              properties={properties}
              onPropertyClick={(p) => router.push(`/properties/${p.id}`)}
              height="calc(100% - 40px)"
            />
          </div>
        )}
      </div>
      {/* end split view container */}
    </div>
  );
}
