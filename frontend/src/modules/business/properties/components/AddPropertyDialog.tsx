import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Plus, Upload, MapPin, X } from 'lucide-react';

interface Property {
  title: string;
  type: string;
  price: number;
  currency: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: string;
  description: string;
  features: string[];
  images: string[];
  coordinates?: { lat: number; lng: number };
}

interface AddPropertyDialogProps {
  language?: string;
  currency?: string;
  onAddProperty: (property: Property) => void;
}

const AddPropertyDialog = ({
  language = 'fr',
  currency = 'TND',
  onAddProperty,
}: AddPropertyDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newProperty, setNewProperty] = useState<Property>({
    title: '',
    type: '',
    price: 0,
    currency: currency,
    location: '',
    bedrooms: 0,
    bathrooms: 0,
    area: 0,
    status: 'For Sale',
    description: '',
    features: [],
    images: [],
  });

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [mapProvider, setMapProvider] = useState('google');
  const [showMapSelector, setShowMapSelector] = useState(false);

  const propertyTypes = ['Apartment', 'Villa', 'House', 'Studio', 'Commercial', 'Land'];

  const propertyFeatures =
    language === 'fr'
      ? [
          'Piscine',
          'Jardin',
          'Garage',
          'Balcon',
          'Ascenseur',
          'Sécurité',
          'Climatisation',
          'Chauffage',
          'Meublé',
          'Vue Mer',
          'Vue Montagne',
          'Vue Ville',
          'Cuisine',
          'Parking',
          'Terrasse',
        ]
      : [
          'Swimming Pool',
          'Garden',
          'Garage',
          'Balcony',
          'Elevator',
          'Security',
          'Air Conditioning',
          'Heating',
          'Furnished',
          'Sea View',
          'Mountain View',
          'City View',
          'Kitchen',
          'Parking',
          'Terrace',
        ];

  const propertyStatuses = ['For Sale', 'For Rent', 'Sold', 'Reserved'];

  const handleFeatureToggle = (feature: string) => {
    const updatedFeatures = selectedFeatures.includes(feature)
      ? selectedFeatures.filter((f) => f !== feature)
      : [...selectedFeatures, feature];
    setSelectedFeatures(updatedFeatures);
    setNewProperty({ ...newProperty, features: updatedFeatures });
  };

  const handleAddProperty = () => {
    onAddProperty(newProperty);
    setNewProperty({
      title: '',
      type: '',
      price: 0,
      currency: currency,
      location: '',
      bedrooms: 0,
      bathrooms: 0,
      area: 0,
      status: 'For Sale',
      description: '',
      features: [],
      images: [],
    });
    setSelectedFeatures([]);
    setIsOpen(false);
  };

  const handleImageUpload = () => {
    // Simulate image upload - in real app, this would handle file upload
    const mockImageUrl = `https://images.unsplash.com/photo-${Date.now()}?w=800&q=80`;
    setNewProperty({
      ...newProperty,
      images: [...newProperty.images, mockImageUrl],
    });
  };

  const removeImage = (index: number) => {
    const updatedImages = newProperty.images.filter((_, i) => i !== index);
    setNewProperty({ ...newProperty, images: updatedImages });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {language === 'fr' ? 'Ajouter Bien' : 'Add Property'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'fr' ? 'Nouveau Bien Immobilier' : 'New Property'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {language === 'fr' ? 'Informations de base' : 'Basic Information'}
            </h3>
            <div className="space-y-2">
              <Label htmlFor="title">{language === 'fr' ? 'Titre' : 'Title'}</Label>
              <Input
                id="title"
                value={newProperty.title}
                onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
                placeholder="Villa moderne avec vue mer..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="type">{language === 'fr' ? 'Type' : 'Type'}</Label>
                <Select
                  value={newProperty.type}
                  onValueChange={(value) => setNewProperty({ ...newProperty, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{language === 'fr' ? 'Statut' : 'Status'}</Label>
                <Select
                  value={newProperty.status}
                  onValueChange={(value) => setNewProperty({ ...newProperty, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="price">{language === 'fr' ? 'Prix' : 'Price'}</Label>
                <Input
                  id="price"
                  type="number"
                  value={newProperty.price}
                  onChange={(e) =>
                    setNewProperty({
                      ...newProperty,
                      price: Number(e.target.value),
                    })
                  }
                  placeholder="500000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">{language === 'fr' ? 'Devise' : 'Currency'}</Label>
                <Select
                  value={newProperty.currency}
                  onValueChange={(value) => setNewProperty({ ...newProperty, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TND">TND</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{language === 'fr' ? 'Localisation' : 'Location'}</Label>
              <div className="flex space-x-2">
                <Input
                  id="location"
                  value={newProperty.location}
                  onChange={(e) => setNewProperty({ ...newProperty, location: e.target.value })}
                  placeholder="La Marsa, Tunis"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMapSelector(!showMapSelector)}
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
              {showMapSelector && (
                <Card className="p-4">
                  <div className="space-y-2">
                    <Label>
                      {language === 'fr' ? 'Sélectionner sur la carte' : 'Select on map'}
                    </Label>
                    <Select value={mapProvider} onValueChange={setMapProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Map provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google Maps</SelectItem>
                        <SelectItem value="openstreet">OpenStreetMap</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="h-48 bg-muted rounded flex items-center justify-center">
                      <p className="text-muted-foreground">
                        {language === 'fr'
                          ? "Carte interactive - Cliquez pour sélectionner l'emplacement"
                          : 'Interactive map - Click to select location'}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">{language === 'fr' ? 'Chambres' : 'Bedrooms'}</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={newProperty.bedrooms}
                  onChange={(e) =>
                    setNewProperty({
                      ...newProperty,
                      bedrooms: Number(e.target.value),
                    })
                  }
                  placeholder="3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">
                  {language === 'fr' ? 'Salles de bain' : 'Bathrooms'}
                </Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={newProperty.bathrooms}
                  onChange={(e) =>
                    setNewProperty({
                      ...newProperty,
                      bathrooms: Number(e.target.value),
                    })
                  }
                  placeholder="2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">{language === 'fr' ? 'Surface (m²)' : 'Area (m²)'}</Label>
                <Input
                  id="area"
                  type="number"
                  value={newProperty.area}
                  onChange={(e) =>
                    setNewProperty({
                      ...newProperty,
                      area: Number(e.target.value),
                    })
                  }
                  placeholder="150"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">
                {language === 'fr' ? 'Description' : 'Description'}
              </Label>
              <Textarea
                id="description"
                value={newProperty.description}
                onChange={(e) =>
                  setNewProperty({
                    ...newProperty,
                    description: e.target.value,
                  })
                }
                placeholder="Description détaillée du bien..."
                rows={4}
              />
            </div>
          </div>

          {/* Features and Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {language === 'fr' ? 'Caractéristiques' : 'Features'}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {propertyFeatures.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature}
                    checked={selectedFeatures.includes(feature)}
                    onCheckedChange={() => handleFeatureToggle(feature)}
                  />
                  <label htmlFor={feature} className="text-sm">
                    {feature}
                  </label>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>{language === 'fr' ? 'Images' : 'Images'}</Label>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleImageUpload}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {language === 'fr' ? 'Télécharger Images' : 'Upload Images'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {language === 'fr'
                    ? 'Formats acceptés: JPG, PNG, WebP (max 5MB par image)'
                    : 'Accepted formats: JPG, PNG, WebP (max 5MB per image)'}
                </p>
              </div>
              {newProperty.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {newProperty.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Property ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{language === 'fr' ? 'Documents du Bien' : 'Property Documents'}</Label>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Simulate document upload
                    const mockDocUrl = `https://example.com/document-${Date.now()}.pdf`;
                    setNewProperty({
                      ...newProperty,
                      images: [...newProperty.images, mockDocUrl],
                    });
                  }}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {language === 'fr' ? 'Télécharger Documents' : 'Upload Documents'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {language === 'fr'
                    ? 'Plans, certificats de propriété, diagnostics (PDF, DOC, max 10MB)'
                    : 'Plans, property certificates, diagnostics (PDF, DOC, max 10MB)'}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {language === 'fr' ? 'Annuler' : 'Cancel'}
          </Button>
          <Button onClick={handleAddProperty}>
            {language === 'fr' ? 'Ajouter' : 'Add Property'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPropertyDialog;
