import React from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ArrowLeft, AlertCircle, Info } from 'lucide-react';
import apiClient from '@/shared/utils/backend-api';

export default function NewTransactionPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [transactionType, setTransactionType] = React.useState<string>('sale');
    const [status, setStatus] = React.useState<string>('offer_received');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        const data = {
            reference: formData.get('reference') as string,
            type: transactionType,
            propertyId: formData.get('propertyId') as string,
            prospectId: formData.get('prospectId') as string,
            mandateId: formData.get('mandateId') as string || undefined,
            status: status,
            offerPrice: parseFloat(formData.get('offerPrice') as string),
            currency: formData.get('currency') as string || 'TND',
            expectedClosing: formData.get('expectedClosing') as string || undefined,
            notes: formData.get('notes') as string || undefined,
        };

        try {
            console.log('Creating transaction:', data);
            await apiClient.post('/transactions', data);
            router.push('/transactions');
        } catch (err: any) {
            console.error('Error creating transaction:', err);
            const message = err.response?.data?.message || err.message || 'Erreur lors de la création de la transaction';
            setError(Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setLoading(false);
        }
    };

    // Générer une référence automatique
    const generateReference = () => {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `TRX-${year}-${random}`;
    };

    React.useEffect(() => {
        const refInput = document.getElementById('reference') as HTMLInputElement;
        if (refInput && !refInput.value) {
            refInput.value = generateReference();
        }
    }, []);

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
                        Retour aux transactions
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Nouvelle Transaction</h1>
                </div>

                <Card className="max-w-4xl">
                    <CardContent className="pt-6">
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="text-red-700 text-sm">{error}</div>
                            </div>
                        )}

                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="text-blue-700 text-sm">
                                <p className="font-medium mb-1">Comment trouver les IDs ?</p>
                                <p>• ID Propriété : Allez dans Propriétés, cliquez sur une propriété, l'ID est dans l'URL</p>
                                <p>• ID Prospect : Allez dans Prospects, cliquez sur un prospect, l'ID est dans l'URL</p>
                                <p>• ID Mandat (optionnel) : Allez dans Mandats, cliquez sur un mandat, l'ID est dans l'URL</p>
                            </div>
                        </div>

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
                                        placeholder="TRX-2025-0001"
                                        required
                                    />
                                    <p className="text-xs text-gray-500">Référence unique de la transaction (générée automatiquement)</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Type de transaction *</label>
                                        <Select value={transactionType} onValueChange={setTransactionType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sale">Vente</SelectItem>
                                                <SelectItem value="rent">Location</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Statut *</label>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="offer_received">Offre Reçue</SelectItem>
                                                <SelectItem value="offer_accepted">Offre Acceptée</SelectItem>
                                                <SelectItem value="promise_signed">Promesse Signée</SelectItem>
                                                <SelectItem value="compromis_signed">Compromis Signé</SelectItem>
                                                <SelectItem value="final_deed_signed">Acte Final Signé</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Relations */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Propriété et Prospect</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="propertyId" className="text-sm font-medium">
                                            ID Propriété *
                                        </label>
                                        <Input
                                            id="propertyId"
                                            name="propertyId"
                                            placeholder="clxxx..."
                                            required
                                        />
                                        <p className="text-xs text-gray-500">Copiez l'ID depuis la page de la propriété</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="prospectId" className="text-sm font-medium">
                                            ID Prospect *
                                        </label>
                                        <Input
                                            id="prospectId"
                                            name="prospectId"
                                            placeholder="clxxx..."
                                            required
                                        />
                                        <p className="text-xs text-gray-500">Copiez l'ID depuis la page du prospect</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="mandateId" className="text-sm font-medium">
                                        ID Mandat (optionnel)
                                    </label>
                                    <Input
                                        id="mandateId"
                                        name="mandateId"
                                        placeholder="clxxx..."
                                    />
                                    <p className="text-xs text-gray-500">Lien optionnel avec un mandat existant</p>
                                </div>
                            </div>

                            {/* Prix */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Prix et Dates</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="offerPrice" className="text-sm font-medium">
                                            Prix de l'offre *
                                        </label>
                                        <Input
                                            id="offerPrice"
                                            name="offerPrice"
                                            type="number"
                                            placeholder="450000"
                                            required
                                            step="0.01"
                                        />
                                        <p className="text-xs text-gray-500">Prix proposé par le prospect</p>
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

                                <div className="space-y-2">
                                    <label htmlFor="expectedClosing" className="text-sm font-medium">
                                        Date de clôture prévue
                                    </label>
                                    <Input
                                        id="expectedClosing"
                                        name="expectedClosing"
                                        type="date"
                                    />
                                    <p className="text-xs text-gray-500">Date estimée de signature finale</p>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Notes</h2>

                                <div className="space-y-2">
                                    <label htmlFor="notes" className="text-sm font-medium">
                                        Notes additionnelles
                                    </label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        placeholder="Informations complémentaires sur la transaction..."
                                        className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    {loading ? 'Création en cours...' : 'Créer la transaction'}
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
