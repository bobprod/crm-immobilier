import React from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ArrowLeft, AlertCircle, Info } from 'lucide-react';
import apiClient from '@/shared/utils/backend-api';

export default function NewCommissionPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [commissionType, setCommissionType] = React.useState<string>('agent');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        const data = {
            transactionId: formData.get('transactionId') as string,
            agentId: formData.get('agentId') as string,
            type: commissionType,
            amount: parseFloat(formData.get('amount') as string),
            percentage: formData.get('percentage') ? parseFloat(formData.get('percentage') as string) : undefined,
            currency: formData.get('currency') as string || 'TND',
            dueDate: formData.get('dueDate') as string || undefined,
            notes: formData.get('notes') as string || undefined,
        };

        try {
            console.log('Creating commission:', data);
            await apiClient.post('/finance/commissions', data);
            router.push('/finance');
        } catch (err: any) {
            console.error('Error creating commission:', err);
            const message = err.response?.data?.message || err.message || 'Erreur lors de la création de la commission';
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
                        Retour aux commissions
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Nouvelle Commission</h1>
                </div>

                <Card className="max-w-3xl">
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
                                <p className="font-medium mb-1">Note importante</p>
                                <p>Les commissions sont généralement créées automatiquement lors de la finalisation d'une transaction.</p>
                                <p>Utilisez ce formulaire uniquement pour créer une commission manuelle.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Relations */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Transaction et Agent</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="transactionId" className="text-sm font-medium">
                                            ID Transaction *
                                        </label>
                                        <Input
                                            id="transactionId"
                                            name="transactionId"
                                            placeholder="clxxx..."
                                            required
                                        />
                                        <p className="text-xs text-gray-500">ID de la transaction liée</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="agentId" className="text-sm font-medium">
                                            ID Agent *
                                        </label>
                                        <Input
                                            id="agentId"
                                            name="agentId"
                                            placeholder="clxxx..."
                                            required
                                        />
                                        <p className="text-xs text-gray-500">ID de l'agent bénéficiaire</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Type de commission *</label>
                                    <Select value={commissionType} onValueChange={setCommissionType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="agent">Agent</SelectItem>
                                            <SelectItem value="agency">Agence</SelectItem>
                                            <SelectItem value="referral">Parrainage</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Montant */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Montant</h2>

                                <div className="grid grid-cols-3 gap-4">
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
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="percentage" className="text-sm font-medium">
                                            Pourcentage
                                        </label>
                                        <Input
                                            id="percentage"
                                            name="percentage"
                                            type="number"
                                            placeholder="5"
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
                            </div>

                            {/* Date d'échéance */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Échéance</h2>

                                <div className="space-y-2">
                                    <label htmlFor="dueDate" className="text-sm font-medium">
                                        Date d'échéance
                                    </label>
                                    <Input
                                        id="dueDate"
                                        name="dueDate"
                                        type="date"
                                    />
                                    <p className="text-xs text-gray-500">Date limite de paiement</p>
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
                                        placeholder="Notes sur cette commission..."
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
                                    {loading ? 'Création en cours...' : 'Créer la commission'}
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
