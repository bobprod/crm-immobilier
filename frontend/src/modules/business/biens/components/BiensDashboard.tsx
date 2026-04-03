import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '../../../../shared/utils/backend-api';

interface BiensDashboardProps {
    language?: 'fr' | 'en';
}

type TabType = 'properties' | 'owners';

interface Property {
    id: string;
    title: string;
    type: string;
    price: number;
    status: string;
    address: string;
}

interface Owner {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    propertiesCount?: number;
}

/**
 * Module Biens - Dashboard avec tabs Biens et Propriétaires
 */
export const BiensDashboard: React.FC<BiensDashboardProps> = ({ language = 'fr' }) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('properties');
    const [properties, setProperties] = useState<Property[]>([]);
    const [owners, setOwners] = useState<Owner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [propsRes, ownersRes] = await Promise.allSettled([
                apiClient.get('/properties'),
                apiClient.get('/owners'),
            ]);
            if (propsRes.status === 'fulfilled') {
                const d = propsRes.value.data;
                setProperties(Array.isArray(d) ? d : d?.items || d?.data || []);
            }
            if (ownersRes.status === 'fulfilled') {
                const d = ownersRes.value.data;
                setOwners(Array.isArray(d) ? d : d?.items || d?.data || []);
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

    const activeProps = properties.filter(p => p.status === 'AVAILABLE' || p.status === 'active');
    const soldProps = properties.filter(p => p.status === 'SOLD' || p.status === 'sold');

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

            {loading && <div className="text-center py-12 text-gray-500">Chargement...</div>}

            {/* Content */}
            {!loading && (
            <div className="space-y-6">
                {/* Biens Tab */}
                {activeTab === 'properties' && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-amber-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total</p>
                                        <p className="text-4xl font-bold text-gray-900">{properties.length}</p>
                                    </div>
                                    <span className="text-4xl">🏠</span>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Disponibles</p>
                                        <p className="text-4xl font-bold text-gray-900">{activeProps.length}</p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">En cours</p>
                                        <p className="text-4xl font-bold text-gray-900">{properties.length - activeProps.length - soldProps.length}</p>
                                    </div>
                                    <span className="text-4xl">⏳</span>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Vendus</p>
                                        <p className="text-4xl font-bold text-gray-900">{soldProps.length}</p>
                                    </div>
                                    <span className="text-4xl">🎯</span>
                                </div>
                            </div>
                        </div>

                        {properties.length > 0 ? (
                            <div className="space-y-3">
                                {properties.slice(0, 10).map((p) => (
                                    <div
                                        key={p.id}
                                        onClick={() => router.push(`/properties/${p.id}`)}
                                        className="bg-white rounded-lg shadow p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                                    >
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{p.title}</h4>
                                            <p className="text-gray-500 text-sm">{p.address}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-gray-900">{p.price?.toLocaleString('fr-FR')} €</span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${p.status === 'AVAILABLE' || p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'SOLD' || p.status === 'sold' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {p.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2 flex gap-3">
                                    <button
                                        onClick={() => router.push('/properties')}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
                                    >
                                        Voir tous les biens →
                                    </button>
                                    <button
                                        onClick={() => router.push('/properties/new')}
                                        className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition"
                                    >
                                        + Ajouter un bien
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow p-12 text-center">
                                <span className="text-6xl mb-4 block">🏠</span>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun bien enregistré</h3>
                                <p className="text-gray-600 mb-6">Commencez par ajouter vos premiers biens immobiliers</p>
                                <button
                                    onClick={() => router.push('/properties/new')}
                                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition"
                                >
                                    + Ajouter un bien
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Propriétaires Tab */}
                {activeTab === 'owners' && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-amber-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total</p>
                                        <p className="text-4xl font-bold text-gray-900">{owners.length}</p>
                                    </div>
                                    <span className="text-4xl">👨‍💼</span>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Actifs</p>
                                        <p className="text-4xl font-bold text-gray-900">{owners.length}</p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Biens</p>
                                        <p className="text-4xl font-bold text-gray-900">{properties.length}</p>
                                    </div>
                                    <span className="text-4xl">🏠</span>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Valeur</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {properties.reduce((s, p) => s + (p.price || 0), 0).toLocaleString('fr-FR')} €
                                        </p>
                                    </div>
                                    <span className="text-4xl">💰</span>
                                </div>
                            </div>
                        </div>

                        {owners.length > 0 ? (
                            <div className="space-y-3">
                                {owners.slice(0, 10).map((o) => (
                                    <div
                                        key={o.id}
                                        onClick={() => router.push(`/owners/${o.id}`)}
                                        className="bg-white rounded-lg shadow p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                                    >
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{o.firstName} {o.lastName}</h4>
                                            <p className="text-gray-500 text-sm">{o.email}</p>
                                        </div>
                                        <span className="text-gray-400 text-sm">{o.phone}</span>
                                    </div>
                                ))}
                                <div className="pt-2 flex gap-3">
                                    <button
                                        onClick={() => router.push('/owners')}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
                                    >
                                        Voir tous les propriétaires →
                                    </button>
                                    <button
                                        onClick={() => router.push('/owners/new')}
                                        className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition"
                                    >
                                        + Ajouter un propriétaire
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow p-12 text-center">
                                <span className="text-6xl mb-4 block">👨‍💼</span>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun propriétaire enregistré</h3>
                                <p className="text-gray-600 mb-6">Ajoutez vos propriétaires pour commencer</p>
                                <button
                                    onClick={() => router.push('/owners/new')}
                                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition"
                                >
                                    + Ajouter un propriétaire
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            )}
        </div>
    );
};

export default BiensDashboard;


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
