import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Filter, X } from 'lucide-react';
import { CommissionFilters } from '@/shared/utils/finance-api';

interface CommissionsFiltersProps {
    filters: CommissionFilters;
    onFiltersChange: (filters: CommissionFilters) => void;
}

export default function CommissionsFilters({ filters, onFiltersChange }: CommissionsFiltersProps) {
    const [localFilters, setLocalFilters] = React.useState<CommissionFilters>(filters);
    const [isExpanded, setIsExpanded] = React.useState(false);

    const handleApply = () => {
        onFiltersChange(localFilters);
    };

    const handleReset = () => {
        const emptyFilters: CommissionFilters = {};
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
                                        <SelectItem value="pending">En attente</SelectItem>
                                        <SelectItem value="partially_paid">Partiellement payée</SelectItem>
                                        <SelectItem value="paid">Payée</SelectItem>
                                        <SelectItem value="cancelled">Annulée</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Agent ID */}
                            <div className="space-y-2">
                                <label htmlFor="agentId" className="text-sm font-medium">
                                    ID Agent
                                </label>
                                <Input
                                    id="agentId"
                                    placeholder="clxxx..."
                                    value={localFilters.agentId || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, agentId: e.target.value || undefined })}
                                />
                            </div>

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
