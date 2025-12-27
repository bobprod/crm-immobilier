import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, Calendar, DollarSign, FileText, User, Home, TrendingUp, AlertCircle } from 'lucide-react';
import { transactionsAPI, Transaction } from '@/shared/utils/transactions-api';
import { format } from 'date-fns';

export default function TransactionDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadTransaction();
        }
    }, [id]);

    const loadTransaction = async () => {
        try {
            setLoading(true);
            const data = await transactionsAPI.getById(id as string);
            setTransaction(data);
        } catch (err: any) {
            console.error('Error loading transaction:', err);
            setError('Erreur lors du chargement de la transaction');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async () => {
        if (!transaction) return;
        const finalPriceStr = prompt('Prix final de la transaction :', String(transaction.offerPrice));
        if (!finalPriceStr) return;

        const finalPrice = parseFloat(finalPriceStr);
        if (isNaN(finalPrice)) {
            alert('Prix invalide');
            return;
        }

        try {
            await transactionsAPI.finalize(transaction.id, finalPrice);
            router.push('/transactions');
        } catch (err) {
            console.error('Failed to finalize transaction:', err);
            alert('Erreur lors de la finalisation');
        }
    };

    const handleCancel = async () => {
        if (!transaction) return;
        const reason = prompt('Raison de l\'annulation :');
        if (!reason) return;

        try {
            await transactionsAPI.cancel(transaction.id, reason);
            router.push('/transactions');
        } catch (err) {
            console.error('Failed to cancel transaction:', err);
            alert('Erreur lors de l\'annulation');
        }
    };

    const getTypeColor = (type: string) => {
        return type === 'sale' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'offer_received': 'bg-blue-100 text-blue-800',
            'offer_accepted': 'bg-purple-100 text-purple-800',
            'promise_signed': 'bg-indigo-100 text-indigo-800',
            'compromis_signed': 'bg-yellow-100 text-yellow-800',
            'final_deed_signed': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'offer_received': 'Offre Reçue',
            'offer_accepted': 'Offre Acceptée',
            'promise_signed': 'Promesse Signée',
            'compromis_signed': 'Compromis Signé',
            'final_deed_signed': 'Acte Final Signé',
            'cancelled': 'Annulée',
        };
        return labels[status] || status;
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

    if (error || !transaction) {
        return (
            <Layout>
                <div className="flex items-center justify-center p-8 text-red-500">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {error || 'Transaction non trouvée'}
                </div>
            </Layout>
        );
    }

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
                            <h1 className="text-3xl font-bold text-gray-900">Transaction {transaction.reference}</h1>
                            <div className="flex gap-2 mt-2">
                                <Badge className={getTypeColor(transaction.type)} variant="secondary">
                                    {transaction.type === 'sale' ? 'Vente' : 'Location'}
                                </Badge>
                                <Badge className={getStatusColor(transaction.status)} variant="secondary">
                                    {getStatusLabel(transaction.status)}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {transaction.status === 'final_deed_signed' && (
                            <Button
                                variant="default"
                                onClick={handleFinalize}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Finaliser
                            </Button>
                        )}
                        {transaction.status !== 'cancelled' && (
                            <Button
                                variant="destructive"
                                onClick={handleCancel}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Annuler
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Informations principales */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Informations de la transaction
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Référence</p>
                                        <p className="font-medium">{transaction.reference}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Type</p>
                                        <p className="font-medium">{transaction.type === 'sale' ? 'Vente' : 'Location'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Statut</p>
                                        <p className="font-medium">{getStatusLabel(transaction.status)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Devise</p>
                                        <p className="font-medium">{transaction.currency}</p>
                                    </div>
                                </div>

                                {transaction.notes && (
                                    <div>
                                        <p className="text-sm text-gray-600">Notes</p>
                                        <p className="mt-1">{transaction.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Prix et Montants
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Prix de l'offre</p>
                                        <p className="font-medium text-xl">
                                            {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: transaction.currency }).format(transaction.offerPrice)}
                                        </p>
                                    </div>
                                    {transaction.finalPrice && (
                                        <div>
                                            <p className="text-sm text-gray-600">Prix final</p>
                                            <p className="font-medium text-xl text-green-600">
                                                {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: transaction.currency }).format(transaction.finalPrice)}
                                            </p>
                                        </div>
                                    )}
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
                                        <p className="text-sm text-gray-600">Créée le</p>
                                        <p className="font-medium">{format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                                    </div>
                                    {transaction.expectedClosing && (
                                        <div>
                                            <p className="text-sm text-gray-600">Clôture prévue</p>
                                            <p className="font-medium">{format(new Date(transaction.expectedClosing), 'dd/MM/yyyy')}</p>
                                        </div>
                                    )}
                                    {transaction.actualClosing && (
                                        <div>
                                            <p className="text-sm text-gray-600">Clôture réelle</p>
                                            <p className="font-medium text-green-600">{format(new Date(transaction.actualClosing), 'dd/MM/yyyy')}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Transaction Steps */}
                        {transaction.steps && transaction.steps.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Étapes de la transaction
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {transaction.steps.map((step, index) => (
                                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">{step.description}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {format(new Date(step.date), 'dd/MM/yyyy')}
                                                    </p>
                                                    {step.notes && (
                                                        <p className="text-sm text-gray-500 mt-1">{step.notes}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar - Relations */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Home className="h-5 w-5" />
                                    Propriété
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {transaction.property ? (
                                    <div className="space-y-2">
                                        <p className="font-medium">{transaction.property.title}</p>
                                        {transaction.property.reference && (
                                            <p className="text-sm text-gray-600">Réf: {transaction.property.reference}</p>
                                        )}
                                        {transaction.property.city && (
                                            <p className="text-sm text-gray-600">{transaction.property.city}</p>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full mt-2"
                                            onClick={() => router.push(`/properties/${transaction.propertyId}`)}
                                        >
                                            Voir la propriété
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">ID: {transaction.propertyId}</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Prospect
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {transaction.prospect ? (
                                    <div className="space-y-2">
                                        <p className="font-medium">{transaction.prospect.name}</p>
                                        {transaction.prospect.email && (
                                            <p className="text-sm text-gray-600">{transaction.prospect.email}</p>
                                        )}
                                        {transaction.prospect.phone && (
                                            <p className="text-sm text-gray-600">{transaction.prospect.phone}</p>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full mt-2"
                                            onClick={() => router.push(`/prospects/${transaction.prospectId}`)}
                                        >
                                            Voir le prospect
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">ID: {transaction.prospectId}</p>
                                )}
                            </CardContent>
                        </Card>

                        {transaction.mandateId && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Mandat
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {transaction.mandate ? (
                                        <div className="space-y-2">
                                            <p className="font-medium">{transaction.mandate.reference}</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full mt-2"
                                                onClick={() => router.push(`/mandates/${transaction.mandateId}`)}
                                            >
                                                Voir le mandat
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">ID: {transaction.mandateId}</p>
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
