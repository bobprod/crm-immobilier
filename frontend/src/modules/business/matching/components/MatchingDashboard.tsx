import React, { useState, useEffect, useCallback } from 'react';
import prospectsAPI, { Prospect, ProspectStats } from '@/shared/utils/prospects-api';
import propertiesAPI, { Property, PropertyStats } from '@/shared/utils/properties-api';
import { matchingAPI, MatchingResult, MatchingStats } from '@/shared/utils/matching-api';

interface MatchingDashboardProps {
    language?: 'fr' | 'en';
}

type TabType = 'prospects' | 'properties' | 'matching-view';

// Helpers pour formater les données
const formatPrice = (price: number, currency: string = 'TND') => {
    return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const getProspectTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
        buyer: { label: 'Acheteur', color: 'bg-blue-100 text-blue-800' },
        seller: { label: 'Vendeur', color: 'bg-green-100 text-green-800' },
        renter: { label: 'Locataire', color: 'bg-purple-100 text-purple-800' },
        landlord: { label: 'Bailleur', color: 'bg-orange-100 text-orange-800' },
        investor: { label: 'Investisseur', color: 'bg-yellow-100 text-yellow-800' },
        other: { label: 'Autre', color: 'bg-gray-100 text-gray-800' },
    };
    return types[type] || types.other;
};

const getPropertyStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
        available: { label: 'Disponible', color: 'bg-green-100 text-green-800' },
        reserved: { label: 'Réservé', color: 'bg-yellow-100 text-yellow-800' },
        sold: { label: 'Vendu', color: 'bg-red-100 text-red-800' },
        rented: { label: 'Loué', color: 'bg-blue-100 text-blue-800' },
        pending: { label: 'En attente', color: 'bg-gray-100 text-gray-800' },
        draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
        archived: { label: 'Archivé', color: 'bg-gray-100 text-gray-800' },
    };
    return statuses[status] || statuses.pending;
};

const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
};

/**
 * Module Matching - Dashboard avec tabs Prospects et Biens
 * Connecté aux vraies APIs backend
 */
export const MatchingDashboard: React.FC<MatchingDashboardProps> = ({ language = 'fr' }) => {
    const [activeTab, setActiveTab] = useState<TabType>('prospects');
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [matches, setMatches] = useState<MatchingResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Stats
    const [prospectStats, setProspectStats] = useState<ProspectStats | null>(null);
    const [propertyStats, setPropertyStats] = useState<PropertyStats | null>(null);
    const [matchingStats, setMatchingStats] = useState<MatchingStats | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');

    // Load data based on active tab
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'prospects') {
                const [prospectsResponse, stats] = await Promise.all([
                    prospectsAPI.getMyProspects({
                        status: statusFilter || undefined,
                        type: typeFilter || undefined,
                        search: searchTerm || undefined,
                    }),
                    prospectsAPI.getStats(),
                ]);
                setProspects(prospectsResponse.data || []);
                setProspectStats(stats);
            } else if (activeTab === 'properties') {
                const [propertiesResponse, stats] = await Promise.all([
                    propertiesAPI.getMyProperties({
                        status: statusFilter || undefined,
                        type: typeFilter || undefined,
                        search: searchTerm || undefined,
                    }),
                    propertiesAPI.getPropertyStats(),
                ]);
                setProperties(propertiesResponse.data || []);
                setPropertyStats(stats);
            } else {
                const [matchesData, stats] = await Promise.all([
                    matchingAPI.getAllMatches(),
                    matchingAPI.getStats(),
                ]);
                setMatches(matchesData || []);
                setMatchingStats(stats);
            }
        } catch (err: any) {
            console.error('Error loading data:', err);
            setError(err.message || 'Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    }, [activeTab, statusFilter, typeFilter, searchTerm]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Generate matches for a prospect
    const handleFindMatches = async (prospectId: string) => {
        try {
            setLoading(true);
            const results = await matchingAPI.findMatches(prospectId);
            console.log('Matches found:', results);
            // Switch to matching tab to show results
            setActiveTab('matching-view');
            await loadData();
        } catch (err: any) {
            console.error('Error finding matches:', err);
            setError(err.message || 'Erreur lors de la recherche de correspondances');
        } finally {
            setLoading(false);
        }
    };

    // Find prospects for a property
    const handleFindProspectsForProperty = async (propertyId: string) => {
        try {
            setLoading(true);
            const results = await matchingAPI.findMatchesForProperty(propertyId);
            console.log('Prospects found:', results);
            setActiveTab('matching-view');
            await loadData();
        } catch (err: any) {
            console.error('Error finding prospects:', err);
            setError(err.message || 'Erreur lors de la recherche de prospects');
        } finally {
            setLoading(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: string; count?: number }[] = [
        { id: 'prospects', label: 'Prospects', icon: '👤', count: prospectStats?.total || 0 },
        { id: 'properties', label: 'Biens', icon: '🏠', count: propertyStats?.total || 0 },
        { id: 'matching-view', label: 'Vue Matching', icon: '🎯', count: matchingStats?.total || 0 },
    ];

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Matching</h1>
                <p className="text-gray-600">Associez vos prospects aux biens immobiliers</p>
            </div>

            {/* Error display */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <p className="font-medium">Erreur</p>
                    <p className="text-sm">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="mt-2 text-sm underline hover:no-underline"
                    >
                        Fermer
                    </button>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${activeTab === tab.id
                            ? 'text-pink-600 border-b-2 border-pink-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-100">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Search and Filters */}
            <div className="mb-6 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[250px]">
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                </div>
                {activeTab === 'prospects' && (
                    <>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                            <option value="converted">Converti</option>
                            <option value="lost">Perdu</option>
                        </select>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                        >
                            <option value="">Tous les types</option>
                            <option value="buyer">Acheteur</option>
                            <option value="renter">Locataire</option>
                            <option value="seller">Vendeur</option>
                            <option value="landlord">Bailleur</option>
                            <option value="investor">Investisseur</option>
                        </select>
                    </>
                )}
                {activeTab === 'properties' && (
                    <>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="available">Disponible</option>
                            <option value="reserved">Réservé</option>
                            <option value="sold">Vendu</option>
                            <option value="rented">Loué</option>
                        </select>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                        >
                            <option value="">Tous les types</option>
                            <option value="apartment">Appartement</option>
                            <option value="house">Maison</option>
                            <option value="villa">Villa</option>
                            <option value="studio">Studio</option>
                            <option value="land">Terrain</option>
                            <option value="commercial">Commercial</option>
                        </select>
                    </>
                )}
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                    {loading ? 'Chargement...' : 'Actualiser'}
                </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {/* Prospects Tab */}
                {activeTab === 'prospects' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-pink-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total</p>
                                        <p className="text-4xl font-bold text-gray-900">
                                            {prospectStats?.total || 0}
                                        </p>
                                    </div>
                                    <span className="text-4xl">👥</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Actifs</p>
                                        <p className="text-4xl font-bold text-gray-900">
                                            {prospectStats?.activeProspects || 0}
                                        </p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Convertis ce mois</p>
                                        <p className="text-4xl font-bold text-gray-900">
                                            {prospectStats?.convertedThisMonth || 0}
                                        </p>
                                    </div>
                                    <span className="text-4xl">🎯</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Taux conversion</p>
                                        <p className="text-4xl font-bold text-gray-900">
                                            {prospectStats?.conversionRate?.toFixed(1) || 0}%
                                        </p>
                                    </div>
                                    <span className="text-4xl">📊</span>
                                </div>
                            </div>
                        </div>

                        {/* Prospects List */}
                        {loading ? (
                            <div className="bg-white rounded-lg shadow p-12 text-center">
                                <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-gray-600">Chargement des prospects...</p>
                            </div>
                        ) : prospects.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-12 text-center">
                                <span className="text-6xl mb-4 block">👤</span>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun prospect enregistré</h3>
                                <p className="text-gray-600 mb-6">Commencez par importer vos prospects</p>
                                <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-rose-700 transition">
                                    + Importer des prospects
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {prospects.map((prospect) => {
                                    const typeBadge = getProspectTypeBadge(prospect.type);
                                    return (
                                        <div key={prospect.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                                            <div className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h3 className="font-semibold text-lg text-gray-900">
                                                            {prospect.firstName} {prospect.lastName}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">{prospect.email}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeBadge.color}`}>
                                                        {typeBadge.label}
                                                    </span>
                                                </div>

                                                {prospect.phone && (
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        <span className="mr-2">📞</span>
                                                        {prospect.phone}
                                                    </p>
                                                )}

                                                {prospect.budget && (
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        <span className="mr-2">💰</span>
                                                        Budget: {formatPrice(prospect.budget.min || 0, prospect.currency)} - {formatPrice(prospect.budget.max || 0, prospect.currency)}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(prospect.score)}`}>
                                                            Score: {prospect.score}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleFindMatches(prospect.id)}
                                                        className="px-3 py-1.5 bg-pink-100 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-200 transition"
                                                    >
                                                        🎯 Trouver biens
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Biens Tab */}
                {activeTab === 'properties' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-pink-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total</p>
                                        <p className="text-4xl font-bold text-gray-900">
                                            {propertyStats?.total || 0}
                                        </p>
                                    </div>
                                    <span className="text-4xl">🏠</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Disponibles</p>
                                        <p className="text-4xl font-bold text-gray-900">
                                            {propertyStats?.byStatus?.available || 0}
                                        </p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Vendus/Loués</p>
                                        <p className="text-4xl font-bold text-gray-900">
                                            {(propertyStats?.byStatus?.sold || 0) + (propertyStats?.byStatus?.rented || 0)}
                                        </p>
                                    </div>
                                    <span className="text-4xl">📋</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Prix moyen</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatPrice(propertyStats?.averagePrice || 0)}
                                        </p>
                                    </div>
                                    <span className="text-4xl">💰</span>
                                </div>
                            </div>
                        </div>

                        {/* Properties List */}
                        {loading ? (
                            <div className="bg-white rounded-lg shadow p-12 text-center">
                                <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-gray-600">Chargement des biens...</p>
                            </div>
                        ) : properties.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-12 text-center">
                                <span className="text-6xl mb-4 block">🏠</span>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun bien enregistré</h3>
                                <p className="text-gray-600 mb-6">Commencez par ajouter vos biens</p>
                                <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-rose-700 transition">
                                    + Ajouter un bien
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {properties.map((property) => {
                                    const statusBadge = getPropertyStatusBadge(property.status);
                                    return (
                                        <div key={property.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                                            {/* Property Image */}
                                            {property.images && property.images.length > 0 ? (
                                                <div className="relative h-48 w-full">
                                                    <img
                                                        src={property.images[0]}
                                                        alt={property.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                                                        {statusBadge.label}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="relative h-48 w-full bg-gray-100 flex items-center justify-center">
                                                    <span className="text-6xl text-gray-300">🏠</span>
                                                    <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                                                        {statusBadge.label}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="p-4">
                                                <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
                                                    {property.title}
                                                </h3>
                                                <p className="text-pink-600 font-bold text-xl mb-2">
                                                    {formatPrice(property.price, property.currency)}
                                                </p>

                                                <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-3">
                                                    {property.city && (
                                                        <span className="flex items-center gap-1">
                                                            📍 {property.city}
                                                        </span>
                                                    )}
                                                    {property.area && (
                                                        <span className="flex items-center gap-1">
                                                            📐 {property.area} m²
                                                        </span>
                                                    )}
                                                    {property.bedrooms && (
                                                        <span className="flex items-center gap-1">
                                                            🛏️ {property.bedrooms}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(property.createdAt)}
                                                    </span>
                                                    <button
                                                        onClick={() => handleFindProspectsForProperty(property.id)}
                                                        className="px-3 py-1.5 bg-pink-100 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-200 transition"
                                                    >
                                                        👤 Trouver prospects
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Vue Matching Tab */}
                {activeTab === 'matching-view' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-pink-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total appariements</p>
                                        <p className="text-4xl font-bold text-gray-900">
                                            {matchingStats?.total || 0}
                                        </p>
                                    </div>
                                    <span className="text-4xl">🎯</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Excellents (80%+)</p>
                                        <p className="text-4xl font-bold text-gray-900">
                                            {matchingStats?.excellent || 0}
                                        </p>
                                    </div>
                                    <span className="text-4xl">⭐</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Bons (60-80%)</p>
                                        <p className="text-4xl font-bold text-gray-900">
                                            {matchingStats?.good || 0}
                                        </p>
                                    </div>
                                    <span className="text-4xl">👍</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Score moyen</p>
                                        <p className="text-4xl font-bold text-gray-900">
                                            {matchingStats?.avgScore?.toFixed(0) || 0}%
                                        </p>
                                    </div>
                                    <span className="text-4xl">📊</span>
                                </div>
                            </div>
                        </div>

                        {/* Matches List */}
                        {loading ? (
                            <div className="bg-white rounded-lg shadow p-12 text-center">
                                <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-gray-600">Chargement des correspondances...</p>
                            </div>
                        ) : matches.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-12 text-center">
                                <span className="text-6xl mb-4 block">🎯</span>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun appariement trouvé</h3>
                                <p className="text-gray-600 mb-6">Les appariements entre prospects et biens s'afficheront ici</p>
                                <p className="text-sm text-gray-500">
                                    Utilisez les boutons "Trouver biens" ou "Trouver prospects" dans les autres onglets
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {matches.map((match) => {
                                    const scorePercent = Math.round(match.score * 100);
                                    return (
                                        <div key={match.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                                            <div className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl">👤</span>
                                                        <span className="text-gray-400">→</span>
                                                        <span className="text-2xl">🏠</span>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(scorePercent)}`}>
                                                        {scorePercent}%
                                                    </span>
                                                </div>

                                                <div className="space-y-2 mb-4">
                                                    <p className="text-sm">
                                                        <span className="text-gray-500">Prospect:</span>{' '}
                                                        <span className="font-medium">{match.prospectId}</span>
                                                    </p>
                                                    <p className="text-sm">
                                                        <span className="text-gray-500">Bien:</span>{' '}
                                                        <span className="font-medium">{match.propertyId}</span>
                                                    </p>
                                                </div>

                                                {match.reasons && match.reasons.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-4">
                                                        {match.reasons.slice(0, 3).map((reason, idx) => (
                                                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                                                {reason}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex gap-2 pt-4 border-t border-gray-100">
                                                    <button className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition">
                                                        ✓ Accepter
                                                    </button>
                                                    <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
                                                        ✕ Rejeter
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchingDashboard;
