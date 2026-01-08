import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, DollarSign, Calendar, User, FileText, AlertCircle, Trash2, Download, Mail } from 'lucide-react';
import { invoicesAPI, Invoice } from '@/shared/utils/finance-api';
import { format, isPast } from 'date-fns';

export default function InvoiceDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadInvoice();
        }
    }, [id]);

    const loadInvoice = async () => {
        try {
            setLoading(true);
            const data = await invoicesAPI.getById(id as string);
            setInvoice(data);
        } catch (err: any) {
            console.error('Error loading invoice:', err);
            setError('Erreur lors du chargement de la facture');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!invoice) return;
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;

        try {
            await invoicesAPI.delete(invoice.id);
            router.push('/finance');
        } catch (err) {
            console.error('Failed to delete invoice:', err);
            alert('Erreur lors de la suppression');
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'draft': 'bg-gray-100 text-gray-800',
            'sent': 'bg-blue-100 text-blue-800',
            'paid': 'bg-green-100 text-green-800',
            'partially_paid': 'bg-yellow-100 text-yellow-800',
            'overdue': 'bg-red-100 text-red-800',
            'cancelled': 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'draft': 'Brouillon',
            'sent': 'Envoyée',
            'paid': 'Payée',
            'partially_paid': 'Partiellement payée',
            'overdue': 'En retard',
            'cancelled': 'Annulée',
        };
        return labels[status] || status;
    };

    const getClientTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'buyer': 'Acheteur',
            'seller': 'Vendeur',
            'tenant': 'Locataire',
            'landlord': 'Propriétaire',
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    if (error || !invoice) {
        return (
            <Layout>
                <div className="flex items-center justify-center p-8 text-red-500">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {error || 'Facture non trouvée'}
                </div>
            </Layout>
        );
    }

    const isOverdue = invoice.status !== 'paid' && invoice.status !== 'cancelled' && isPast(new Date(invoice.dueDate));
    const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remaining = invoice.totalAmount - totalPaid;

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            size="sm"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Facture {invoice.number}</h1>
                            <div className="flex gap-2 mt-2">
                                <Badge className={getStatusColor(invoice.status)} variant="secondary">
                                    {getStatusLabel(invoice.status)}
                                </Badge>
                                <Badge variant="outline">
                                    {getClientTypeLabel(invoice.clientType)}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {invoice.pdfUrl && (
                            <Button
                                variant="outline"
                                onClick={() => window.open(invoice.pdfUrl, '_blank')}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Télécharger PDF
                            </Button>
                        )}
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                        </Button>
                    </div>
                </div>

                {/* Warning si en retard */}
                {isOverdue && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-red-800">Facture en retard</p>
                            <p className="text-sm text-red-600">
                                La date d'échéance ({format(new Date(invoice.dueDate), 'dd/MM/yyyy')}) est dépassée.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Informations principales */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Informations de la facture
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Numéro</p>
                                        <p className="font-medium">{invoice.number}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Statut</p>
                                        <p className="font-medium">{getStatusLabel(invoice.status)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Devise</p>
                                        <p className="font-medium">{invoice.currency}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Date d'émission</p>
                                        <p className="font-medium">{format(new Date(invoice.createdAt), 'dd/MM/yyyy')}</p>
                                    </div>
                                </div>

                                {invoice.description && (
                                    <div>
                                        <p className="text-sm text-gray-600">Description</p>
                                        <p className="mt-1">{invoice.description}</p>
                                    </div>
                                )}

                                {invoice.notes && (
                                    <div>
                                        <p className="text-sm text-gray-600">Notes</p>
                                        <p className="mt-1">{invoice.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Informations Client
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">Nom</p>
                                    <p className="font-medium">{invoice.clientName}</p>
                                </div>
                                {invoice.clientEmail && (
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-medium">{invoice.clientEmail}</p>
                                    </div>
                                )}
                                {invoice.clientPhone && (
                                    <div>
                                        <p className="text-sm text-gray-600">Téléphone</p>
                                        <p className="font-medium">{invoice.clientPhone}</p>
                                    </div>
                                )}
                                {invoice.clientAddress && (
                                    <div>
                                        <p className="text-sm text-gray-600">Adresse</p>
                                        <p className="font-medium">{invoice.clientAddress}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Montants
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Montant HT</span>
                                        <span className="font-medium">
                                            {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: invoice.currency }).format(invoice.amount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">TVA</span>
                                        <span className="font-medium">
                                            {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: invoice.currency }).format(invoice.vat)}
                                        </span>
                                    </div>
                                    <div className="border-t pt-3 flex justify-between items-center">
                                        <span className="text-lg font-semibold">Total TTC</span>
                                        <span className="text-xl font-bold text-blue-600">
                                            {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: invoice.currency }).format(invoice.totalAmount)}
                                        </span>
                                    </div>
                                </div>

                                {totalPaid > 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <p className="text-sm text-green-800">Montant payé</p>
                                        <p className="text-lg font-bold text-green-900">
                                            {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: invoice.currency }).format(totalPaid)}
                                        </p>
                                    </div>
                                )}

                                {invoice.status !== 'paid' && remaining > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <p className="text-sm text-yellow-800">Reste à payer</p>
                                        <p className="text-lg font-bold text-yellow-900">
                                            {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: invoice.currency }).format(remaining)}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Dates
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Créée le</p>
                                        <p className="font-medium">{format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Échéance</p>
                                        <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                                            {format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
                                        </p>
                                    </div>
                                    {invoice.paidAt && (
                                        <div>
                                            <p className="text-sm text-gray-600">Payée le</p>
                                            <p className="font-medium text-green-600">{format(new Date(invoice.paidAt), 'dd/MM/yyyy')}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Paiements */}
                        {invoice.payments && invoice.payments.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Paiements ({invoice.payments.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {invoice.payments.map((payment, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="font-medium">
                                                        {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: payment.currency }).format(payment.amount)}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {format(new Date(payment.paidAt), 'dd/MM/yyyy')} - {payment.method}
                                                    </p>
                                                    {payment.reference && (
                                                        <p className="text-xs text-gray-500">Réf: {payment.reference}</p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/finance/payments/${payment.id}`)}
                                                >
                                                    Voir
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar - Relations */}
                    <div className="space-y-6">
                        {invoice.transactionId && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Transaction
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {invoice.transaction ? (
                                        <div className="space-y-2">
                                            <p className="font-medium">{invoice.transaction.reference}</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full mt-2"
                                                onClick={() => router.push(`/transactions/${invoice.transactionId}`)}
                                            >
                                                Voir la transaction
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">ID: {invoice.transactionId}</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {invoice.ownerId && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Propriétaire
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {invoice.owner ? (
                                        <div className="space-y-2">
                                            <p className="font-medium">{invoice.owner.name}</p>
                                            {invoice.owner.email && (
                                                <p className="text-sm text-gray-600">{invoice.owner.email}</p>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full mt-2"
                                                onClick={() => router.push(`/owners/${invoice.ownerId}`)}
                                            >
                                                Voir le propriétaire
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">ID: {invoice.ownerId}</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
