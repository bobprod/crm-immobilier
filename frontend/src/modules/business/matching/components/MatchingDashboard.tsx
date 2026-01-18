import React, { useState, useEffect } from 'react';

interface MatchingDashboardProps {
    language?: 'fr' | 'en';
}

type TabType = 'prospects' | 'properties' | 'matching-view';

/**
 * Module Matching - Dashboard avec tabs Prospects et Biens
 * Format identique au ProspectsDashboard et autres modules
 */
export const MatchingDashboard: React.FC<MatchingDashboardProps> = ({ language = 'fr' }) => {
    const [activeTab, setActiveTab] = useState<TabType>('prospects');
    const [prospects, setProspects] = useState<any[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Load data based on active tab
    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'prospects') {
                // Load prospects
                // const response = await fetch('/api/prospects');
                // const data = await response.json();
                // setProspects(data);
            } else if (activeTab === 'properties') {
                // Load properties
                // const response = await fetch('/api/properties');
                // const data = await response.json();
                // setProperties(data);
            } else {
                // Load matches
                // const response = await fetch('/api/matching');
                // const data = await response.json();
                // setMatches(data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'prospects', label: 'Prospects', icon: '👤' },
        { id: 'properties', label: 'Biens', icon: '🏠' },
        { id: 'matching-view', label: 'Vue Matching', icon: '🎯' },
    ];

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Matching</h1>
                <p className="text-gray-600">Associez vos prospects aux biens immobiliers</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === tab.id
                            ? 'text-pink-600 border-b-2 border-pink-600'
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
                {/* Prospects Tab */}
                {activeTab === 'prospects' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Total Prospects */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-pink-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">👥</span>
                                </div>
                            </div>

                            {/* Matched */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Appariés</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>

                            {/* Pending Matches */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">En attente</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">⏳</span>
                                </div>
                            </div>

                            {/* Match Rate */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Taux d'appariement</p>
                                        <p className="text-4xl font-bold text-gray-900">0%</p>
                                    </div>
                                    <span className="text-4xl">📊</span>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <span className="text-6xl mb-4 block">👤</span>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun prospect enregistré</h3>
                            <p className="text-gray-600 mb-6">Commencez par importer vos prospects</p>
                            <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-rose-700 transition">
                                + Importer des prospects
                            </button>
                        </div>
                    </div>
                )}

                {/* Biens Tab */}
                {activeTab === 'properties' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Total Properties */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-pink-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">🏠</span>
                                </div>
                            </div>

                            {/* Matched Properties */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Appariés</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>

                            {/* Available */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Disponibles</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">📋</span>
                                </div>
                            </div>

                            {/* Avg Price */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Prix moyen</p>
                                        <p className="text-3xl font-bold text-gray-900">€0</p>
                                    </div>
                                    <span className="text-4xl">💰</span>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <span className="text-6xl mb-4 block">🏠</span>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun bien enregistré</h3>
                            <p className="text-gray-600 mb-6">Commencez par ajouter vos biens</p>
                            <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-rose-700 transition">
                                + Ajouter un bien
                            </button>
                        </div>
                    </div>
                )}

                {/* Vue Matching Tab */}
                {activeTab === 'matching-view' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Total Matches */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-pink-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total appariements</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">🎯</span>
                                </div>
                            </div>

                            {/* Excellent Matches */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Excellents</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">⭐</span>
                                </div>
                            </div>

                            {/* Good Matches */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Bons</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">👍</span>
                                </div>
                            </div>

                            {/* Pending Review */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">À vérifier</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">🔍</span>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <span className="text-6xl mb-4 block">🎯</span>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun appariement trouvé</h3>
                            <p className="text-gray-600 mb-6">Les appariements entre prospects et biens s'afficheront ici</p>
                            <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-rose-700 transition">
                                + Lancer une recherche d'appariement
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchingDashboard;
