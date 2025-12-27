import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { invoicesAPI, Invoice } from '@/shared/utils/finance-api';
import { Plus, Eye, Download, Trash } from 'lucide-react';
import { format } from 'date-fns';

interface InvoicesListProps {
    onUpdate?: () => void;
}

export function InvoicesList({ onUpdate }: InvoicesListProps) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchInvoices = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await invoicesAPI.list();
            setInvoices(response);
        } catch (err) {
            setError('Échec du chargement des factures');
            console.error('Error fetching invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;

        try {
            await invoicesAPI.delete(id);
            await fetchInvoices();
            onUpdate?.();
        } catch (err) {
            console.error('Failed to delete invoice:', err);
            alert('Erreur lors de la suppression');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-800';
            case 'sent': return 'bg-blue-100 text-blue-800';
            case 'paid': return 'bg-green-100 text-green-800';
            case 'partially_paid': return 'bg-yellow-100 text-yellow-800';
            case 'overdue': return 'bg-red-100 text-red-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getClientTypeColor = (type: string) => {
        switch (type) {
            case 'buyer': return 'bg-green-100 text-green-800';
            case 'seller': return 'bg-blue-100 text-blue-800';
            case 'tenant': return 'bg-purple-100 text-purple-800';
            case 'landlord': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const isOverdue = (invoice: Invoice) => {
        if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
        return new Date(invoice.dueDate) < new Date();
    };

    if (loading && invoices.length === 0) {
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
                    Nouvelle Facture
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Numéro</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Type Client</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>TVA</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Date d'échéance</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                        Aucune facture trouvée
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice) => (
                                    <TableRow key={invoice.id} className={isOverdue(invoice) ? 'bg-red-50' : ''}>
                                        <TableCell className="font-medium">
                                            {invoice.number}
                                            {isOverdue(invoice) && (
                                                <div className="text-xs text-red-600">En retard!</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div>{invoice.clientName}</div>
                                            {invoice.clientEmail && (
                                                <div className="text-xs text-gray-500">{invoice.clientEmail}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getClientTypeColor(invoice.clientType)} variant="secondary">
                                                {invoice.clientType === 'buyer' ? 'Acheteur' :
                                                 invoice.clientType === 'seller' ? 'Vendeur' :
                                                 invoice.clientType === 'tenant' ? 'Locataire' : 'Propriétaire'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: invoice.currency }).format(invoice.amount)}
                                        </TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: invoice.currency }).format(invoice.vat)}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: invoice.currency }).format(invoice.totalAmount)}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(invoice.status)} variant="secondary">
                                                {invoice.status === 'draft' ? 'Brouillon' :
                                                 invoice.status === 'sent' ? 'Envoyée' :
                                                 invoice.status === 'paid' ? 'Payée' :
                                                 invoice.status === 'partially_paid' ? 'Partiellement payée' :
                                                 invoice.status === 'overdue' ? 'En retard' : 'Annulée'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {invoice.pdfUrl && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => window.open(invoice.pdfUrl, '_blank')}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/finance/invoices/${invoice.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(invoice.id)}
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
