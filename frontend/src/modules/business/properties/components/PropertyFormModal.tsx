import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Property, CreatePropertyDTO, PropertyType, PropertyStatus, PropertyPriority } from '@/shared/utils/properties-api';

interface PropertyFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreatePropertyDTO) => Promise<void>;
    property?: Property | null; // If provided, we're in edit mode
    isLoading?: boolean;
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
    { value: 'apartment', label: 'Appartement' },
    { value: 'house', label: 'Maison' },
    { value: 'villa', label: 'Villa' },
    { value: 'studio', label: 'Studio' },
    { value: 'land', label: 'Terrain' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'office', label: 'Bureau' },
];

const PROPERTY_STATUSES: { value: PropertyStatus; label: string }[] = [
    { value: 'available', label: 'Disponible' },
    { value: 'reserved', label: 'Réservé' },
    { value: 'sold', label: 'Vendu' },
    { value: 'rented', label: 'Loué' },
    { value: 'pending', label: 'En attente' },
];

const PROPERTY_PRIORITIES: { value: PropertyPriority; label: string }[] = [
    { value: 'low', label: 'Basse' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'high', label: 'Haute' },
    { value: 'urgent', label: 'Urgente' },
];

const initialFormData: CreatePropertyDTO = {
    title: '',
    description: '',
    type: 'apartment',
    category: 'sale',
    price: 0,
    area: 0,
    // rooms: 0, // Removed - not supported by backend
    bedrooms: 0,
    bathrooms: 0,
    address: '',
    city: '',
    priority: 'medium',
};

export function PropertyFormModal({
    isOpen,
    onClose,
    onSubmit,
    property,
    isLoading = false,
}: PropertyFormModalProps) {
    const [formData, setFormData] = useState<CreatePropertyDTO>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const isEditMode = !!property;

    // Reset form when modal opens/closes or property changes
    useEffect(() => {
        if (isOpen) {
            if (property) {
                // Edit mode - populate with existing data
                // Note: Don't include 'rooms' as it's not supported by the backend
                setFormData({
                    title: property.title || '',
                    description: property.description || '',
                    type: property.type || 'apartment',
                    price: property.price || 0,
                    area: property.area || property.surface || 0,
                    bedrooms: property.bedrooms || 0,
                    bathrooms: property.bathrooms || 0,
                    address: property.address || '',
                    city: property.city || '',
                    priority: property.priority || 'medium',
                });
            } else {
                // Create mode - reset to initial
                setFormData(initialFormData);
            }
            setErrors({});
        }
    }, [isOpen, property]);

    const handleChange = (field: keyof CreatePropertyDTO, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when field is modified
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title?.trim()) {
            newErrors.title = 'Le titre est requis';
        }
        if (!formData.type) {
            newErrors.type = 'Le type est requis';
        }
        if (!formData.price || formData.price <= 0) {
            newErrors.price = 'Le prix doit être supérieur à 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSubmitting(true);
        try {
            // Filter out rooms field before submitting (backend doesn't support it)
            const { rooms, ...dataToSubmit } = formData;
            await onSubmit(dataToSubmit as CreatePropertyDTO);
            // Don't call onClose() here - let the parent handle it
        } catch (error) {
            console.error('Error submitting property:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode ? 'Modifier la propriété' : 'Nouvelle propriété'}
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Titre *</Label>
                            <Input
                                id="title"
                                data-testid="property-title-input"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="Ex: Appartement 3 pièces centre-ville"
                                className={errors.title ? 'border-red-500' : ''}
                            />
                            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                        </div>

                        {/* Type and Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => handleChange('type', value as PropertyType)}
                                >
                                    <SelectTrigger id="type" data-testid="property-type-select">
                                        <SelectValue placeholder="Sélectionner un type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROPERTY_TYPES.map(({ value, label }) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Catégorie *</Label>
                                <Select
                                    value={formData.category || 'sale'}
                                    onValueChange={(value) => handleChange('category', value as 'sale' | 'rent')}
                                >
                                    <SelectTrigger id="category" data-testid="property-category-select">
                                        <SelectValue placeholder="Sélectionner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sale">Vente</SelectItem>
                                        <SelectItem value="rent">Location</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priorité</Label>
                            <Select
                                value={formData.priority || 'medium'}
                                onValueChange={(value) => handleChange('priority', value as PropertyPriority)}
                            >
                                <SelectTrigger id="priority" data-testid="property-priority-select">
                                    <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROPERTY_PRIORITIES.map(({ value, label }) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Price and Area */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Prix (TND) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    data-testid="property-price-input"
                                    value={formData.price || ''}
                                    onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                                    placeholder="Ex: 250000"
                                    className={errors.price ? 'border-red-500' : ''}
                                />
                                {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="area">Surface (m²)</Label>
                                <Input
                                    id="area"
                                    type="number"
                                    data-testid="property-area-input"
                                    value={formData.area || ''}
                                    onChange={(e) => handleChange('area', parseFloat(e.target.value) || 0)}
                                    placeholder="Ex: 120"
                                />
                            </div>
                        </div>

                        {/* Bedrooms and Bathrooms (rooms field removed - not supported by backend) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bedrooms">Chambres</Label>
                                <Input
                                    id="bedrooms"
                                    type="number"
                                    data-testid="property-bedrooms-input"
                                    value={formData.bedrooms || ''}
                                    onChange={(e) => handleChange('bedrooms', parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bathrooms">Salles de bain</Label>
                                <Input
                                    id="bathrooms"
                                    type="number"
                                    data-testid="property-bathrooms-input"
                                    value={formData.bathrooms || ''}
                                    onChange={(e) => handleChange('bathrooms', parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="address">Adresse</Label>
                                <Input
                                    id="address"
                                    data-testid="property-address-input"
                                    value={formData.address || ''}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    placeholder="Ex: 123 Rue de la République"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">Ville</Label>
                                <Input
                                    id="city"
                                    data-testid="property-city-input"
                                    value={formData.city || ''}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    placeholder="Ex: Tunis"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                data-testid="property-description-input"
                                value={formData.description || ''}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Description détaillée du bien..."
                                rows={4}
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={submitting}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                data-testid="property-submit-button"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isEditMode ? 'Mise à jour...' : 'Création...'}
                                    </>
                                ) : (
                                    isEditMode ? 'Mettre à jour' : 'Créer'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default PropertyFormModal;
