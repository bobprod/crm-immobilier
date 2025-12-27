import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Filter, X } from 'lucide-react';
import { InvoiceFilters } from '@/shared/utils/finance-api';

interface InvoicesFiltersProps {
    filters: InvoiceFilters;
    onFiltersChange: (filters: InvoiceFilters) => void;
}

export default function InvoicesFilters({ filters, onFiltersChange }: InvoicesFiltersProps) {
    const [localFilters, setLocalFilters] = React.useState<InvoiceFilters>(filters);
    const [isExpanded, setIsExpanded] = React.useState(false);

    const handleApply = () => {
        onFiltersChange(localFilters);
    };

    const handleReset = () => {
        const emptyFilters: InvoiceFilters = {};
        setLocalFilters(emptyFilters);
        onFiltersChange(emptyFilters);
    };

    const hasActiveFilters = Object.keys(filters).length > 0;

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-900">Filtres</h3>
                        {hasActiveFilters && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {Object.keys(filters).length} actif{Object.keys(filters).length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? 'Réduire' : 'Développer'}
                    </Button>
                </div>

                {isExpanded && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Statut */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Statut</label>
                                <Select
                                    value={localFilters.status || ''}
                                    onValueChange={(value) => setLocalFilters({ ...localFilters, status: value as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tous" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Tous</SelectItem>
                                        <SelectItem value="draft">Brouillon</SelectItem>
                                        <SelectItem value="sent">Envoyée</SelectItem>
                                        <SelectItem value="paid">Payée</SelectItem>
                                        <SelectItem value="partially_paid">Partiellement payée</SelectItem>
                                        <SelectItem value="overdue">En retard</SelectItem>
                                        <SelectItem value="cancelled">Annulée</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Type de client */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type de client</label>
                                <Select
                                    value={localFilters.clientType || ''}
                                    onValueChange={(value) => setLocalFilters({ ...localFilters, clientType: value as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tous" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Tous</SelectItem>
                                        <SelectItem value="buyer">Acheteur</SelectItem>
                                        <SelectItem value="seller">Vendeur</SelectItem>
                                        <SelectItem value="tenant">Locataire</SelectItem>
                                        <SelectItem value="landlord">Propriétaire</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Factures en retard */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">En retard</label>
                                <Select
                                    value={localFilters.overdue !== undefined ? String(localFilters.overdue) : ''}
                                    onValueChange={(value) => setLocalFilters({
                                        ...localFilters,
                                        overdue: value === '' ? undefined : value === 'true'
                                    })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tous" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Tous</SelectItem>
                                        <SelectItem value="true">Oui</SelectItem>
                                        <SelectItem value="false">Non</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Transaction ID */}
                            <div className="space-y-2">
                                <label htmlFor="transactionId" className="text-sm font-medium">
                                    ID Transaction
                                </label>
                                <Input
                                    id="transactionId"
                                    placeholder="clxxx..."
                                    value={localFilters.transactionId || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, transactionId: e.target.value || undefined })}
                                />
                            </div>

                            {/* Owner ID */}
                            <div className="space-y-2">
                                <label htmlFor="ownerId" className="text-sm font-medium">
                                    ID Propriétaire
                                </label>
                                <Input
                                    id="ownerId"
                                    placeholder="clxxx..."
                                    value={localFilters.ownerId || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, ownerId: e.target.value || undefined })}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            <Button onClick={handleApply} className="flex-1">
                                Appliquer les filtres
                            </Button>
                            <Button variant="outline" onClick={handleReset}>
                                <X className="mr-2 h-4 w-4" />
                                Réinitialiser
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
