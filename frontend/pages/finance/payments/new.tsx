import React from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import apiClient from '@/shared/utils/backend-api';

export default function NewPaymentPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = React.useState<string>('bank_transfer');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        const data = {
            invoiceId: formData.get('invoiceId') as string || undefined,
            commissionId: formData.get('commissionId') as string || undefined,
            amount: parseFloat(formData.get('amount') as string),
            currency: formData.get('currency') as string || 'TND',
            method: paymentMethod,
            reference: formData.get('reference') as string || undefined,
            paidAt: formData.get('paidAt') as string || undefined,
            notes: formData.get('notes') as string || undefined,
        };

        // Validation: au moins un des deux (invoiceId ou commissionId) doit être rempli
        if (!data.invoiceId && !data.commissionId) {
            setError('Vous devez spécifier soit un ID de facture, soit un ID de commission');
            setLoading(false);
            return;
        }

        try {
            console.log('Creating payment:', data);
            await apiClient.post('/finance/payments', data);
            router.push('/finance');
        } catch (err: any) {
            console.error('Error creating payment:', err);
            const message = err.response?.data?.message || err.message || 'Erreur lors de la création du paiement';
            setError(Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setLoading(false);
        }
    };

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
                        Retour aux paiements
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Nouveau Paiement</h1>
                </div>

                <Card className="max-w-3xl">
                    <CardContent className="pt-6">
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="text-red-700 text-sm">{error}</div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Lien avec facture ou commission */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Lien avec Facture ou Commission</h2>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-700">
                                        <strong>Note:</strong> Vous devez spécifier soit une facture, soit une commission (ou les deux).
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="invoiceId" className="text-sm font-medium">
                                            ID Facture
                                        </label>
                                        <Input
                                            id="invoiceId"
                                            name="invoiceId"
                                            placeholder="clxxx..."
                                        />
                                        <p className="text-xs text-gray-500">ID de la facture à payer</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="commissionId" className="text-sm font-medium">
                                            ID Commission
                                        </label>
                                        <Input
                                            id="commissionId"
                                            name="commissionId"
                                            placeholder="clxxx..."
                                        />
                                        <p className="text-xs text-gray-500">ID de la commission à payer</p>
                                    </div>
                                </div>
                            </div>

                            {/* Montant et devise */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Montant</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="amount" className="text-sm font-medium">
                                            Montant *
                                        </label>
                                        <Input
                                            id="amount"
                                            name="amount"
                                            type="number"
                                            placeholder="5000"
                                            required
                                            step="0.01"
                                        />
                                        <p className="text-xs text-gray-500">Montant payé</p>
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
                            </div>

                            {/* Méthode de paiement */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Méthode de Paiement</h2>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Méthode *</label>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Espèces</SelectItem>
                                            <SelectItem value="check">Chèque</SelectItem>
                                            <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                                            <SelectItem value="credit_card">Carte bancaire</SelectItem>
                                            <SelectItem value="other">Autre</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="reference" className="text-sm font-medium">
                                        Référence
                                    </label>
                                    <Input
                                        id="reference"
                                        name="reference"
                                        placeholder="Numéro de chèque, référence de virement..."
                                    />
                                    <p className="text-xs text-gray-500">Référence du paiement (numéro de chèque, transaction, etc.)</p>
                                </div>
                            </div>

                            {/* Date de paiement */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Date de Paiement</h2>

                                <div className="space-y-2">
                                    <label htmlFor="paidAt" className="text-sm font-medium">
                                        Date du paiement
                                    </label>
                                    <Input
                                        id="paidAt"
                                        name="paidAt"
                                        type="date"
                                    />
                                    <p className="text-xs text-gray-500">Par défaut: aujourd'hui</p>
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
                                        placeholder="Notes sur ce paiement..."
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
                                    {loading ? 'Création en cours...' : 'Enregistrer le paiement'}
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
