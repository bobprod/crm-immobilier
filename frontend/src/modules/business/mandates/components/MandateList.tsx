import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { mandatesAPI, Mandate } from '@/shared/utils/mandates-api';
import { MandateFilters } from './MandateFilters';
import { Plus, Eye, Edit, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface MandateListProps {
    initialLoading?: boolean;
    initialError?: string | null;
    initialMandates?: Mandate[];
}

export function MandateList({ initialLoading, initialError, initialMandates }: MandateListProps) {
    const [mandates, setMandates] = useState<Mandate[]>(initialMandates || []);
    const [loading, setLoading] = useState<boolean>(initialLoading ?? false);
    const [error, setError] = useState<string | null>(initialError ?? null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filters, setFilters] = useState<any>({});
    const router = useRouter();

    const fetchMandates = async (currentFilters = filters) => {
        setLoading(true);
        setError(null);
        try {
            const response = await mandatesAPI.list(currentFilters);
            setMandates(response);
        } catch (err) {
            setError('Échec du chargement des mandats');
            console.error('Error fetching mandates:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!initialMandates && !initialLoading) {
            fetchMandates();
        }
    }, [initialMandates, initialLoading]);

    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters);
        fetchMandates(newFilters);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(mandates.map(m => m.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(mid => mid !== id));
        }
    };

    const handleCancel = async (mandate: Mandate) => {
        const reason = prompt('Raison de l\'annulation du mandat :');
        if (!reason) return;

        try {
            await mandatesAPI.cancel(mandate.id, reason);
            await fetchMandates();
        } catch (err) {
            console.error('Failed to cancel mandate:', err);
            alert('Erreur lors de l\'annulation du mandat');
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'exclusive': return 'bg-purple-100 text-purple-800';
            case 'semi-exclusive': return 'bg-blue-100 text-blue-800';
            case 'simple': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'sale': return 'bg-green-100 text-green-800';
            case 'rent': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'expired': return 'bg-red-100 text-red-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const isExpiringSoon = (endDate: string) => {
        const today = new Date();
        const end = new Date(endDate);
        const daysUntilExpiry = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    };

    if (loading && mandates.length === 0) {
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
                <h2 className="text-2xl font-bold tracking-tight">Mandats</h2>
                <Button onClick={() => router.push('/mandates/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau Mandat
                </Button>
            </div>

            <MandateFilters onFilterChange={handleFilterChange} />

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={mandates.length > 0 && selectedIds.length === mandates.length}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>Référence</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Catégorie</TableHead>
                                <TableHead>Propriétaire</TableHead>
                                <TableHead>Commission</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mandates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                        Aucun mandat trouvé
                                    </TableCell>
                                </TableRow>
                            ) : (
                                mandates.map((mandate) => (
                                    <TableRow key={mandate.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.includes(mandate.id)}
                                                onCheckedChange={(checked) => handleSelectOne(mandate.id, checked as boolean)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div>{mandate.reference}</div>
                                            {isExpiringSoon(mandate.endDate) && (
                                                <div className="text-xs text-orange-600">Expire bientôt!</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getTypeColor(mandate.type)} variant="secondary">
                                                {mandate.type === 'exclusive' ? 'Exclusif' :
                                                 mandate.type === 'semi-exclusive' ? 'Semi-exclusif' : 'Simple'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getCategoryColor(mandate.category)} variant="secondary">
                                                {mandate.category === 'sale' ? 'Vente' : 'Location'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {mandate.owner?.name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {mandate.commissionType === 'percentage'
                                                ? `${mandate.commission}%`
                                                : `${mandate.commission} ${mandate.currency}`}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs">
                                                <div>{format(new Date(mandate.startDate), 'dd/MM/yyyy')}</div>
                                                <div className="text-gray-500">→ {format(new Date(mandate.endDate), 'dd/MM/yyyy')}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(mandate.status)} variant="secondary">
                                                {mandate.status === 'active' ? 'Actif' :
                                                 mandate.status === 'expired' ? 'Expiré' :
                                                 mandate.status === 'completed' ? 'Terminé' : 'Annulé'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/mandates/${mandate.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/mandates/${mandate.id}/edit`)}
                                                    disabled={mandate.status !== 'active'}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {mandate.status === 'active' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleCancel(mandate)}
                                                    >
                                                        <XCircle className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                )}
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
