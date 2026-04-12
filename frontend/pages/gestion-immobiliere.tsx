import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '../src/shared/components/layout';
import { PropertyList } from '../src/modules/business/properties/components/PropertyList';
import { MandateList } from '../src/modules/business/mandates/components/MandateList';
import { OwnerList } from '../src/modules/business/owners/components/OwnerList';
import { OwnerFilters } from '../src/modules/business/owners/components/OwnerFilters';
import { ownersAPI, Owner, OwnerFilters as IOwnerFilters } from '../src/shared/utils/owners-api';
import Link from 'next/link';
import { Building2, Users, FileSignature } from 'lucide-react';

type Tab = 'properties' | 'owners' | 'mandates';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'properties', label: 'Propriétés', icon: Building2 },
    { key: 'owners', label: 'Propriétaires', icon: Users },
    { key: 'mandates', label: 'Mandats', icon: FileSignature },
];

/**
 * Inline owners tab content — extracted from pages/owners/index.tsx
 * since that page built its own layout instead of using a reusable component.
 */
function OwnersTab() {
    const router = useRouter();
    const [owners, setOwners] = useState<Owner[]>([]);
    const [filteredOwners, setFilteredOwners] = useState<Owner[]>([]);
    const [filters, setFilters] = useState<IOwnerFilters>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadOwners();
        loadStats();
    }, []);

    const loadOwners = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await ownersAPI.list();
            setOwners(data);
            setFilteredOwners(data);
        } catch (err: any) {
            console.error('Erreur chargement propriétaires:', err);
            setError(err.message || 'Erreur lors du chargement');
        } finally {
            setIsLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await ownersAPI.getStats();
            setStats(data);
        } catch (err) {
            console.error('Erreur stats:', err);
        }
    };

    const handleFilterChange = async (newFilters: IOwnerFilters) => {
        setFilters(newFilters);
        try {
            setIsLoading(true);
            const data = await ownersAPI.list(newFilters);
            setFilteredOwners(data);
        } catch (err) {
            console.error('Erreur filtrage:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (owner: Owner) => {
        if (!confirm(`Supprimer ${owner.firstName} ${owner.lastName} ?`)) return;
        try {
            await ownersAPI.delete(owner.id);
            await loadOwners();
            await loadStats();
        } catch (err: any) {
            alert('Erreur: ' + (err.message || 'Erreur inconnue'));
        }
    };

    const handleEdit = (owner: Owner) => {
        router.push(`/owners/${owner.id}/edit`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">
                        {filteredOwners.length} propriétaire(s) trouvé(s)
                    </p>
                </div>
                <Link
                    href="/owners/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    + Nouveau propriétaire
                </Link>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total" value={stats.total || 0} color="blue" icon="👥" />
                    <StatCard label="Actifs" value={stats.active || 0} color="green" icon="✓" />
                    <StatCard label="Avec propriétés" value={stats.withProperties || 0} color="purple" icon="🏠" />
                    <StatCard label="Mandats actifs" value={stats.withMandates || 0} color="amber" icon="📄" />
                </div>
            )}

            {/* Filters */}
            <OwnerFilters onFilterChange={handleFilterChange} />

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Table */}
            <OwnerList
                owners={filteredOwners}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={isLoading}
            />
        </div>
    );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
    const colorMap: Record<string, string> = {
        blue: 'border-blue-200 bg-blue-50',
        green: 'border-green-200 bg-green-50',
        purple: 'border-purple-200 bg-purple-50',
        amber: 'border-amber-200 bg-amber-50',
    };
    return (
        <div className={`rounded-xl border p-4 ${colorMap[color] || 'border-gray-200 bg-white'}`}>
            <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
                    <p className="text-xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}

export default function GestionImmobilierePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('properties');

    // Sync tab from URL query param ?tab=owners
    useEffect(() => {
        const tab = router.query.tab as Tab;
        if (tab && TABS.some(t => t.key === tab)) {
            setActiveTab(tab);
        }
    }, [router.query.tab]);

    const switchTab = (tab: Tab) => {
        setActiveTab(tab);
        // Update URL without full navigation
        router.replace({ pathname: '/gestion-immobiliere', query: { tab } }, undefined, { shallow: true });
    };

    return (
        <MainLayout
            title="Gestion Immobilière"
            breadcrumbs={[{ label: 'Gestion Immobilière' }]}
        >
            <div className="space-y-6">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="flex gap-0 -mb-px">
                        {TABS.map(({ key, label, icon: Icon }) => {
                            const isActive = activeTab === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => switchTab(key)}
                                    className={`
                    flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors
                    ${isActive
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }
                  `}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'properties' && <PropertyList />}
                    {activeTab === 'owners' && <OwnersTab />}
                    {activeTab === 'mandates' && <MandateList />}
                </div>
            </div>
        </MainLayout>
    );
}
