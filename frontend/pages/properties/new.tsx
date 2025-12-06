import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/modules/core/layout/components/Layout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import apiClient from '@/shared/utils/backend-api';

export default function NewPropertyPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [propertyType, setPropertyType] = React.useState<string>('apartment');
    const [category, setCategory] = React.useState<string>('sale');
    const [status, setStatus] = React.useState<string>('available');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        const data = {
            title: formData.get('title') as string,
            description: formData.get('description') as string || undefined,
            type: propertyType,
            category: category,
            price: parseFloat(formData.get('price') as string),
            currency: formData.get('currency') as string || 'TND',
            area: formData.get('area') ? parseFloat(formData.get('area') as string) : undefined,
            bedrooms: formData.get('bedrooms') ? parseInt(formData.get('bedrooms') as string) : undefined,
            bathrooms: formData.get('bathrooms') ? parseInt(formData.get('bathrooms') as string) : undefined,
            address: formData.get('address') as string || undefined,
            city: formData.get('city') as string || undefined,
            delegation: formData.get('delegation') as string || undefined,
            zipCode: formData.get('zipCode') as string || undefined,
            status: status,
        };

        try {
            console.log('Creating property:', data);
            await apiClient.post('/properties', data);
            router.push('/properties');
        } catch (err: any) {
            console.error('Error creating property:', err);
            const message = err.response?.data?.message || err.message || 'Erreur lors de la création de la propriété';
            setError(Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        size="sm"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour aux propriétés
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Nouvelle Propriété</h1>
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
                                    <label htmlFor="title" className="text-sm font-medium">
                                        Titre *
                                    </label>
                                    <Input
                                        id="title"
                                        name="title"
                                        placeholder="Ex: Bel appartement au centre ville"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="description" className="text-sm font-medium">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        placeholder="Description détaillée du bien..."
                                        className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Type de bien *</label>
                                        <Select value={propertyType} onValueChange={setPropertyType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="apartment">Appartement</SelectItem>
                                                <SelectItem value="house">Maison</SelectItem>
                                                <SelectItem value="villa">Villa</SelectItem>
                                                <SelectItem value="studio">Studio</SelectItem>
                                                <SelectItem value="office">Bureau</SelectItem>
                                                <SelectItem value="land">Terrain</SelectItem>
                                                <SelectItem value="commercial">Commercial</SelectItem>
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
                                                <SelectItem value="rent">Location</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Prix et surface */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Prix et caractéristiques</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="price" className="text-sm font-medium">
                                            Prix *
                                        </label>
                                        <Input
                                            id="price"
                                            name="price"
                                            type="number"
                                            placeholder="250000"
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

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="area" className="text-sm font-medium">
                                            Surface (m²)
                                        </label>
                                        <Input
                                            id="area"
                                            name="area"
                                            type="number"
                                            placeholder="120"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="bedrooms" className="text-sm font-medium">
                                            Chambres
                                        </label>
                                        <Input
                                            id="bedrooms"
                                            name="bedrooms"
                                            type="number"
                                            placeholder="3"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="bathrooms" className="text-sm font-medium">
                                            Salles de bain
                                        </label>
                                        <Input
                                            id="bathrooms"
                                            name="bathrooms"
                                            type="number"
                                            placeholder="2"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Localisation */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Localisation</h2>

                                <div className="space-y-2">
                                    <label htmlFor="address" className="text-sm font-medium">
                                        Adresse
                                    </label>
                                    <Input
                                        id="address"
                                        name="address"
                                        placeholder="12 Avenue Habib Bourguiba"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="city" className="text-sm font-medium">
                                            Ville
                                        </label>
                                        <Input
                                            id="city"
                                            name="city"
                                            placeholder="Tunis"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="delegation" className="text-sm font-medium">
                                            Délégation
                                        </label>
                                        <Input
                                            id="delegation"
                                            name="delegation"
                                            placeholder="Carthage"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="zipCode" className="text-sm font-medium">
                                            Code postal
                                        </label>
                                        <Input
                                            id="zipCode"
                                            name="zipCode"
                                            placeholder="2016"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Statut */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Statut</h2>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Statut de la propriété</label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="available">Disponible</SelectItem>
                                            <SelectItem value="reserved">Réservé</SelectItem>
                                            <SelectItem value="sold">Vendu</SelectItem>
                                            <SelectItem value="rented">Loué</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    {loading ? 'Création en cours...' : 'Créer la propriété'}
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
        </Layout>
    );
}
