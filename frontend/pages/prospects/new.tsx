import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/modules/core/layout/components/Layout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ArrowLeft } from 'lucide-react';

export default function NewProspectPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            source: formData.get('source'),
            budget: formData.get('budget'),
            notes: formData.get('notes'),
        };

        try {
            // TODO: Call API to create prospect
            console.log('Creating prospect:', data);

            // Redirect back to prospects list
            setTimeout(() => {
                router.push('/prospects');
            }, 500);
        } catch (error) {
            console.error('Error creating prospect:', error);
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
                                <Label htmlFor="phone">Téléphone *</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="+33 6 12 34 56 78"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="source">Source</Label>
                                <Select name="source">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner une source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="website">Site web</SelectItem>
                                        <SelectItem value="referral">Recommandation</SelectItem>
                                        <SelectItem value="social">Réseaux sociaux</SelectItem>
                                        <SelectItem value="phone">Appel téléphonique</SelectItem>
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
