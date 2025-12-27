import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Filter, X } from 'lucide-react';
import { PaymentFilters } from '@/shared/utils/finance-api';

interface PaymentsFiltersProps {
    filters: PaymentFilters;
    onFiltersChange: (filters: PaymentFilters) => void;
}

export default function PaymentsFilters({ filters, onFiltersChange }: PaymentsFiltersProps) {
    const [localFilters, setLocalFilters] = React.useState<PaymentFilters>(filters);
    const [isExpanded, setIsExpanded] = React.useState(false);

    const handleApply = () => {
        onFiltersChange(localFilters);
    };

    const handleReset = () => {
        const emptyFilters: PaymentFilters = {};
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
                            {/* Méthode de paiement */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Méthode de paiement</label>
                                <Select
                                    value={localFilters.method || ''}
                                    onValueChange={(value) => setLocalFilters({ ...localFilters, method: value as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Toutes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Toutes</SelectItem>
                                        <SelectItem value="cash">Espèces</SelectItem>
                                        <SelectItem value="check">Chèque</SelectItem>
                                        <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                                        <SelectItem value="credit_card">Carte de crédit</SelectItem>
                                        <SelectItem value="other">Autre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Invoice ID */}
                            <div className="space-y-2">
                                <label htmlFor="invoiceId" className="text-sm font-medium">
                                    ID Facture
                                </label>
                                <Input
                                    id="invoiceId"
                                    placeholder="clxxx..."
                                    value={localFilters.invoiceId || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, invoiceId: e.target.value || undefined })}
                                />
                            </div>

                            {/* Commission ID */}
                            <div className="space-y-2">
                                <label htmlFor="commissionId" className="text-sm font-medium">
                                    ID Commission
                                </label>
                                <Input
                                    id="commissionId"
                                    placeholder="clxxx..."
                                    value={localFilters.commissionId || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, commissionId: e.target.value || undefined })}
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
