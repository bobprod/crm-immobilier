import React from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ArrowLeft, AlertCircle, Info } from 'lucide-react';
import apiClient from '@/shared/utils/backend-api';

export default function NewMandatePage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [mandateType, setMandateType] = React.useState<string>('exclusive');
    const [category, setCategory] = React.useState<string>('sale');
    const [commissionType, setCommissionType] = React.useState<string>('percentage');

    // Owner and property search
    const [owners, setOwners] = React.useState<any[]>([]);
    const [properties, setProperties] = React.useState<any[]>([]);
    const [selectedOwnerId, setSelectedOwnerId] = React.useState<string>('');
    const [selectedPropertyId, setSelectedPropertyId] = React.useState<string>('');
    const [ownerSearch, setOwnerSearch] = React.useState('');
    const [propertySearch, setPropertySearch] = React.useState('');

    // Pre-fill from URL params (e.g. /mandates/new?ownerId=xxx)
    React.useEffect(() => {
        if (router.query.ownerId) setSelectedOwnerId(router.query.ownerId as string);
        if (router.query.propertyId) setSelectedPropertyId(router.query.propertyId as string);
    }, [router.query]);

    // Fetch owners and properties on mount
    React.useEffect(() => {
        apiClient.get('/owners').then(r => setOwners(r.data || [])).catch(() => { });
        apiClient.get('/properties').then(r => {
            const data = r.data;
            setProperties(Array.isArray(data) ? data : data?.data || []);
        }).catch(() => { });
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        const data = {
            ownerId: selectedOwnerId || formData.get('ownerId') as string,
            propertyId: selectedPropertyId || formData.get('propertyId') as string || undefined,
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
            console.log('Creating mandate:', data);
            await apiClient.post('/mandates', data);
            router.push('/mandates');
        } catch (err: any) {
            console.error('Error creating mandate:', err);
            const message = err.response?.data?.message || err.message || 'Erreur lors de la création du mandat';
            setError(Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setLoading(false);
        }
    };

    // Générer une référence automatique
    const generateReference = () => {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `MAN-${year}-${random}`;
    };

    React.useEffect(() => {
        const refInput = document.getElementById('reference') as HTMLInputElement;
        if (refInput && !refInput.value) {
            refInput.value = generateReference();
        }
    }, []);

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
                        Retour aux mandats
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Nouveau Mandat</h1>
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
                                        placeholder="MAN-2025-0001"
                                        required
                                    />
                                    <p className="text-xs text-gray-500">Référence unique du mandat (générée automatiquement)</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Type de mandat *</label>
                                        <Select value={mandateType} onValueChange={setMandateType}>
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
                                        <Select value={category} onValueChange={setCategory}>
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
                                        <label className="text-sm font-medium">
                                            Propriétaire *
                                        </label>
                                        {owners.length > 0 ? (
                                            <>
                                                <Input
                                                    placeholder="Rechercher un propriétaire..."
                                                    value={ownerSearch}
                                                    onChange={e => setOwnerSearch(e.target.value)}
                                                    className="mb-1"
                                                />
                                                <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner un propriétaire" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {owners
                                                            .filter((o: any) => {
                                                                if (!o.id) return false;
                                                                if (!ownerSearch) return true;
                                                                const q = ownerSearch.toLowerCase();
                                                                return (o.firstName || '').toLowerCase().includes(q) ||
                                                                    (o.lastName || '').toLowerCase().includes(q) ||
                                                                    (o.email || '').toLowerCase().includes(q);
                                                            })
                                                            .map((o: any) => (
                                                                <SelectItem key={o.id} value={o.id}>
                                                                    {o.firstName} {o.lastName} {o.email ? `(${o.email})` : ''}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </>
                                        ) : (
                                            <div className="text-sm text-gray-500">
                                                <Input
                                                    name="ownerId"
                                                    placeholder="ID du propriétaire (clxxx...)"
                                                    value={selectedOwnerId}
                                                    onChange={e => setSelectedOwnerId(e.target.value)}
                                                    required
                                                />
                                                <p className="text-xs mt-1">Aucun propriétaire trouvé. <a href="/owners/new" className="text-blue-600 underline">Créer un propriétaire</a></p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Propriété (optionnel)
                                        </label>
                                        {properties.length > 0 ? (
                                            <>
                                                <Input
                                                    placeholder="Rechercher une propriété..."
                                                    value={propertySearch}
                                                    onChange={e => setPropertySearch(e.target.value)}
                                                    className="mb-1"
                                                />
                                                <Select value={selectedPropertyId} onValueChange={(v) => setSelectedPropertyId(v === '__none__' ? '' : v)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner une propriété" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__none__">Aucune</SelectItem>
                                                        {properties
                                                            .filter((p: any) => {
                                                                if (!p.id) return false;
                                                                if (!propertySearch) return true;
                                                                const q = propertySearch.toLowerCase();
                                                                return (p.title || '').toLowerCase().includes(q) ||
                                                                    (p.city || '').toLowerCase().includes(q) ||
                                                                    (p.address || '').toLowerCase().includes(q);
                                                            })
                                                            .map((p: any) => (
                                                                <SelectItem key={p.id} value={p.id}>
                                                                    {p.title} {p.city ? `- ${p.city}` : ''} {p.price ? `(${p.price.toLocaleString()} TND)` : ''}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </>
                                        ) : (
                                            <Input
                                                name="propertyId"
                                                placeholder="ID propriété (optionnel)"
                                                value={selectedPropertyId}
                                                onChange={e => setSelectedPropertyId(e.target.value)}
                                            />
                                        )}
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
                                            placeholder="500000"
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
                                            placeholder="TND"
                                            defaultValue="TND"
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
                                            placeholder="5"
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
                                            placeholder="5000"
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
                                        placeholder="Conditions particulières..."
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
                                        placeholder="Notes additionnelles..."
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
                                    {loading ? 'Création en cours...' : 'Créer le mandat'}
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
