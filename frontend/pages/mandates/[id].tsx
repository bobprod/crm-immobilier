import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Edit, XCircle, Calendar, DollarSign, FileText, User, Home, AlertCircle } from 'lucide-react';
import { mandatesAPI, Mandate } from '@/shared/utils/mandates-api';
import { format } from 'date-fns';

export default function MandateDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const [mandate, setMandate] = useState<Mandate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadMandate();
        }
    }, [id]);

    const loadMandate = async () => {
        try {
            setLoading(true);
            const data = await mandatesAPI.getById(id as string);
            setMandate(data);
        } catch (err: any) {
            console.error('Error loading mandate:', err);
            setError('Erreur lors du chargement du mandat');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!mandate) return;
        const reason = prompt('Raison de l\'annulation du mandat :');
        if (!reason) return;

        try {
            await mandatesAPI.cancel(mandate.id, reason);
            router.push('/mandates');
        } catch (err) {
            console.error('Failed to cancel mandate:', err);
            alert('Erreur lors de l\'annulation');
        }
    };

    const handleDelete = async () => {
        if (!mandate) return;
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce mandat ?')) return;

        try {
            await mandatesAPI.delete(mandate.id);
            router.push('/mandates');
        } catch (err) {
            console.error('Failed to delete mandate:', err);
            alert('Erreur lors de la suppression');
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'exclusive': return 'bg-purple-100 text-purple-800';
            case 'semi_exclusive': return 'bg-blue-100 text-blue-800';
            case 'simple': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'sale': return 'bg-green-100 text-green-800';
            case 'rental': return 'bg-orange-100 text-orange-800';
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

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'exclusive': return 'Exclusif';
            case 'semi_exclusive': return 'Semi-exclusif';
            case 'simple': return 'Simple';
            default: return type;
        }
    };

    const getCategoryLabel = (category: string) => {
        return category === 'sale' ? 'Vente' : 'Location';
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Actif';
            case 'expired': return 'Expiré';
            case 'completed': return 'Terminé';
            case 'cancelled': return 'Annulé';
            default: return status;
        }
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

    if (error || !mandate) {
        return (
            <Layout>
                <div className="flex items-center justify-center p-8 text-red-500">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {error || 'Mandat non trouvé'}
                </div>
            </Layout>
        );
    }

    const isExpiringSoon = () => {
        const today = new Date();
        const end = new Date(mandate.endDate);
        const daysUntilExpiry = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    };

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
                            <h1 className="text-3xl font-bold text-gray-900">Mandat {mandate.reference}</h1>
                            <div className="flex gap-2 mt-2">
                                <Badge className={getTypeColor(mandate.type)} variant="secondary">
                                    {getTypeLabel(mandate.type)}
                                </Badge>
                                <Badge className={getCategoryColor(mandate.category)} variant="secondary">
                                    {getCategoryLabel(mandate.category)}
                                </Badge>
                                <Badge className={getStatusColor(mandate.status)} variant="secondary">
                                    {getStatusLabel(mandate.status)}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {mandate.status === 'active' && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/mandates/${mandate.id}/edit`)}
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Modifier
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Annuler
                                </Button>
                            </>
                        )}
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                        >
                            Supprimer
                        </Button>
                    </div>
                </div>

                {/* Warning if expiring soon */}
                {isExpiringSoon() && mandate.status === 'active' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div className="text-orange-700 text-sm">
                            <p className="font-medium">Ce mandat expire bientôt!</p>
                            <p>Date d'expiration: {format(new Date(mandate.endDate), 'dd/MM/yyyy')}</p>
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
                                    Informations du mandat
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Référence</p>
                                        <p className="font-medium">{mandate.reference}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Type</p>
                                        <p className="font-medium">{getTypeLabel(mandate.type)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Catégorie</p>
                                        <p className="font-medium">{getCategoryLabel(mandate.category)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Statut</p>
                                        <p className="font-medium">{getStatusLabel(mandate.status)}</p>
                                    </div>
                                </div>

                                {mandate.terms && (
                                    <div>
                                        <p className="text-sm text-gray-600">Conditions</p>
                                        <p className="mt-1">{mandate.terms}</p>
                                    </div>
                                )}

                                {mandate.notes && (
                                    <div>
                                        <p className="text-sm text-gray-600">Notes</p>
                                        <p className="mt-1">{mandate.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Période de validité
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Date de début</p>
                                        <p className="font-medium">{format(new Date(mandate.startDate), 'dd/MM/yyyy')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Date de fin</p>
                                        <p className="font-medium">{format(new Date(mandate.endDate), 'dd/MM/yyyy')}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Commission
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Commission</p>
                                        <p className="font-medium text-xl">
                                            {mandate.commissionType === 'percentage'
                                                ? `${mandate.commission}%`
                                                : `${mandate.commission} ${mandate.currency || 'TND'}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Type</p>
                                        <p className="font-medium">
                                            {mandate.commissionType === 'percentage' ? 'Pourcentage' : 'Montant fixe'}
                                        </p>
                                    </div>
                                </div>

                                {mandate.exclusivityBonus && (
                                    <div>
                                        <p className="text-sm text-gray-600">Prime d'exclusivité</p>
                                        <p className="font-medium text-lg text-green-600">
                                            {mandate.exclusivityBonus} {mandate.currency || 'TND'}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Relations */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Propriétaire
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {mandate.owner ? (
                                    <div className="space-y-2">
                                        <p className="font-medium">{mandate.owner.name}</p>
                                        {mandate.owner.email && (
                                            <p className="text-sm text-gray-600">{mandate.owner.email}</p>
                                        )}
                                        {mandate.owner.phone && (
                                            <p className="text-sm text-gray-600">{mandate.owner.phone}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">ID: {mandate.ownerId}</p>
                                )}
                            </CardContent>
                        </Card>

                        {mandate.propertyId && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Home className="h-5 w-5" />
                                        Propriété
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {mandate.property ? (
                                        <div className="space-y-2">
                                            <p className="font-medium">{mandate.property.title}</p>
                                            {mandate.property.reference && (
                                                <p className="text-sm text-gray-600">Réf: {mandate.property.reference}</p>
                                            )}
                                            {mandate.property.city && (
                                                <p className="text-sm text-gray-600">{mandate.property.city}</p>
                                            )}
                                            {mandate.property.price && (
                                                <p className="text-lg font-semibold text-green-600">
                                                    {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(mandate.property.price)}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">ID: {mandate.propertyId}</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {mandate._count && mandate._count.transactions > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Transactions liées</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{mandate._count.transactions}</p>
                                    <p className="text-sm text-gray-600">transaction(s)</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
