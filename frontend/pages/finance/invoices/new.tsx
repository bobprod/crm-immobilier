import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../src/modules/core/layout/components/Layout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import apiClient from '@/shared/utils/backend-api';

export default function NewInvoicePage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [clientType, setClientType] = React.useState<string>('buyer');
    const [amount, setAmount] = React.useState<number>(0);
    const [vatRate, setVatRate] = React.useState<number>(19); // Default VAT rate for Tunisia

    // Calculate VAT and total amount
    const vatAmount = (amount * vatRate) / 100;
    const totalAmount = amount + vatAmount;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        const data = {
            transactionId: formData.get('transactionId') as string || undefined,
            ownerId: formData.get('ownerId') as string || undefined,
            number: formData.get('number') as string,
            clientType: clientType,
            clientName: formData.get('clientName') as string,
            clientEmail: formData.get('clientEmail') as string || undefined,
            clientPhone: formData.get('clientPhone') as string || undefined,
            clientAddress: formData.get('clientAddress') as string || undefined,
            amount: amount,
            vat: vatAmount,
            totalAmount: totalAmount,
            currency: formData.get('currency') as string || 'TND',
            dueDate: formData.get('dueDate') as string,
            description: formData.get('description') as string || undefined,
            notes: formData.get('notes') as string || undefined,
        };

        try {
            console.log('Creating invoice:', data);
            await apiClient.post('/finance/invoices', data);
            router.push('/finance');
        } catch (err: any) {
            console.error('Error creating invoice:', err);
            const message = err.response?.data?.message || err.message || 'Erreur lors de la création de la facture';
            setError(Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setLoading(false);
        }
    };

    // Générer un numéro de facture automatique
    const generateInvoiceNumber = () => {
        const year = new Date().getFullYear();
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `INV-${year}${month}-${random}`;
    };

    React.useEffect(() => {
        const numberInput = document.getElementById('number') as HTMLInputElement;
        if (numberInput && !numberInput.value) {
            numberInput.value = generateInvoiceNumber();
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
                        Retour aux factures
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Nouvelle Facture</h1>
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
                                    <label htmlFor="number" className="text-sm font-medium">
                                        Numéro de facture *
                                    </label>
                                    <Input
                                        id="number"
                                        name="number"
                                        placeholder="INV-202512-001"
                                        required
                                    />
                                    <p className="text-xs text-gray-500">Numéro unique de la facture (généré automatiquement)</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="transactionId" className="text-sm font-medium">
                                            ID Transaction (optionnel)
                                        </label>
                                        <Input
                                            id="transactionId"
                                            name="transactionId"
                                            placeholder="clxxx..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="ownerId" className="text-sm font-medium">
                                            ID Propriétaire (optionnel)
                                        </label>
                                        <Input
                                            id="ownerId"
                                            name="ownerId"
                                            placeholder="clxxx..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Informations client */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Informations Client</h2>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Type de client *</label>
                                    <Select value={clientType} onValueChange={setClientType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="buyer">Acheteur</SelectItem>
                                            <SelectItem value="seller">Vendeur</SelectItem>
                                            <SelectItem value="tenant">Locataire</SelectItem>
                                            <SelectItem value="landlord">Propriétaire</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="clientName" className="text-sm font-medium">
                                        Nom du client *
                                    </label>
                                    <Input
                                        id="clientName"
                                        name="clientName"
                                        placeholder="Nom complet ou raison sociale"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="clientEmail" className="text-sm font-medium">
                                            Email
                                        </label>
                                        <Input
                                            id="clientEmail"
                                            name="clientEmail"
                                            type="email"
                                            placeholder="client@example.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="clientPhone" className="text-sm font-medium">
                                            Téléphone
                                        </label>
                                        <Input
                                            id="clientPhone"
                                            name="clientPhone"
                                            placeholder="+216 XX XXX XXX"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="clientAddress" className="text-sm font-medium">
                                        Adresse
                                    </label>
                                    <Input
                                        id="clientAddress"
                                        name="clientAddress"
                                        placeholder="Adresse complète du client"
                                    />
                                </div>
                            </div>

                            {/* Montants */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Montants</h2>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="amountInput" className="text-sm font-medium">
                                            Montant HT *
                                        </label>
                                        <Input
                                            id="amountInput"
                                            type="number"
                                            placeholder="10000"
                                            required
                                            step="0.01"
                                            value={amount || ''}
                                            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="vatRate" className="text-sm font-medium">
                                            Taux TVA (%)
                                        </label>
                                        <Input
                                            id="vatRate"
                                            type="number"
                                            placeholder="19"
                                            step="0.01"
                                            value={vatRate}
                                            onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
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

                                {/* Récapitulatif */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Montant HT:</span>
                                        <span className="font-medium">{amount.toFixed(2)} TND</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">TVA ({vatRate}%):</span>
                                        <span className="font-medium">{vatAmount.toFixed(2)} TND</span>
                                    </div>
                                    <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-300">
                                        <span>Total TTC:</span>
                                        <span className="text-blue-600">{totalAmount.toFixed(2)} TND</span>
                                    </div>
                                </div>
                            </div>

                            {/* Date d'échéance */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Échéance</h2>

                                <div className="space-y-2">
                                    <label htmlFor="dueDate" className="text-sm font-medium">
                                        Date d'échéance *
                                    </label>
                                    <Input
                                        id="dueDate"
                                        name="dueDate"
                                        type="date"
                                        required
                                    />
                                    <p className="text-xs text-gray-500">Date limite de paiement</p>
                                </div>
                            </div>

                            {/* Description et notes */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Description et Notes</h2>

                                <div className="space-y-2">
                                    <label htmlFor="description" className="text-sm font-medium">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        placeholder="Description des services/produits facturés..."
                                        className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="notes" className="text-sm font-medium">
                                        Notes
                                    </label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        placeholder="Notes additionnelles..."
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
                                    {loading ? 'Création en cours...' : 'Créer la facture'}
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
