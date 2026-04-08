import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Loader2, Upload, X } from 'lucide-react';
import {
  Property,
  CreatePropertyData,
  PropertyType,
  PropertyStatus,
  PropertyPriority,
} from '@/shared/utils/properties-api';

interface PropertyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePropertyData, pendingImages?: File[]) => Promise<void>;
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

const TUNISIAN_CITIES = [
  'Tunis',
  'Ariana',
  'La Marsa',
  'Carthage',
  'Sidi Bou Said',
  'Gammarth',
  'Sousse',
  'Sfax',
  'Hammamet',
  'Nabeul',
  'Monastir',
  'Bizerte',
  'Djerba',
  'Tozeur',
  'Kairouan',
  'Gabès',
  'Mahdia',
];

const initialFormData: CreatePropertyData = {
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
  priority: 'medium',
  status: 'available',
};

export function PropertyFormModal({
  isOpen,
  onClose,
  onSubmit,
  property,
  isLoading = false,
}: PropertyFormModalProps) {
  const [formData, setFormData] = useState<CreatePropertyData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!property;

  // Reset form when modal opens/closes or property changes
  useEffect(() => {
    if (isOpen) {
      if (property) {
        // Edit mode - populate with existing data
        setFormData({
          title: property.title || '',
          description: property.description || '',
          type: property.type || 'apartment',
          category: property.category || 'sale',
          price: property.price || 0,
          area: property.area || 0,
          bedrooms: property.bedrooms || 0,
          bathrooms: property.bathrooms || 0,
          address: property.address || '',
          city: property.city || '',
          zipCode: property.zipCode || '',
          delegation: property.delegation || '',
          priority: property.priority || 'medium',
          status: property.status || 'available',
          latitude: (property as any).latitude || undefined,
          longitude: (property as any).longitude || undefined,
        } as any);
      } else {
        // Create mode - reset to initial
        setFormData(initialFormData);
      }
      setErrors({});
      setPendingImages([]);
      setImagePreviews([]);
    }
  }, [isOpen, property]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleImageFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validFiles = Array.from(files).filter(
      (f) => allowed.includes(f.type) && f.size <= 5 * 1024 * 1024
    );
    if (validFiles.length === 0) return;
    const previews = validFiles.map((f) => URL.createObjectURL(f));
    setPendingImages((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...previews]);
  }, []);

  const removeImage = useCallback(
    (index: number) => {
      URL.revokeObjectURL(imagePreviews[index]);
      setPendingImages((prev) => prev.filter((_, i) => i !== index));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    },
    [imagePreviews]
  );

  const handleChange = (field: keyof CreatePropertyData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
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
      await onSubmit(formData, pendingImages.length > 0 ? pendingImages : undefined);
      // Don't call onClose() here - let the parent handle it
    } catch (error) {
      // Error is handled by parent component (PropertyList) with toast notification
      // Just keep the modal open so user can fix validation issues
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Modifier la propriété' : 'Nouvelle propriété'}</DialogTitle>
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

            {/* Bedrooms and Bathrooms */}
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

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={(formData as any).status || 'available'}
                onValueChange={(value) => handleChange('status' as any, value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="reserved">À réserver</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="sold">Vendu</SelectItem>
                  <SelectItem value="rented">Loué</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
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
                <Select
                  value={formData.city || ''}
                  onValueChange={(value) => handleChange('city', value)}
                >
                  <SelectTrigger id="city" data-testid="property-city-input">
                    <SelectValue placeholder="Sélectionner une ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {TUNISIAN_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delegation">Délégation</Label>
                <Input
                  id="delegation"
                  value={(formData as any).delegation || ''}
                  onChange={(e) => handleChange('delegation' as any, e.target.value)}
                  placeholder="Ex: La Marsa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Code postal</Label>
                <Input
                  id="zipCode"
                  value={(formData as any).zipCode || ''}
                  onChange={(e) => handleChange('zipCode' as any, e.target.value)}
                  placeholder="Ex: 2070"
                />
              </div>
            </div>

            {/* Coordonnées GPS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.0001"
                  value={(formData as any).latitude || ''}
                  onChange={(e) => handleChange('latitude' as any, parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 36.8065"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.0001"
                  value={(formData as any).longitude || ''}
                  onChange={(e) =>
                    handleChange('longitude' as any, parseFloat(e.target.value) || 0)
                  }
                  placeholder="Ex: 10.1815"
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

            {/* Notes internes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                value={(formData as any).notes || ''}
                onChange={(e) => handleChange('notes' as any, e.target.value)}
                placeholder="Notes visibles uniquement par votre équipe..."
                rows={2}
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Photos du bien</Label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                  handleImageFiles(e.dataTransfer.files);
                }}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Cliquer ou glisser des images ici</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — max 5 Mo / image</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageFiles(e.target.files)}
                />
              </div>
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={src}
                        alt={`img-${i}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {property?.images && (property.images as string[]).length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Photos existantes :</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(property.images as string[]).map((src, i) => (
                      <img
                        key={i}
                        src={src.startsWith('http') ? src : `http://localhost:3001${src}`}
                        alt={`existing-${i}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Annuler
              </Button>
              <Button type="submit" data-testid="property-submit-button" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? 'Mise à jour...' : 'Création...'}
                  </>
                ) : isEditMode ? (
                  'Mettre à jour'
                ) : (
                  'Créer'
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
