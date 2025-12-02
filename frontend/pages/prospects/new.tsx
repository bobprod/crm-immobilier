import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/modules/core/layout/components/Layout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import apiClient from '@/shared/utils/backend-api';

export default function NewProspectPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [type, setType] = React.useState<string>('buyer');
    const [source, setSource] = React.useState<string>('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const budgetStr = formData.get('budget') as string;

        const data = {
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string || undefined,
            type: type, // Required field: buyer, seller, tenant, owner
            source: source || undefined,
            budget: budgetStr ? parseInt(budgetStr, 10) : undefined,
            notes: formData.get('notes') as string || undefined,
        };

        try {
            console.log('Creating prospect:', data);
            await apiClient.post('/prospects', data);

            // Redirect back to prospects list on success
            router.push('/prospects');
        } catch (err: any) {
            console.error('Error creating prospect:', err);
            const message = err.response?.data?.message || err.message || 'Erreur lors de la création du prospect';
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
                        Retour aux prospects
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Nouveau Prospect</h1>
                </div>

                <Card className="max-w-2xl">
                    <CardContent className="pt-6">
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="text-red-700 text-sm">{error}</div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Prénom *</Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        placeholder="Jean"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Nom *</Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        placeholder="Dupont"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="jean.dupont@example.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Téléphone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="+216 XX XXX XXX"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Type de prospect *</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="buyer">Acheteur</SelectItem>
                                        <SelectItem value="seller">Vendeur</SelectItem>
                                        <SelectItem value="tenant">Locataire</SelectItem>
                                        <SelectItem value="owner">Propriétaire</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="source">Source</Label>
                                <Select value={source} onValueChange={setSource}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner une source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="website">Site web</SelectItem>
                                        <SelectItem value="referral">Recommandation</SelectItem>
                                        <SelectItem value="social">Réseaux sociaux</SelectItem>
                                        <SelectItem value="phone">Appel téléphonique</SelectItem>
                                        <SelectItem value="prospecting">Prospection IA</SelectItem>
                                        <SelectItem value="other">Autre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="budget">Budget (€)</Label>
                                <Input
                                    id="budget"
                                    name="budget"
                                    type="number"
                                    placeholder="250000"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    placeholder="Informations complémentaires sur le prospect..."
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="flex gap-2 justify-end pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                >
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Création...' : 'Créer le prospect'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
