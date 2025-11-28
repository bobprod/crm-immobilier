import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';

export default function NewAppointmentPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            title: formData.get('title'),
            date: formData.get('date'),
            time: formData.get('time'),
            location: formData.get('location'),
            notes: formData.get('notes'),
        };

        try {
            // TODO: Call API to create appointment
            console.log('Creating appointment:', data);

            // Redirect back to appointments list
            setTimeout(() => {
                router.push('/appointments');
            }, 500);
        } catch (error) {
            console.error('Error creating appointment:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get today's date in YYYY-MM-DD format for min attribute
    const today = new Date().toISOString().split('T')[0];

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
                        Retour
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Nouveau Rendez-vous</h1>
                </div>

                <Card className="max-w-2xl">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Titre *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="Ex: Visite appartement Paris 15ème"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date *</Label>
                                    <Input
                                        id="date"
                                        name="date"
                                        type="date"
                                        min={today}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="time">Heure *</Label>
                                    <Input
                                        id="time"
                                        name="time"
                                        type="time"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Lieu</Label>
                                <Input
                                    id="location"
                                    name="location"
                                    placeholder="Adresse du rendez-vous"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    placeholder="Informations complémentaires..."
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
                                    {loading ? 'Création...' : 'Créer le rendez-vous'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
