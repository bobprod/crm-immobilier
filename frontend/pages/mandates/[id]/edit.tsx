import React from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { mandatesAPI, Mandate, MandateType, MandateCategory } from '@/shared/utils/mandates-api';

export default function EditMandatePage() {
    const router = useRouter();
    const { id } = router.query;
    const [loading, setLoading] = React.useState(false);
    const [loadingData, setLoadingData] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [mandate, setMandate] = React.useState<Mandate | null>(null);

    const [mandateType, setMandateType] = React.useState<MandateType>(MandateType.EXCLUSIVE);
    const [category, setCategory] = React.useState<MandateCategory>(MandateCategory.SALE);
    const [commissionType, setCommissionType] = React.useState<string>('percentage');

    React.useEffect(() => {
        if (id) {
            loadMandate();
        }
    }, [id]);

    const loadMandate = async () => {
        try {
            setLoadingData(true);
            const data = await mandatesAPI.getById(id as string);
            setMandate(data);
            setMandateType(data.type as MandateType);
            setCategory(data.category as MandateCategory);
            setCommissionType(data.commissionType);
        } catch (err: any) {
            console.error('Error loading mandate:', err);
            setError('Erreur lors du chargement du mandat');
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        const data = {
            ownerId: formData.get('ownerId') as string,
            propertyId: formData.get('propertyId') as string || undefined,
            reference: formData.get('reference') as string,
            type: mandateType,
            category: category,
            startDate: formData.get('startDate') as string,
            endDate: formData.get('endDate') as string,
            price: parseFloat(formData.get('price') as string),
            currency: formData.get('currency') as string || 'TND',
            commission: parseFloat(formData.get('commission') as string),
            commissionType: commissionType,
            exclusivityBonus: formData.get('exclusivityBonus') ? parseFloat(formData.get('exclusivityBonus') as string) : undefined,
            terms: formData.get('terms') as string || undefined,
            notes: formData.get('notes') as string || undefined,
        };

        try {
            console.log('Updating mandate:', data);
            await mandatesAPI.update(id as string, data);
            router.push(`/mandates/${id}`);
        } catch (err: any) {
            console.error('Error updating mandate:', err);
            const message = err.response?.data?.message || err.message || 'Erreur lors de la modification du mandat';
            setError(Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </MainLayout>
        );
    }

    if (!mandate) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center p-8 text-red-500">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {error || 'Mandat non trouvé'}
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        size="sm"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour au mandat
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Modifier le mandat {mandate.reference}</h1>
                </div>

                <Card className="max-w-4xl">
                    <CardContent className="pt-6">
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="text-red-700 text-sm">{error}</div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Informations de base */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Informations de base</h2>

                                <div className="space-y-2">
                                    <label htmlFor="reference" className="text-sm font-medium">
                                        Référence *
                                    </label>
                                    <Input
                                        id="reference"
                                        name="reference"
                                        defaultValue={mandate.reference}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Type de mandat *</label>
                                        <Select value={mandateType} onValueChange={(value) => setMandateType(value as MandateType)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="exclusive">Exclusif</SelectItem>
                                                <SelectItem value="semi_exclusive">Semi-exclusif</SelectItem>
                                                <SelectItem value="simple">Simple</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Catégorie *</label>
                                        <Select value={category} onValueChange={(value) => setCategory(value as MandateCategory)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sale">Vente</SelectItem>
                                                <SelectItem value="rental">Location</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Relations */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Propriétaire et Bien</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="ownerId" className="text-sm font-medium">
                                            ID Propriétaire *
                                        </label>
                                        <Input
                                            id="ownerId"
                                            name="ownerId"
                                            defaultValue={mandate.ownerId}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="propertyId" className="text-sm font-medium">
                                            ID Propriété (optionnel)
                                        </label>
                                        <Input
                                            id="propertyId"
                                            name="propertyId"
                                            defaultValue={mandate.propertyId || ''}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Période de validité</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="startDate" className="text-sm font-medium">
                                            Date de début *
                                        </label>
                                        <Input
                                            id="startDate"
                                            name="startDate"
                                            type="date"
                                            defaultValue={mandate.startDate.split('T')[0]}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="endDate" className="text-sm font-medium">
                                            Date de fin *
                                        </label>
                                        <Input
                                            id="endDate"
                                            name="endDate"
                                            type="date"
                                            defaultValue={mandate.endDate.split('T')[0]}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Prix et Commission */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Prix et Commission</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="price" className="text-sm font-medium">
                                            Prix du bien *
                                        </label>
                                        <Input
                                            id="price"
                                            name="price"
                                            type="number"
                                            defaultValue={mandate.price}
                                            required
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="currency" className="text-sm font-medium">
                                            Devise
                                        </label>
                                        <Input
                                            id="currency"
                                            name="currency"
                                            defaultValue={mandate.currency}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="commission" className="text-sm font-medium">
                                            Commission *
                                        </label>
                                        <Input
                                            id="commission"
                                            name="commission"
                                            type="number"
                                            defaultValue={mandate.commission}
                                            required
                                            step="0.01"
                                        />
                                        <p className="text-xs text-gray-500">
                                            {commissionType === 'percentage' ? 'Pourcentage (ex: 5 pour 5%)' : 'Montant fixe'}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Type de commission *</label>
                                        <Select value={commissionType} onValueChange={setCommissionType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                                                <SelectItem value="fixed">Montant fixe</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {mandateType === 'exclusive' && (
                                    <div className="space-y-2">
                                        <label htmlFor="exclusivityBonus" className="text-sm font-medium">
                                            Prime d'exclusivité
                                        </label>
                                        <Input
                                            id="exclusivityBonus"
                                            name="exclusivityBonus"
                                            type="number"
                                            defaultValue={mandate.exclusivityBonus || ''}
                                            step="0.01"
                                        />
                                        <p className="text-xs text-gray-500">Prime additionnelle pour mandat exclusif</p>
                                    </div>
                                )}
                            </div>

                            {/* Conditions */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Conditions et Notes</h2>

                                <div className="space-y-2">
                                    <label htmlFor="terms" className="text-sm font-medium">
                                        Conditions du mandat
                                    </label>
                                    <textarea
                                        id="terms"
                                        name="terms"
                                        defaultValue={mandate.terms || ''}
                                        className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="notes" className="text-sm font-medium">
                                        Notes
                                    </label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        defaultValue={mandate.notes || ''}
                                        className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    {loading ? 'Modification en cours...' : 'Enregistrer les modifications'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={loading}
                                >
                                    Annuler
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
