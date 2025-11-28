import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Building2, Save, X, User, DollarSign } from 'lucide-react';
import { propertiesAPI } from '@/shared/utils/properties-api';
import { prospectsEnhancedAPI } from '@/shared/utils/prospects-enhanced-api';

export default function NewPropertyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prospects, setProspects] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'apartment' as 'house' | 'apartment' | 'land' | 'commercial',
        category: 'sale',
        price: '',
        area: '',
        bedrooms: '',
        bathrooms: '',
        address: '',
        city: '',
        delegation: '',
        zipCode: '',
        latitude: '',
        longitude: '',
        priority: 'medium',
        notes: '',
        tags: '',
        ownerId: '',
        netPrice: '',
        fees: '',
        feesPercentage: '',
    });

    useEffect(() => {
        loadProspects();
    }, []);

    const loadProspects = async () => {
        try {
            // Fetch all prospects or filter by type if needed
            const data = await prospectsEnhancedAPI.smartSearch({});
            setProspects(data.results || []);
        } catch (err) {
            console.error('Error loading prospects:', err);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => {
            const updates: any = { [field]: value };

            // Auto-calculate fees if price and percentage change
            if (field === 'price' || field === 'feesPercentage') {
                const price = field === 'price' ? parseFloat(value) : parseFloat(prev.price);
                const pct = field === 'feesPercentage' ? parseFloat(value) : parseFloat(prev.feesPercentage);
                if (!isNaN(price) && !isNaN(pct)) {
                    updates.fees = ((price * pct) / 100).toFixed(2);
                    updates.netPrice = (price - updates.fees).toFixed(2);
                }
            }

            return { ...prev, ...updates };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const propertyData = {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                category: formData.category,
                price: parseFloat(formData.price),
                area: parseFloat(formData.area),
                bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
                bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
                address: formData.address,
                city: formData.city,
                delegation: formData.delegation,
                zipCode: formData.zipCode,
                latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
                longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
                priority: formData.priority,
                notes: formData.notes,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
                ownerId: formData.ownerId || undefined,
                netPrice: formData.netPrice ? parseFloat(formData.netPrice) : undefined,
                fees: formData.fees ? parseFloat(formData.fees) : undefined,
                feesPercentage: formData.feesPercentage ? parseFloat(formData.feesPercentage) : undefined,
            };

            await propertiesAPI.create(propertyData as any);
            router.push('/properties');
        } catch (err: any) {
            console.error('Error creating property:', err);
            setError(err?.message || 'Erreur lors de la création de la propriété');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Nouvelle Propriété</h1>
                        <p className="text-gray-600 mt-1">
                            Ajoutez une nouvelle propriété à votre catalogue
                        </p>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <User className="h-5 w-5 mr-2" />
                                    Propriétaire (Vendeur)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="ownerId">Sélectionner un propriétaire</Label>
                                    <select
                                        id="ownerId"
                                        value={formData.ownerId}
                                        onChange={(e) => handleChange('ownerId', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <option value="">-- Aucun propriétaire --</option>
                                        {prospects.map((prospect) => (
                                            <option key={prospect.id} value={prospect.id}>
                                                {prospect.firstName} {prospect.lastName} ({prospect.email || prospect.phone})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-sm text-gray-500">
                                        Le propriétaire doit d'abord être créé en tant que prospect.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Building2 className="h-5 w-5 mr-2" />
                                    Informations de la Propriété
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Title */}
                                <div className="space-y-2">
                                    <Label htmlFor="title">Titre *</Label>
                                    <Input
                                        id="title"
                                        type="text"
                                        placeholder="Ex: Appartement 3 pièces centre-ville"
                                        value={formData.title}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Décrivez la propriété..."
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        disabled={loading}
                                        rows={4}
                                    />
                                </div>

                                {/* Type and Category */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Type *</Label>
                                        <select
                                            id="type"
                                            value={formData.type}
                                            onChange={(e) => handleChange('type', e.target.value)}
                                            required
                                            disabled={loading}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            <option value="apartment">Appartement</option>
                                            <option value="house">Maison</option>
                                            <option value="land">Terrain</option>
                                            <option value="commercial">Commercial</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category">Catégorie *</Label>
                                        <select
                                            id="category"
                                            value={formData.category}
                                            onChange={(e) => handleChange('category', e.target.value)}
                                            required
                                            disabled={loading}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            <option value="sale">Vente</option>
                                            <option value="rent">Location</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Price and Area */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Prix (TND) *</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            placeholder="Ex: 250000"
                                            value={formData.price}
                                            onChange={(e) => handleChange('price', e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="area">Surface (m²) *</Label>
                                        <Input
                                            id="area"
                                            type="number"
                                            placeholder="Ex: 120"
                                            value={formData.area}
                                            onChange={(e) => handleChange('area', e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {/* Bedrooms and Bathrooms */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="bedrooms">Chambres</Label>
                                        <Input
                                            id="bedrooms"
                                            type="number"
                                            placeholder="Ex: 3"
                                            value={formData.bedrooms}
                                            onChange={(e) => handleChange('bedrooms', e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bathrooms">Salles de bain</Label>
                                        <Input
                                            id="bathrooms"
                                            type="number"
                                            placeholder="Ex: 2"
                                            value={formData.bathrooms}
                                            onChange={(e) => handleChange('bathrooms', e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {/* Priority and Status */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Priorité</Label>
                                        <select
                                            id="priority"
                                            value={formData.priority}
                                            onChange={(e) => handleChange('priority', e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            <option value="medium">Moyenne</option>
                                            <option value="low">Basse</option>
                                            <option value="high">Haute</option>
                                            <option value="urgent">Urgente</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes internes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Notes privées sur la propriété..."
                                        value={formData.notes}
                                        onChange={(e) => handleChange('notes', e.target.value)}
                                        disabled={loading}
                                        rows={3}
                                    />
                                </div>

                                {/* Address */}
                                <div className="space-y-2">
                                    <Label htmlFor="address">Adresse *</Label>
                                    <Input
                                        id="address"
                                        type="text"
                                        placeholder="Ex: 123 Avenue Habib Bourguiba"
                                        value={formData.address}
                                        onChange={(e) => handleChange('address', e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                {/* City, Delegation, ZipCode */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Ville *</Label>
                                        <Input
                                            id="city"
                                            type="text"
                                            placeholder="Ex: Tunis"
                                            value={formData.city}
                                            onChange={(e) => handleChange('city', e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="delegation">Délégation</Label>
                                        <Input
                                            id="delegation"
                                            type="text"
                                            placeholder="Ex: La Marsa"
                                            value={formData.delegation}
                                            onChange={(e) => handleChange('delegation', e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="zipCode">Code Postal</Label>
                                        <Input
                                            id="zipCode"
                                            type="text"
                                            placeholder="Ex: 2070"
                                            value={formData.zipCode}
                                            onChange={(e) => handleChange('zipCode', e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {/* Coordinates */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="latitude">Latitude</Label>
                                        <Input
                                            id="latitude"
                                            type="number"
                                            step="any"
                                            placeholder="Ex: 36.8065"
                                            value={formData.latitude}
                                            onChange={(e) => handleChange('latitude', e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="longitude">Longitude</Label>
                                        <Input
                                            id="longitude"
                                            type="number"
                                            step="any"
                                            placeholder="Ex: 10.1815"
                                            value={formData.longitude}
                                            onChange={(e) => handleChange('longitude', e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <DollarSign className="h-5 w-5 mr-2" />
                                    Détails Financiers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="feesPercentage">% Honoraires</Label>
                                        <Input
                                            id="feesPercentage"
                                            type="number"
                                            placeholder="Ex: 2"
                                            value={formData.feesPercentage}
                                            onChange={(e) => handleChange('feesPercentage', e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fees">Montant Honoraires</Label>
                                        <Input
                                            id="fees"
                                            type="number"
                                            placeholder="Calculé automatiquement"
                                            value={formData.fees}
                                            onChange={(e) => handleChange('fees', e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="netPrice">Net Vendeur</Label>
                                        <Input
                                            id="netPrice"
                                            type="number"
                                            placeholder="Calculé automatiquement"
                                            value={formData.netPrice}
                                            onChange={(e) => handleChange('netPrice', e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex gap-3 justify-end pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/properties')}
                                disabled={loading}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Annuler
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Création...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Créer la Propriété
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </Layout >
    );
}
