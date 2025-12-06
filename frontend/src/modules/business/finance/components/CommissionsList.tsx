import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { commissionsAPI, Commission } from '@/shared/utils/finance-api';
import { Plus, Eye, Trash } from 'lucide-react';
import { format } from 'date-fns';

interface CommissionsListProps {
    onUpdate?: () => void;
}

export function CommissionsList({ onUpdate }: CommissionsListProps) {
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchCommissions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await commissionsAPI.list();
            setCommissions(response);
        } catch (err) {
            setError('Échec du chargement des commissions');
            console.error('Error fetching commissions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommissions();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette commission ?')) return;

        try {
            await commissionsAPI.delete(id);
            await fetchCommissions();
            onUpdate?.();
        } catch (err) {
            console.error('Failed to delete commission:', err);
            alert('Erreur lors de la suppression');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'partially_paid': return 'bg-blue-100 text-blue-800';
            case 'paid': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading && commissions.length === 0) {
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
            <div className="flex justify-end">
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Commission
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transaction</TableHead>
                                <TableHead>Agent</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Pourcentage</TableHead>
                                <TableHead>Date d'échéance</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {commissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                        Aucune commission trouvée
                                    </TableCell>
                                </TableRow>
                            ) : (
                                commissions.map((commission) => (
                                    <TableRow key={commission.id}>
                                        <TableCell className="font-medium">
                                            {commission.transaction?.reference || commission.transactionId}
                                        </TableCell>
                                        <TableCell>
                                            {commission.agent?.name || commission.agentId}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {commission.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: commission.currency }).format(commission.amount)}
                                        </TableCell>
                                        <TableCell>
                                            {commission.percentage ? `${commission.percentage}%` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {commission.dueDate ? format(new Date(commission.dueDate), 'dd/MM/yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(commission.status)} variant="secondary">
                                                {commission.status === 'pending' ? 'En attente' :
                                                 commission.status === 'partially_paid' ? 'Partiellement payée' :
                                                 commission.status === 'paid' ? 'Payée' : 'Annulée'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/finance/commissions/${commission.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(commission.id)}
                                                >
                                                    <Trash className="h-4 w-4 text-red-500" />
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
