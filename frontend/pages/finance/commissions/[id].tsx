import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, DollarSign, Calendar, User, TrendingUp, AlertCircle, Trash2, FileText } from 'lucide-react';
import { commissionsAPI, Commission } from '@/shared/utils/finance-api';
import { format } from 'date-fns';

export default function CommissionDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const [commission, setCommission] = useState<Commission | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadCommission();
        }
    }, [id]);

    const loadCommission = async () => {
        try {
            setLoading(true);
            const data = await commissionsAPI.getById(id as string);
            setCommission(data);
        } catch (err: any) {
            console.error('Error loading commission:', err);
            setError('Erreur lors du chargement de la commission');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!commission) return;
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette commission ?')) return;

        try {
            await commissionsAPI.delete(commission.id);
            router.push('/finance');
        } catch (err) {
            console.error('Failed to delete commission:', err);
            alert('Erreur lors de la suppression');
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'partially_paid': 'bg-blue-100 text-blue-800',
            'paid': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'pending': 'En attente',
            'partially_paid': 'Partiellement payée',
            'paid': 'Payée',
            'cancelled': 'Annulée',
        };
        return labels[status] || status;
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'agent': 'Agent',
            'agency': 'Agence',
            'referral': 'Parrainage',
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

    if (error || !commission) {
        return (
            <Layout>
                <div className="flex items-center justify-center p-8 text-red-500">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {error || 'Commission non trouvée'}
                </div>
            </Layout>
        );
    }

    const totalPaid = commission.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remaining = commission.amount - totalPaid;

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
                            <h1 className="text-3xl font-bold text-gray-900">Commission #{commission.id.slice(-6)}</h1>
                            <div className="flex gap-2 mt-2">
                                <Badge className={getStatusColor(commission.status)} variant="secondary">
                                    {getStatusLabel(commission.status)}
                                </Badge>
                                <Badge variant="outline">
                                    {getTypeLabel(commission.type)}
                                </Badge>
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
                                    <FileText className="h-5 w-5" />
                                    Informations de la commission
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Type</p>
                                        <p className="font-medium">{getTypeLabel(commission.type)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Statut</p>
                                        <p className="font-medium">{getStatusLabel(commission.status)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Devise</p>
                                        <p className="font-medium">{commission.currency}</p>
                                    </div>
                                    {commission.percentage && (
                                        <div>
                                            <p className="text-sm text-gray-600">Pourcentage</p>
                                            <p className="font-medium">{commission.percentage}%</p>
                                        </div>
                                    )}
                                </div>

                                {commission.notes && (
                                    <div>
                                        <p className="text-sm text-gray-600">Notes</p>
                                        <p className="mt-1">{commission.notes}</p>
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Montant total</p>
                                        <p className="font-medium text-xl">
                                            {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: commission.currency }).format(commission.amount)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Montant payé</p>
                                        <p className="font-medium text-xl text-green-600">
                                            {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: commission.currency }).format(totalPaid)}
                                        </p>
                                    </div>
                                </div>

                                {commission.status !== 'paid' && remaining > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <p className="text-sm text-yellow-800 font-medium">Reste à payer</p>
                                        <p className="text-2xl font-bold text-yellow-900">
                                            {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: commission.currency }).format(remaining)}
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
                                        <p className="font-medium">{format(new Date(commission.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                                    </div>
                                    {commission.dueDate && (
                                        <div>
                                            <p className="text-sm text-gray-600">Échéance</p>
                                            <p className="font-medium">{format(new Date(commission.dueDate), 'dd/MM/yyyy')}</p>
                                        </div>
                                    )}
                                    {commission.paidAt && (
                                        <div>
                                            <p className="text-sm text-gray-600">Payée le</p>
                                            <p className="font-medium text-green-600">{format(new Date(commission.paidAt), 'dd/MM/yyyy')}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Paiements */}
                        {commission.payments && commission.payments.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Paiements ({commission.payments.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {commission.payments.map((payment, index) => (
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Transaction
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {commission.transaction ? (
                                    <div className="space-y-2">
                                        <p className="font-medium">{commission.transaction.reference}</p>
                                        <p className="text-sm text-gray-600">
                                            {commission.transaction.type === 'sale' ? 'Vente' : 'Location'}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full mt-2"
                                            onClick={() => router.push(`/transactions/${commission.transactionId}`)}
                                        >
                                            Voir la transaction
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">ID: {commission.transactionId}</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Agent
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {commission.agent ? (
                                    <div className="space-y-2">
                                        <p className="font-medium">{commission.agent.name || commission.agent.email}</p>
                                        {commission.agent.email && (
                                            <p className="text-sm text-gray-600">{commission.agent.email}</p>
                                        )}
                                        {commission.agent.phone && (
                                            <p className="text-sm text-gray-600">{commission.agent.phone}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">ID: {commission.agentId}</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
