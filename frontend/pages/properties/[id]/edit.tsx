import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../src/shared/components/ui/card';
import { Button } from '../../../src/shared/components/ui/button';
import { Input } from '../../../src/shared/components/ui/input';
import { Label } from '../../../src/shared/components/ui/label';
import { Textarea } from '../../../src/shared/components/ui/textarea';
import { Building2, Save, X, ArrowLeft } from 'lucide-react';
import { propertiesAPI, Property } from '../../../src/shared/utils/properties-api';

export default function EditPropertyPage() {
    const router = useRouter();
    const { id } = router.query;
    const [loading, setLoading] = useState(false);
    const [loadingProperty, setLoadingProperty] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [property, setProperty] = useState<Property | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'apartment',
        category: 'sale',
        status: 'available',
        price: '',
        area: '',
        bedrooms: '',
        bathrooms: '',
        address: '',
        city: '',
        delegation: '',
        zipCode: '',
        priority: 'medium',
        notes: '',
        netPrice: '',
        fees: '',
        feesPercentage: '',
    });

    useEffect(() => {
        if (id && typeof id === 'string') {
            loadProperty(id);
        }
    }, [id]);

    const loadProperty = async (propertyId: string) => {
        try {
            setLoadingProperty(true);
            const data = await propertiesAPI.getById(propertyId);
            setProperty(data);

            // Populate form with existing data
            setFormData({
                title: data.title || '',
                description: data.description || '',
                type: data.type || 'apartment',
                category: data.category || 'sale',
                status: data.status || 'available',
                price: data.price?.toString() || '',
                area: (data.area || data.surface)?.toString() || '',
                bedrooms: data.bedrooms?.toString() || '',
                bathrooms: data.bathrooms?.toString() || '',
                address: data.address || '',
                city: data.city || '',
                delegation: data.delegation || '',
                zipCode: data.zipCode || '',
                priority: data.priority || 'medium',
                notes: data.notes || '',
                netPrice: data.netPrice?.toString() || '',
                fees: data.fees?.toString() || '',
                feesPercentage: data.feesPercentage?.toString() || '',
            });
        } catch (err: any) {
            console.error('Error loading property:', err);
            setError(err?.message || 'Erreur lors du chargement');
        } finally {
            setLoadingProperty(false);
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
                    updates.netPrice = (price - parseFloat(updates.fees)).toFixed(2);
                }
            }

            return { ...prev, ...updates };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || typeof id !== 'string') return;

        setLoading(true);
        setError(null);

        try {
            const updateData = {
                title: formData.title,
                description: formData.description || undefined,
                type: formData.type,
                category: formData.category as 'sale' | 'rent',
                status: formData.status as 'available' | 'reserved' | 'sold' | 'rented',
                price: parseFloat(formData.price),
                area: formData.area ? parseFloat(formData.area) : undefined,
                bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
                bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
                address: formData.address || undefined,
                city: formData.city || undefined,
                delegation: formData.delegation || undefined,
                zipCode: formData.zipCode || undefined,
                priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
                notes: formData.notes || undefined,
                netPrice: formData.netPrice ? parseFloat(formData.netPrice) : undefined,
                fees: formData.fees ? parseFloat(formData.fees) : undefined,
                feesPercentage: formData.feesPercentage ? parseFloat(formData.feesPercentage) : undefined,
            };

            await propertiesAPI.update(id, updateData);
            router.push(`/properties/${id}`);
        } catch (err: any) {
            console.error('Error updating property:', err);
            setError(err?.message || 'Erreur lors de la mise a jour');
        } finally {
            setLoading(false);
        }
    };

    if (loadingProperty) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    if (!property) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-red-500 mb-4">{error || 'Propriete non trouvee'}</p>
                    <Button onClick={() => router.push('/properties')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour aux proprietes
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Modifier la Propriete</h1>
                        <p className="text-gray-600 mt-1">{property.title}</p>
                    </div>
                    <Button variant="outline" onClick={() => router.push(`/properties/${id}`)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                    </Button>
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
                                    <Building2 className="h-5 w-5 mr-2" />
                                    Informations de la Propriete
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Title */}
                                <div className="space-y-2">
                                    <Label htmlFor="title">Titre *</Label>
                                    <Input
                                        id="title"
                                        type="text"
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
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        disabled={loading}
                                        rows={4}
                                    />
                                </div>

                                {/* Type, Category, Status */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Type *</Label>
                                        <select
                                            id="type"
                                            value={formData.type}
                                            onChange={(e) => handleChange('type', e.target.value)}
                                            required
                                            disabled={loading}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="apartment">Appartement</option>
                                            <option value="house">Maison</option>
                                            <option value="villa">Villa</option>
                                            <option value="studio">Studio</option>
                                            <option value="land">Terrain</option>
                                            <option value="commercial">Commercial</option>
                                            <option value="office">Bureau</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category">Categorie *</Label>
                                        <select
                                            id="category"
                                            value={formData.category}
                                            onChange={(e) => handleChange('category', e.target.value)}
                                            required
                                            disabled={loading}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="sale">Vente</option>
                                            <option value="rent">Location</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Statut</Label>
                                        <select
                                            id="status"
                                            value={formData.status}
                                            onChange={(e) => handleChange('status', e.target.value)}
                                            disabled={loading}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="available">Disponible</option>
                                            <option value="reserved">Reserve</option>
                                            <option value="sold">Vendu</option>
                                            <option value="rented">Loue</option>
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
                                            value={formData.price}
                                            onChange={(e) => handleChange('price', e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="area">Surface (m2)</Label>
                                        <Input
                                            id="area"
                                            type="number"
                                            value={formData.area}
                                            onChange={(e) => handleChange('area', e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {/* Bedrooms and Bathrooms */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="bedrooms">Chambres</Label>
                                        <Input
                                            id="bedrooms"
                                            type="number"
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
                                            value={formData.bathrooms}
                                            onChange={(e) => handleChange('bathrooms', e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Priorite</Label>
                                        <select
                                            id="priority"
                                            value={formData.priority}
                                            onChange={(e) => handleChange('priority', e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="low">Basse</option>
                                            <option value="medium">Moyenne</option>
                                            <option value="high">Haute</option>
                                            <option value="urgent">Urgente</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="space-y-2">
                                    <Label htmlFor="address">Adresse</Label>
                                    <Input
                                        id="address"
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => handleChange('address', e.target.value)}
                                        disabled={loading}
                                    />
                                </div>

                                {/* City, Delegation, ZipCode */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Ville</Label>
                                        <Input
                                            id="city"
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => handleChange('city', e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="delegation">Delegation</Label>
                                        <Input
                                            id="delegation"
                                            type="text"
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
                                            value={formData.zipCode}
                                            onChange={(e) => handleChange('zipCode', e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes internes</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => handleChange('notes', e.target.value)}
                                        disabled={loading}
                                        rows={3}
                                    />
                                </div>

                                {/* Financial */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="feesPercentage">% Honoraires</Label>
                                        <Input
                                            id="feesPercentage"
                                            type="number"
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
                                onClick={() => router.push(`/properties/${id}`)}
                                disabled={loading}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Annuler
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Enregistrer
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
