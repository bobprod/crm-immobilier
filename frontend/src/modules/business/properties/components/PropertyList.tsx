import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { propertiesAPI, Property } from '@/shared/utils/properties-api';
import { PropertyFilters } from './PropertyFilters';
import { PropertyBulkActions } from './PropertyBulkActions';
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
                if (!confirm('Êtes-vous sûr de vouloir supprimer ces propriétés ?')) return;
                await propertiesAPI.bulkDelete(selectedIds);
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
            alert('Une erreur est survenue lors de l\'action groupée');
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
                <Button onClick={() => router.push('/properties/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Propriété
                </Button>
            </div>

            <PropertyFilters onFilterChange={handleFilterChange} />

            <PropertyBulkActions
                selectedCount={selectedIds.length}
                onAction={handleBulkAction}
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
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/properties/${property.id}/edit`)}
                                                >
                                                    <Edit className="h-4 w-4" />
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
        </div>
    );
}
