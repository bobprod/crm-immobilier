import React, { useState, useEffect } from 'react';

interface BiensDashboardProps {
    language?: 'fr' | 'en';
}

type TabType = 'properties' | 'owners';

/**
 * Module Biens - Dashboard avec tabs Biens et Propriétaires
 * Format identique au ProspectsDashboard et PlanificationDashboard
 */
export const BiensDashboard: React.FC<BiensDashboardProps> = ({ language = 'fr' }) => {
    const [activeTab, setActiveTab] = useState<TabType>('properties');
    const [properties, setProperties] = useState<any[]>([]);
    const [owners, setOwners] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Load data based on active tab
    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'properties') {
                // Load properties
                // const response = await fetch('/api/properties');
                // const data = await response.json();
                // setProperties(data);
            } else {
                // Load owners
                // const response = await fetch('/api/owners');
                // const data = await response.json();
                // setOwners(data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'properties', label: 'Biens', icon: '🏠' },
        { id: 'owners', label: 'Propriétaires', icon: '👨‍💼' },
    ];

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Biens & Propriétaires</h1>
                <p className="text-gray-600">Gérez vos biens immobiliers et propriétaires</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === tab.id
                                ? 'text-amber-600 border-b-2 border-amber-600'
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
                {/* Biens Tab */}
                {activeTab === 'properties' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Total Properties */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-amber-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">🏠</span>
                                </div>
                            </div>

                            {/* Active Properties */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Actifs</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>

                            {/* In Progress */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">En cours</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">⏳</span>
                                </div>
                            </div>

                            {/* Sold */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Vendus</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">🎯</span>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <span className="text-6xl mb-4 block">🏠</span>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun bien enregistré</h3>
                            <p className="text-gray-600 mb-6">Commencez par ajouter vos premiers biens immobiliers</p>
                            <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition">
                                + Ajouter un bien
                            </button>
                        </div>
                    </div>
                )}

                {/* Propriétaires Tab */}
                {activeTab === 'owners' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Total Owners */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-amber-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">👨‍💼</span>
                                </div>
                            </div>

                            {/* Active Owners */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Actifs</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>

                            {/* Properties Count */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Biens</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">🏠</span>
                                </div>
                            </div>

                            {/* Total Value */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Valeur</p>
                                        <p className="text-3xl font-bold text-gray-900">€0</p>
                                    </div>
                                    <span className="text-4xl">💰</span>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <span className="text-6xl mb-4 block">👨‍💼</span>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun propriétaire enregistré</h3>
                            <p className="text-gray-600 mb-6">Ajoutez vos propriétaires pour commencer</p>
                            <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition">
                                + Ajouter un propriétaire
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BiensDashboard;
