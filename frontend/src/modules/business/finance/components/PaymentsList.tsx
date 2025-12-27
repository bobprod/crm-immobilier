import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { paymentsAPI, Payment } from '@/shared/utils/finance-api';
import { Plus, Eye, Trash } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentsListProps {
    onUpdate?: () => void;
}

export function PaymentsList({ onUpdate }: PaymentsListProps) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await paymentsAPI.list();
            setPayments(response);
        } catch (err) {
            setError('Échec du chargement des paiements');
            console.error('Error fetching payments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) return;

        try {
            await paymentsAPI.delete(id);
            await fetchPayments();
            onUpdate?.();
        } catch (err) {
            console.error('Failed to delete payment:', err);
            alert('Erreur lors de la suppression');
        }
    };

    const getMethodColor = (method: string) => {
        switch (method) {
            case 'cash': return 'bg-green-100 text-green-800';
            case 'check': return 'bg-blue-100 text-blue-800';
            case 'bank_transfer': return 'bg-purple-100 text-purple-800';
            case 'credit_card': return 'bg-orange-100 text-orange-800';
            case 'other': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getMethodLabel = (method: string) => {
        switch (method) {
            case 'cash': return 'Espèces';
            case 'check': return 'Chèque';
            case 'bank_transfer': return 'Virement';
            case 'credit_card': return 'Carte bancaire';
            case 'other': return 'Autre';
            default: return method;
        }
    };

    if (loading && payments.length === 0) {
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
                    Nouveau Paiement
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Référence</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Méthode</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        Aucun paiement trouvé
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-medium">
                                            {payment.reference || payment.id.slice(0, 8)}
                                        </TableCell>
                                        <TableCell>
                                            {payment.invoiceId ? (
                                                <div>
                                                    <Badge variant="outline" className="bg-blue-50">Facture</Badge>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {payment.invoice?.number || payment.invoiceId}
                                                    </div>
                                                </div>
                                            ) : payment.commissionId ? (
                                                <div>
                                                    <Badge variant="outline" className="bg-green-50">Commission</Badge>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {payment.commissionId.slice(0, 8)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <Badge variant="outline">Direct</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: payment.currency }).format(payment.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getMethodColor(payment.method)} variant="secondary">
                                                {getMethodLabel(payment.method)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(payment.paidAt), 'dd/MM/yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-gray-600 max-w-[200px] truncate">
                                                {payment.notes || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/finance/payments/${payment.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(payment.id)}
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
