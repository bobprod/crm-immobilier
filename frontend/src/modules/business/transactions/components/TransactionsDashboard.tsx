import React, { useState, useEffect } from 'react';

interface TransactionsDashboardProps {
    language?: 'fr' | 'en';
}

type TabType = 'overview' | 'commissions' | 'invoices';

/**
 * Module Transactions - Dashboard avec tabs Vue d'ensemble, Commissions et Factures
 * Format identique au ProspectsDashboard et BiensDashboard
 */
export const TransactionsDashboard: React.FC<TransactionsDashboardProps> = ({ language = 'fr' }) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [overview, setOverview] = useState<any[]>([]);
    const [commissions, setCommissions] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Load data based on active tab
    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                // Load overview data
                // const response = await fetch('/api/finance/overview');
                // const data = await response.json();
                // setOverview(data);
            } else if (activeTab === 'commissions') {
                // Load commissions
                // const response = await fetch('/api/finance/commissions');
                // const data = await response.json();
                // setCommissions(data);
            } else {
                // Load invoices
                // const response = await fetch('/api/finance/invoices');
                // const data = await response.json();
                // setInvoices(data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: '💵' },
        { id: 'commissions', label: 'Commissions', icon: '💳' },
        { id: 'invoices', label: 'Factures', icon: '🧾' },
    ];

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Transactions & Finances</h1>
                <p className="text-gray-600">Gérez vos transactions, commissions et factures</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === tab.id
                                ? 'text-yellow-600 border-b-2 border-yellow-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-6">
                {/* Vue d'ensemble Tab */}
                {activeTab === 'overview' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Total Revenue */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Revenu Total</p>
                                        <p className="text-3xl font-bold text-gray-900">€0</p>
                                    </div>
                                    <span className="text-4xl">💰</span>
                                </div>
                            </div>

                            {/* Pending */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">En attente</p>
                                        <p className="text-3xl font-bold text-gray-900">€0</p>
                                    </div>
                                    <span className="text-4xl">⏳</span>
                                </div>
                            </div>

                            {/* Completed */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Complétées</p>
                                        <p className="text-3xl font-bold text-gray-900">€0</p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>

                            {/* Average */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Moyenne</p>
                                        <p className="text-3xl font-bold text-gray-900">€0</p>
                                    </div>
                                    <span className="text-4xl">📊</span>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <span className="text-6xl mb-4 block">💵</span>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucune transaction enregistrée</h3>
                            <p className="text-gray-600 mb-6">Les transactions s'afficheront ici une fois créées</p>
                        </div>
                    </div>
                )}

                {/* Commissions Tab */}
                {activeTab === 'commissions' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Total Commissions */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total</p>
                                        <p className="text-3xl font-bold text-gray-900">€0</p>
                                    </div>
                                    <span className="text-4xl">💳</span>
                                </div>
                            </div>

                            {/* Pending Commissions */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">En attente</p>
                                        <p className="text-3xl font-bold text-gray-900">€0</p>
                                    </div>
                                    <span className="text-4xl">⏳</span>
                                </div>
                            </div>

                            {/* Paid Commissions */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Payées</p>
                                        <p className="text-3xl font-bold text-gray-900">€0</p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>

                            {/* Count */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Nombre</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">#️⃣</span>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <span className="text-6xl mb-4 block">💳</span>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucune commission enregistrée</h3>
                            <p className="text-gray-600 mb-6">Les commissions s'afficheront ici une fois créées</p>
                            <button className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-amber-700 transition">
                                + Ajouter une commission
                            </button>
                        </div>
                    </div>
                )}

                {/* Factures Tab */}
                {activeTab === 'invoices' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Total Invoices */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total</p>
                                        <p className="text-3xl font-bold text-gray-900">€0</p>
                                    </div>
                                    <span className="text-4xl">🧾</span>
                                </div>
                            </div>

                            {/* Pending Invoices */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Non payées</p>
                                        <p className="text-3xl font-bold text-gray-900">€0</p>
                                    </div>
                                    <span className="text-4xl">⚠️</span>
                                </div>
                            </div>

                            {/* Paid Invoices */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Payées</p>
                                        <p className="text-3xl font-bold text-gray-900">€0</p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>

                            {/* Overdue */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Échues</p>
                                        <p className="text-3xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">📆</span>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <span className="text-6xl mb-4 block">🧾</span>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucune facture enregistrée</h3>
                            <p className="text-gray-600 mb-6">Les factures s'afficheront ici une fois créées</p>
                            <button className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-amber-700 transition">
                                + Créer une facture
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionsDashboard;
