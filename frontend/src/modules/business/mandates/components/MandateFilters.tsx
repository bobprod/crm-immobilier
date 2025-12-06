import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface MandateFiltersProps {
    onFilterChange: (filters: any) => void;
}

export function MandateFilters({ onFilterChange }: MandateFiltersProps) {
    const [filters, setFilters] = useState({
        search: '',
        type: 'all',
        category: 'all',
        status: 'all',
        ownerId: '',
    });

    const handleChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);

        // Clean up 'all' values before sending to API
        const apiFilters = Object.entries(newFilters).reduce((acc, [k, v]) => {
            if (v && v !== 'all') {
                acc[k] = v;
            }
            return acc;
        }, {} as any);

        onFilterChange(apiFilters);
    };

    const clearFilters = () => {
        const reset = {
            search: '',
            type: 'all',
            category: 'all',
            status: 'all',
            ownerId: '',
        };
        setFilters(reset);
        onFilterChange({});
    };

    return (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Rechercher par référence..."
                            className="pl-9"
                            value={filters.search}
                            onChange={(e) => handleChange('search', e.target.value)}
                        />
                    </div>

                    {/* Type */}
                    <Select
                        value={filters.type}
                        onValueChange={(value) => handleChange('type', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Type de mandat" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les types</SelectItem>
                            <SelectItem value="exclusive">Exclusif</SelectItem>
                            <SelectItem value="semi_exclusive">Semi-exclusif</SelectItem>
                            <SelectItem value="simple">Simple</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Category */}
                    <Select
                        value={filters.category}
                        onValueChange={(value) => handleChange('category', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes catégories</SelectItem>
                            <SelectItem value="sale">Vente</SelectItem>
                            <SelectItem value="rental">Location</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Status */}
                    <Select
                        value={filters.status}
                        onValueChange={(value) => handleChange('status', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="expired">Expiré</SelectItem>
                            <SelectItem value="completed">Terminé</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:col-span-4 justify-end">
                        <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
                            <X className="mr-2 h-4 w-4" />
                            Réinitialiser
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
