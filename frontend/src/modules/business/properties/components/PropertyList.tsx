import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { propertiesAPI, Property, CreatePropertyDTO } from '@/shared/utils/properties-api';
import { PropertyFilters } from './PropertyFilters';
import { PropertyBulkActions } from './PropertyBulkActions';
import { PropertyFormModal } from './PropertyFormModal';
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';
import { Plus, Eye, Edit, Trash } from 'lucide-react';

interface PropertyListProps {
    initialLoading?: boolean;
    initialError?: string | null;
    initialProperties?: Property[];
}

export function PropertyList({ initialLoading, initialError, initialProperties }: PropertyListProps) {
    const [properties, setProperties] = useState<Property[]>(initialProperties || []);
    const [loading, setLoading] = useState<boolean>(initialLoading ?? false);
    const [error, setError] = useState<string | null>(initialError ?? null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filters, setFilters] = useState<any>({});
    const router = useRouter();

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
        onConfirm: async () => { }
    });

    const fetchProperties = async (currentFilters = filters) => {
        setLoading(true);
        setError(null);
        try {
            const response = await propertiesAPI.list(currentFilters);
            // Handle both array response and { properties: [], total: 0 } response format
            const data = Array.isArray(response) ? response : (response as any).properties || [];
            setProperties(data);
        } catch (err) {
            setError('Failed to fetch properties');
            console.error('Error fetching properties:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!initialProperties && !initialLoading) {
            fetchProperties();
        }
    }, [initialProperties, initialLoading]);

    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters);
        fetchProperties(newFilters);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(properties.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(pid => pid !== id));
        }
    };

    const handleBulkAction = async (action: string, value?: any) => {
        try {
            if (action === 'delete') {
                // Show beautiful confirmation dialog
                setConfirmDialog({
                    open: true,
                    title: 'Supprimer les propriétés',
                    description: `Êtes-vous sûr de vouloir supprimer ${selectedIds.length} propriété(s) ? Cette action est irréversible.`,
                    onConfirm: async () => {
                        try {
                            await propertiesAPI.bulkDelete(selectedIds);
                            await fetchProperties();
                            setSelectedIds([]);
                        } catch (err) {
                            console.error('Delete failed:', err);
                        }
                    }
                });
                return;
            } else if (action === 'priority') {
                await propertiesAPI.bulkUpdatePriority(selectedIds, value);
            } else if (action === 'status') {
                await propertiesAPI.bulkUpdateStatus(selectedIds, value);
            }

            // Refresh list and clear selection
            await fetchProperties();
            setSelectedIds([]);
        } catch (err) {
            console.error('Bulk action failed:', err);
        }
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-blue-100 text-blue-800';
            case 'low': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-800';
            case 'reserved': return 'bg-yellow-100 text-yellow-800';
            case 'sold': return 'bg-red-100 text-red-800';
            case 'rented': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Modal handlers
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

    const handleSubmitProperty = async (data: CreatePropertyDTO) => {
        try {
            if (editingProperty) {
                // Update existing property
                await propertiesAPI.update(editingProperty.id, data);
            } else {
                // Create new property
                await propertiesAPI.create(data);
            }
            // Close the modal
            handleCloseModal();
            // Refresh the list
            await fetchProperties();
        } catch (error) {
            console.error('Error submitting property:', error);
            // Don't close modal on error so user can fix issues
            throw error;
        }
    };

    const handleDeleteProperty = useCallback((property: Property) => {
        setConfirmDialog({
            open: true,
            title: 'Supprimer la propriété',
            description: `Êtes-vous sûr de vouloir supprimer "${property.title}" ? Cette action est irréversible.`,
            onConfirm: async () => {
                try {
                    await propertiesAPI.delete(property.id);
                    await fetchProperties();
                } catch (err) {
                    console.error('Delete failed:', err);
                }
            }
        });
    }, []);

    if (loading && properties.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8 text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Propriétés</h2>
                <Button onClick={handleOpenCreateModal} data-testid="create-property-button">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Propriété
                </Button>
            </div>

            <PropertyFilters onFilterChange={handleFilterChange} />

            <PropertyBulkActions
                selectedCount={selectedIds.length}
                onAction={handleBulkAction}
            />

            {/* Property Form Modal */}
            <PropertyFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmitProperty}
                property={editingProperty}
            />

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={properties.length > 0 && selectedIds.length === properties.length}
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
                        <TableBody>
                            {properties.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                        Aucune propriété trouvée
                                    </TableCell>
                                </TableRow>
                            ) : (
                                properties.map((property) => (
                                    <TableRow key={property.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.includes(property.id)}
                                                onCheckedChange={(checked) => handleSelectOne(property.id, checked as boolean)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div>{property.title}</div>
                                            <div className="text-xs text-gray-500">{property.city}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{property.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(property.price)}
                                        </TableCell>
                                        <TableCell>
                                            {(property.area || property.surface) ? `${property.area || property.surface} m²` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getPriorityColor(property.priority)} variant="secondary">
                                                {property.priority || 'medium'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(property.status)} variant="secondary">
                                                {property.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/properties/${property.id}`)}
                                                    data-testid={`view-property-${property.id}`}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenEditModal(property)}
                                                    data-testid={`edit-property-${property.id}`}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteProperty(property)}
                                                    data-testid={`delete-property-${property.id}`}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                description={confirmDialog.description}
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="destructive"
            />
        </div>
    );
}
