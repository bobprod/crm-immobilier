import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { useEffect, useState } from 'react';
import { apiClient } from '@/shared/utils/api-client-backend';
import { useRouter } from 'next/router';

interface Property {
    id: string;
    title: string;
    type: string;
    price: number;
    currency: string;
    location: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    status: string;
}

interface PropertyListProps {
    initialLoading?: boolean;
    initialError?: string | null;
    initialProperties?: Property[];
}

export function PropertyList({ initialLoading, initialError, initialProperties }: PropertyListProps) {
    const [properties, setProperties] = useState<Property[]>(initialProperties || []);
    const [loading, setLoading] = useState<boolean>(initialLoading ?? false);
    const [error, setError] = useState<string | null>(initialError ?? null);
    const router = useRouter();

    useEffect(() => {
        // Check if we're in controlled state (test mode with initial props)
        const isInControlledState = 
            initialProperties !== undefined || 
            initialLoading !== undefined || 
            initialError !== undefined;

        // Only fetch if we're not in controlled/test mode
        if (!isInControlledState) {
            const fetchProperties = async () => {
                setLoading(true);
                setError(null);

                try {
                    const response = await apiClient.get('/properties');
                    setProperties(response.data);
                } catch (err) {
                    setError('Failed to fetch properties');
                    console.error('Error fetching properties:', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchProperties();
        } else {
            // In test mode, ensure state is set from initial props
            if (initialLoading !== undefined) setLoading(initialLoading);
            if (initialError !== undefined) setError(initialError);
            if (initialProperties !== undefined) setProperties(initialProperties);
        }
    }, [initialLoading, initialError, initialProperties]);

    if (loading) {
        return (
            <div data-testid="loading-state" className="flex items-center justify-center p-8">
                <div className="text-lg">Loading properties...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div data-testid="error-state" className="flex items-center justify-center p-8">
                <div className="text-red-500 text-lg">{error}</div>
            </div>
        );
    }

    return (
        <Card data-testid="properties-card">
            <CardHeader>
                <CardTitle>Properties List</CardTitle>
            </CardHeader>
            <CardContent>
                <Table data-testid="properties-table">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody data-testid="properties-tbody">
                        {properties.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-gray-500">
                                    No properties found
                                </TableCell>
                            </TableRow>
                        ) : (
                            properties.map((property) => (
                                <TableRow key={property.id} data-testid={`property-row-${property.id}`}>
                                    <TableCell>{property.title}</TableCell>
                                    <TableCell>{property.type}</TableCell>
                                    <TableCell>{`${property.price} ${property.currency}`}</TableCell>
                                    <TableCell>{property.location}</TableCell>
                                    <TableCell>{property.status}</TableCell>
                                    <TableCell>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            data-testid={`view-button-${property.id}`}
                                            onClick={() => router.push(`/properties/${property.id}`)}
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
