import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, DollarSign, Calendar, CreditCard, FileText, AlertCircle, Trash2, TrendingUp } from 'lucide-react';
import { paymentsAPI, Payment } from '@/shared/utils/finance-api';
import { format } from 'date-fns';

export default function PaymentDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadPayment();
        }
    }, [id]);

    const loadPayment = async () => {
        try {
            setLoading(true);
            const data = await paymentsAPI.getById(id as string);
            setPayment(data);
        } catch (err: any) {
            console.error('Error loading payment:', err);
            setError('Erreur lors du chargement du paiement');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!payment) return;
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) return;

        try {
            await paymentsAPI.delete(payment.id);
            router.push('/finance');
        } catch (err) {
            console.error('Failed to delete payment:', err);
            alert('Erreur lors de la suppression');
        }
    };

    const getMethodColor = (method: string) => {
        const colors: Record<string, string> = {
            'cash': 'bg-green-100 text-green-800',
            'check': 'bg-blue-100 text-blue-800',
            'bank_transfer': 'bg-purple-100 text-purple-800',
            'credit_card': 'bg-indigo-100 text-indigo-800',
            'other': 'bg-gray-100 text-gray-800',
        };
        return colors[method] || 'bg-gray-100 text-gray-800';
    };

    const getMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            'cash': 'Espèces',
            'check': 'Chèque',
            'bank_transfer': 'Virement bancaire',
            'credit_card': 'Carte de crédit',
            'other': 'Autre',
        };
        return labels[method] || method;
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </MainLayout>
        );
    }

    if (error || !payment) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center p-8 text-red-500">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {error || 'Paiement non trouvé'}
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
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
                            <h1 className="text-3xl font-bold text-gray-900">Paiement #{payment.id.slice(-6)}</h1>
                            <div className="flex gap-2 mt-2">
                                <Badge className={getMethodColor(payment.method)} variant="secondary">
                                    {getMethodLabel(payment.method)}
                                </Badge>
                                {payment.reference && (
                                    <Badge variant="outline">
                                        Réf: {payment.reference}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Informations principales */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Informations du paiement
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Méthode de paiement</p>
                                        <p className="font-medium">{getMethodLabel(payment.method)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Devise</p>
                                        <p className="font-medium">{payment.currency}</p>
                                    </div>
                                    {payment.reference && (
                                        <div className="col-span-2">
                                            <p className="text-sm text-gray-600">Référence</p>
                                            <p className="font-medium">{payment.reference}</p>
                                        </div>
                                    )}
                                </div>

                                {payment.notes && (
                                    <div>
                                        <p className="text-sm text-gray-600">Notes</p>
                                        <p className="mt-1">{payment.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Montant
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                    <p className="text-sm text-green-800 mb-2">Montant payé</p>
                                    <p className="text-4xl font-bold text-green-900">
                                        {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: payment.currency }).format(payment.amount)}
                                    </p>
                                </div>
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
                                        <p className="text-sm text-gray-600">Enregistré le</p>
                                        <p className="font-medium">{format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Date de paiement</p>
                                        <p className="font-medium text-green-600">{format(new Date(payment.paidAt), 'dd/MM/yyyy')}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Metadata */}
                        {payment.metadata && Object.keys(payment.metadata).length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Informations supplémentaires
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {Object.entries(payment.metadata).map(([key, value]) => (
                                            <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                <span className="text-sm text-gray-600">{key}</span>
                                                <span className="font-medium">{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar - Relations */}
                    <div className="space-y-6">
                        {payment.invoiceId && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Facture
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {payment.invoice ? (
                                        <div className="space-y-2">
                                            <p className="font-medium">{payment.invoice.number}</p>
                                            <p className="text-sm text-gray-600">
                                                {payment.invoice.clientName}
                                            </p>
                                            <div className="mt-2 p-2 bg-gray-50 rounded">
                                                <p className="text-xs text-gray-600">Montant total</p>
                                                <p className="font-medium">
                                                    {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: payment.invoice.currency }).format(payment.invoice.totalAmount)}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full mt-2"
                                                onClick={() => router.push(`/finance/invoices/${payment.invoiceId}`)}
                                            >
                                                Voir la facture
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-500">ID: {payment.invoiceId}</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => router.push(`/finance/invoices/${payment.invoiceId}`)}
                                            >
                                                Voir la facture
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {payment.commissionId && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Commission
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {payment.commission ? (
                                        <div className="space-y-2">
                                            <p className="font-medium">Commission #{payment.commission.id.slice(-6)}</p>
                                            <p className="text-sm text-gray-600">
                                                {payment.commission.type}
                                            </p>
                                            <div className="mt-2 p-2 bg-gray-50 rounded">
                                                <p className="text-xs text-gray-600">Montant total</p>
                                                <p className="font-medium">
                                                    {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: payment.commission.currency }).format(payment.commission.amount)}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full mt-2"
                                                onClick={() => router.push(`/finance/commissions/${payment.commissionId}`)}
                                            >
                                                Voir la commission
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-500">ID: {payment.commissionId}</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => router.push(`/finance/commissions/${payment.commissionId}`)}
                                            >
                                                Voir la commission
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {!payment.invoiceId && !payment.commissionId && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5" />
                                        Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600">
                                        Ce paiement n'est lié à aucune facture ou commission.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
