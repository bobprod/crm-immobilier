import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { useState, useEffect } from 'react';
import { financeAPI } from '@/shared/utils/finance-api';
import { CommissionsList } from './CommissionsList';
import { InvoicesList } from './InvoicesList';
import { PaymentsList } from './PaymentsList';
import { DollarSign, FileText, CreditCard, TrendingUp } from 'lucide-react';

type TabType = 'commissions' | 'invoices' | 'payments';

interface FinanceStats {
    commissions: {
        total: number;
        pending: number;
        paid: number;
        totalAmount: number;
        paidAmount: number;
        pendingAmount: number;
    };
    invoices: {
        total: number;
        draft: number;
        sent: number;
        paid: number;
        overdue: number;
        totalAmount: number;
        paidAmount: number;
        pendingAmount: number;
    };
    payments: {
        total: number;
        totalAmount: number;
    };
}

export function FinanceManager() {
    const [activeTab, setActiveTab] = useState<TabType>('commissions');
    const [stats, setStats] = useState<FinanceStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await financeAPI.getStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        {
            key: 'commissions' as TabType,
            label: 'Commissions',
            icon: DollarSign,
            count: stats?.commissions?.total || 0
        },
        {
            key: 'invoices' as TabType,
            label: 'Factures',
            icon: FileText,
            count: stats?.invoices?.total || 0
        },
        {
            key: 'payments' as TabType,
            label: 'Paiements',
            icon: CreditCard,
            count: stats?.payments?.total || 0
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Finance</h2>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Commissions Totales</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(stats.commissions.totalAmount)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats.commissions.pending} en attente
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Factures Totales</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(stats.invoices.totalAmount)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats.invoices.overdue} en retard
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Paiements Reçus</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(stats.payments.totalAmount)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats.payments.total} transactions
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">À Recevoir</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(
                                    stats.commissions.pendingAmount + stats.invoices.pendingAmount
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Commissions + Factures
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs Navigation */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex space-x-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <Button
                                    key={tab.key}
                                    variant={activeTab === tab.key ? 'default' : 'outline'}
                                    className="flex-1"
                                    onClick={() => setActiveTab(tab.key)}
                                >
                                    <Icon className="mr-2 h-4 w-4" />
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                                            {tab.count}
                                        </span>
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                </CardHeader>
            </Card>

            {/* Tab Content */}
            <div>
                {activeTab === 'commissions' && <CommissionsList onUpdate={fetchStats} />}
                {activeTab === 'invoices' && <InvoicesList onUpdate={fetchStats} />}
                {activeTab === 'payments' && <PaymentsList onUpdate={fetchStats} />}
            </div>
        </div>
    );
}
