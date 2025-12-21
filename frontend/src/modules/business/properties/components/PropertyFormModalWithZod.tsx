import React, { useEffect } from 'react';
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
import { Property, CreatePropertyDTO, PropertyType, PropertyPriority } from '@/shared/utils/properties-api';
import { useZodForm } from '@/shared/hooks/useZodForm';
import { propertySchema, PropertyFormData } from '@/shared/validation/schemas';
import { Controller } from 'react-hook-form';

interface PropertyFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreatePropertyDTO) => Promise<void>;
    property?: Property | null;
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

const PROPERTY_PRIORITIES: { value: PropertyPriority; label: string }[] = [
    { value: 'low', label: 'Basse' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'high', label: 'Haute' },
];

export function PropertyFormModalWithZod({
    isOpen,
    onClose,
    onSubmit,
    property,
    isLoading = false,
}: PropertyFormModalProps) {
    const isEditMode = !!property;

    // Initialiser le formulaire avec validation Zod
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        control,
        setValue,
    } = useZodForm({
        schema: propertySchema,
        defaultValues: {
            title: '',
            description: '',
            type: 'apartment',
            category: 'sale',
            price: 0,
            area: 0,
            bedrooms: 0,
            bathrooms: 0,
            address: '',
            city: '',
            zipCode: '',
            country: 'France',
            status: 'available',
            priority: 'medium',
        },
    });

    // Réinitialiser le formulaire quand le modal s'ouvre
    useEffect(() => {
        if (isOpen) {
            if (property) {
                // Mode édition - pré-remplir avec les données existantes
                reset({
                    title: property.title || '',
                    description: property.description || '',
                    type: property.type || 'apartment',
                    category: property.category || 'sale',
                    price: property.price || 0,
                    area: property.area || property.surface || 0,
                    bedrooms: property.bedrooms || 0,
                    bathrooms: property.bathrooms || 0,
                    address: property.address || '',
                    city: property.city || '',
                    zipCode: property.zipCode || '',
                    country: property.country || 'France',
                    status: property.status || 'available',
                    priority: property.priority || 'medium',
                });
            } else {
                // Mode création - réinitialiser
                reset();
            }
        }
    }, [isOpen, property, reset]);

    const onFormSubmit = async (data: PropertyFormData) => {
        try {
            // Convertir en CreatePropertyDTO (filtrer les champs non supportés par le backend)
            const { images, features, virtualTourUrl, videoUrl, latitude, longitude, ...coreData } = data;

            await onSubmit(coreData as CreatePropertyDTO);
        } catch (error) {
            console.error('Error submitting property:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
                    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Titre *</Label>
                            <Input
                                id="title"
                                data-testid="property-title-input"
                                {...register('title')}
                                placeholder="Ex: Appartement 3 pièces centre-ville"
                                className={errors.title ? 'border-red-500' : ''}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Type and Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type *</Label>
                                <Controller
                                    name="type"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
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
                                    )}
                                />
                                {errors.type && (
                                    <p className="text-sm text-red-500">{errors.type.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Catégorie *</Label>
                                <Controller
                                    name="category"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger id="category" data-testid="property-category-select">
                                                <SelectValue placeholder="Sélectionner" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sale">Vente</SelectItem>
                                                <SelectItem value="rent">Location</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priorité</Label>
                            <Controller
                                name="priority"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
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
                                )}
                            />
                        </div>

                        {/* Price and Area */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Prix (€) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    data-testid="property-price-input"
                                    {...register('price', { valueAsNumber: true })}
                                    placeholder="Ex: 250000"
                                    className={errors.price ? 'border-red-500' : ''}
                                />
                                {errors.price && (
                                    <p className="text-sm text-red-500">{errors.price.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="area">Surface (m²) *</Label>
                                <Input
                                    id="area"
                                    type="number"
                                    data-testid="property-area-input"
                                    {...register('area', { valueAsNumber: true })}
                                    placeholder="Ex: 120"
                                    className={errors.area ? 'border-red-500' : ''}
                                />
                                {errors.area && (
                                    <p className="text-sm text-red-500">{errors.area.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Bedrooms and Bathrooms */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bedrooms">Chambres</Label>
                                <Input
                                    id="bedrooms"
                                    type="number"
                                    data-testid="property-bedrooms-input"
                                    {...register('bedrooms', { valueAsNumber: true })}
                                    placeholder="0"
                                />
                                {errors.bedrooms && (
                                    <p className="text-sm text-red-500">{errors.bedrooms.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bathrooms">Salles de bain</Label>
                                <Input
                                    id="bathrooms"
                                    type="number"
                                    data-testid="property-bathrooms-input"
                                    {...register('bathrooms', { valueAsNumber: true })}
                                    placeholder="0"
                                />
                                {errors.bathrooms && (
                                    <p className="text-sm text-red-500">{errors.bathrooms.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Address and City */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="address">Adresse *</Label>
                                <Input
                                    id="address"
                                    data-testid="property-address-input"
                                    {...register('address')}
                                    placeholder="Ex: 123 Rue de la République"
                                    className={errors.address ? 'border-red-500' : ''}
                                />
                                {errors.address && (
                                    <p className="text-sm text-red-500">{errors.address.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">Ville *</Label>
                                <Input
                                    id="city"
                                    data-testid="property-city-input"
                                    {...register('city')}
                                    placeholder="Ex: Paris"
                                    className={errors.city ? 'border-red-500' : ''}
                                />
                                {errors.city && (
                                    <p className="text-sm text-red-500">{errors.city.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Zip Code */}
                        <div className="space-y-2">
                            <Label htmlFor="zipCode">Code postal</Label>
                            <Input
                                id="zipCode"
                                data-testid="property-zipcode-input"
                                {...register('zipCode')}
                                placeholder="Ex: 75001"
                                maxLength={5}
                            />
                            {errors.zipCode && (
                                <p className="text-sm text-red-500">{errors.zipCode.message}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                data-testid="property-description-input"
                                {...register('description')}
                                placeholder="Description détaillée du bien..."
                                rows={4}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">{errors.description.message}</p>
                            )}
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                data-testid="property-submit-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
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

export default PropertyFormModalWithZod;
