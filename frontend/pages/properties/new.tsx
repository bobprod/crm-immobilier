import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/shared/components/ui/card';
import { Button } from '../../src/shared/components/ui/button';
import { Input } from '../../src/shared/components/ui/input';
import { Label } from '../../src/shared/components/ui/label';
import { Textarea } from '../../src/shared/components/ui/textarea';
import { Building2, Save, X, User, DollarSign } from 'lucide-react';
import { propertiesAPI } from '../../src/shared/utils/properties-api';

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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/prospects`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setProspects(Array.isArray(data) ? data : data.prospects || []);
            }
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
                    updates.netPrice = (price - parseFloat(updates.fees)).toFixed(2);
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
                description: formData.description || undefined,
                type: formData.type,
                category: formData.category as 'sale' | 'rent',
                price: parseFloat(formData.price),
                area: formData.area ? parseFloat(formData.area) : undefined,
                bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
                bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
                address: formData.address || undefined,
                city: formData.city || undefined,
                delegation: formData.delegation || undefined,
                zipCode: formData.zipCode || undefined,
                latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
                longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
                priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
                notes: formData.notes || undefined,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
                ownerId: formData.ownerId || undefined,
                netPrice: formData.netPrice ? parseFloat(formData.netPrice) : undefined,
                fees: formData.fees ? parseFloat(formData.fees) : undefined,
                feesPercentage: formData.feesPercentage ? parseFloat(formData.feesPercentage) : undefined,
            };

            await propertiesAPI.create(propertyData);
            router.push('/properties');
        } catch (err: any) {
            console.error('Error creating property:', err);
            setError(err?.message || 'Erreur lors de la creation de la propriete');
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
                        <h1 className="text-3xl font-bold text-gray-900">Nouvelle Propriete</h1>
                        <p className="text-gray-600 mt-1">
                            Ajoutez une nouvelle propriete a votre catalogue
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
                                    Proprietaire (Vendeur)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="ownerId">Selectionner un proprietaire</Label>
                                    <select
                                        id="ownerId"
                                        value={formData.ownerId}
                                        onChange={(e) => handleChange('ownerId', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <option value="">-- Aucun proprietaire --</option>
                                        {prospects.map((prospect) => (
                                            <option key={prospect.id} value={prospect.id}>
                                                {prospect.firstName} {prospect.lastName} ({prospect.email || prospect.phone})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-sm text-gray-500">
                                        Le proprietaire doit d&apos;abord etre cree en tant que prospect.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

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
                                        placeholder="Ex: Appartement 3 pieces centre-ville"
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
                                        placeholder="Decrivez la propriete..."
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
                                        <Label htmlFor="area">Surface (m2)</Label>
                                        <Input
                                            id="area"
                                            type="number"
                                            placeholder="Ex: 120"
                                            value={formData.area}
                                            onChange={(e) => handleChange('area', e.target.value)}
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

                                {/* Priority */}
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priorite</Label>
                                    <select
                                        id="priority"
                                        value={formData.priority}
                                        onChange={(e) => handleChange('priority', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <option value="low">Basse</option>
                                        <option value="medium">Moyenne</option>
                                        <option value="high">Haute</option>
                                        <option value="urgent">Urgente</option>
                                    </select>
                                </div>

                                {/* Address */}
                                <div className="space-y-2">
                                    <Label htmlFor="address">Adresse</Label>
                                    <Input
                                        id="address"
                                        type="text"
                                        placeholder="Ex: 123 Avenue Habib Bourguiba"
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
                                            placeholder="Ex: Tunis"
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

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes internes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Notes privees sur la propriete..."
                                        value={formData.notes}
                                        onChange={(e) => handleChange('notes', e.target.value)}
                                        disabled={loading}
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <DollarSign className="h-5 w-5 mr-2" />
                                    Details Financiers
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
                                            placeholder="Calcule automatiquement"
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
                                            placeholder="Calcule automatiquement"
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
                                        Creation...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Creer la Propriete
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
