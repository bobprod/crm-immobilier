import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { transactionsAPI, Transaction } from '@/shared/utils/transactions-api';
import { TransactionFilters } from './TransactionFilters';
import { Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionPipelineProps {
    initialLoading?: boolean;
    initialError?: string | null;
    initialTransactions?: Transaction[];
}

type StatusColumn = {
    key: Transaction['status'];
    label: string;
    color: string;
};

const PIPELINE_COLUMNS: StatusColumn[] = [
    { key: 'offer_received', label: 'Offre Reçue', color: 'bg-blue-50 border-blue-200' },
    { key: 'offer_accepted', label: 'Offre Acceptée', color: 'bg-purple-50 border-purple-200' },
    { key: 'promise_signed', label: 'Promesse Signée', color: 'bg-indigo-50 border-indigo-200' },
    { key: 'compromis_signed', label: 'Compromis Signé', color: 'bg-yellow-50 border-yellow-200' },
    { key: 'final_deed_signed', label: 'Acte Final', color: 'bg-green-50 border-green-200' },
];

export function TransactionPipeline({ initialLoading, initialError, initialTransactions }: TransactionPipelineProps) {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions || []);
    const [loading, setLoading] = useState<boolean>(initialLoading ?? false);
    const [error, setError] = useState<string | null>(initialError ?? null);
    const [filters, setFilters] = useState<any>({});
    const router = useRouter();

    const fetchTransactions = async (currentFilters = filters) => {
        setLoading(true);
        setError(null);
        try {
            const response = await transactionsAPI.list(currentFilters);
            setTransactions(response);
        } catch (err) {
            setError('Échec du chargement des transactions');
            console.error('Error fetching transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!initialTransactions && !initialLoading) {
            fetchTransactions();
        }
    }, [initialTransactions, initialLoading]);

    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters);
        fetchTransactions(newFilters);
    };

    const handleFinalize = async (transaction: Transaction) => {
        const finalPriceStr = prompt('Prix final de la transaction :', String(transaction.offerPrice));
        if (!finalPriceStr) return;

        const finalPrice = parseFloat(finalPriceStr);
        if (isNaN(finalPrice)) {
            alert('Prix invalide');
            return;
        }

        try {
            await transactionsAPI.finalize(transaction.id, finalPrice);
            await fetchTransactions();
        } catch (err) {
            console.error('Failed to finalize transaction:', err);
            alert('Erreur lors de la finalisation');
        }
    };

    const handleCancel = async (transaction: Transaction) => {
        const reason = prompt('Raison de l\'annulation :');
        if (!reason) return;

        try {
            await transactionsAPI.cancel(transaction.id, reason);
            await fetchTransactions();
        } catch (err) {
            console.error('Failed to cancel transaction:', err);
            alert('Erreur lors de l\'annulation');
        }
    };

    const getTransactionsByStatus = (status: Transaction['status']) => {
        return transactions.filter(t => t.status === status && t.status !== 'cancelled');
    };

    const getCancelledTransactions = () => {
        return transactions.filter(t => t.status === 'cancelled');
    };

    const getTypeColor = (type: string) => {
        return type === 'sale' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
    };

    if (loading && transactions.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8 text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Pipeline des Transactions</h2>
                <Button onClick={() => router.push('/transactions/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Transaction
                </Button>
            </div>

            <TransactionFilters onFilterChange={handleFilterChange} />

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {PIPELINE_COLUMNS.map((column) => {
                    const columnTransactions = getTransactionsByStatus(column.key);
                    const totalValue = columnTransactions.reduce((sum, t) => sum + (t.finalPrice || t.offerPrice), 0);

                    return (
                        <Card key={column.key} className={`${column.color} border-2`}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex justify-between items-center">
                                    <span>{column.label}</span>
                                    <Badge variant="secondary" className="ml-2">
                                        {columnTransactions.length}
                                    </Badge>
                                </CardTitle>
                                <p className="text-xs text-gray-600">
                                    {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(totalValue)}
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                                {columnTransactions.length === 0 ? (
                                    <p className="text-xs text-gray-500 text-center py-4">Aucune transaction</p>
                                ) : (
                                    columnTransactions.map((transaction) => (
                                        <Card key={transaction.id} className="cursor-pointer hover:shadow-md transition-shadow bg-white">
                                            <CardContent className="p-3">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <div className="font-medium text-sm">{transaction.reference}</div>
                                                        <Badge className={getTypeColor(transaction.type)} variant="secondary">
                                                            {transaction.type === 'sale' ? 'Vente' : 'Location'}
                                                        </Badge>
                                                    </div>

                                                    <div className="text-xs text-gray-600">
                                                        <div>Prospect: {transaction.prospect?.name || '-'}</div>
                                                        <div>Propriété: {transaction.property?.title || '-'}</div>
                                                    </div>

                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: transaction.currency }).format(transaction.finalPrice || transaction.offerPrice)}
                                                    </div>

                                                    {transaction.expectedClosing && (
                                                        <div className="text-xs text-gray-500">
                                                            Clôture: {format(new Date(transaction.expectedClosing), 'dd/MM/yyyy')}
                                                        </div>
                                                    )}

                                                    <div className="flex gap-1 pt-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs flex-1"
                                                            onClick={() => router.push(`/transactions/${transaction.id}`)}
                                                        >
                                                            <Eye className="h-3 w-3 mr-1" />
                                                            Voir
                                                        </Button>
                                                        {column.key === 'final_deed_signed' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-xs text-green-600 hover:text-green-700"
                                                                onClick={() => handleFinalize(transaction)}
                                                            >
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                Finaliser
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs text-red-600 hover:text-red-700"
                                                            onClick={() => handleCancel(transaction)}
                                                        >
                                                            <XCircle className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Cancelled Transactions */}
            {getCancelledTransactions().length > 0 && (
                <Card className="bg-gray-50 border-gray-200 border-2">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex justify-between items-center">
                            <span>Transactions Annulées</span>
                            <Badge variant="secondary">{getCancelledTransactions().length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {getCancelledTransactions().map((transaction) => (
                                <Card key={transaction.id} className="bg-white opacity-60">
                                    <CardContent className="p-3">
                                        <div className="text-sm font-medium">{transaction.reference}</div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            {transaction.prospect?.name || '-'}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs mt-2 w-full"
                                            onClick={() => router.push(`/transactions/${transaction.id}`)}
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Voir
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
