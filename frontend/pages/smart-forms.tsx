import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { SmartInput } from '@/modules/intelligence/smart-forms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { FormInput, Sparkles } from 'lucide-react';

export default function SmartFormsPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    budget: '',
    propertyType: '',
  });

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Formulaire soumis avec succès! (Mode démo)');
  };

  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      city: '',
      address: '',
      budget: '',
      propertyType: '',
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FormInput className="h-8 w-8 text-blue-600" />
              Smart Forms Auto-Fill
            </h1>
            <p className="text-gray-600 mt-2">
              Auto-complétion intelligente basée sur votre historique de saisie
            </p>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            <Sparkles className="h-3 w-3 mr-1" />
            Intelligence IA
          </Badge>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 rounded-full p-2">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">Comment ça marche ?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✨ Commencez à taper dans un champ et les suggestions apparaissent automatiquement</li>
                  <li>🎯 Les suggestions sont triées par fréquence d'utilisation</li>
                  <li>⚡ Sélectionnez une suggestion pour remplir instantanément le champ</li>
                  <li>📊 Plus vous utilisez le système, plus il devient précis</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Form */}
        <Card>
          <CardHeader>
            <CardTitle>Formulaire de Création de Prospect</CardTitle>
            <CardDescription>
              Essayez de taper dans les champs ci-dessous pour voir l'auto-complétion en action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Informations Personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Prénom <span className="text-xs text-gray-500">(ex: Ahmed, Mohamed)</span>
                    </label>
                    <SmartInput
                      fieldName="firstName"
                      formType="prospect"
                      value={formData.firstName}
                      onChange={handleInputChange('firstName')}
                      placeholder="Tapez un prénom..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nom <span className="text-xs text-gray-500">(ex: Ben Ali, Trabelsi)</span>
                    </label>
                    <SmartInput
                      fieldName="lastName"
                      formType="prospect"
                      value={formData.lastName}
                      onChange={handleInputChange('lastName')}
                      placeholder="Tapez un nom..."
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Téléphone <span className="text-xs text-gray-500">(ex: +216 98 123 456)</span>
                    </label>
                    <SmartInput
                      fieldName="phone"
                      formType="prospect"
                      value={formData.phone}
                      onChange={handleInputChange('phone')}
                      placeholder="+216..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email <span className="text-xs text-gray-500">(ex: exemple@email.com)</span>
                    </label>
                    <SmartInput
                      fieldName="email"
                      formType="prospect"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      placeholder="email@exemple.com"
                      type="email"
                    />
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Localisation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Ville <span className="text-xs text-gray-500">(ex: La Marsa, Tunis)</span>
                    </label>
                    <SmartInput
                      fieldName="city"
                      formType="prospect"
                      value={formData.city}
                      onChange={handleInputChange('city')}
                      placeholder="Tapez une ville..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Adresse <span className="text-xs text-gray-500">(optionnel)</span>
                    </label>
                    <SmartInput
                      fieldName="address"
                      formType="prospect"
                      value={formData.address}
                      onChange={handleInputChange('address')}
                      placeholder="Rue, Avenue..."
                    />
                  </div>
                </div>
              </div>

              {/* Property Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Préférences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Budget <span className="text-xs text-gray-500">(ex: 300000, 500K)</span>
                    </label>
                    <SmartInput
                      fieldName="budget"
                      formType="prospect"
                      value={formData.budget}
                      onChange={handleInputChange('budget')}
                      placeholder="Budget en TND..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Type de bien <span className="text-xs text-gray-500">(ex: Appartement, Villa)</span>
                    </label>
                    <SmartInput
                      fieldName="propertyType"
                      formType="prospect"
                      value={formData.propertyType}
                      onChange={handleInputChange('propertyType')}
                      placeholder="Appartement, Villa, Studio..."
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button type="submit" className="flex-1">
                  Créer le Prospect
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  Réinitialiser
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Benefits Card */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Bénéfices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">5 min</div>
                <div className="text-sm text-gray-600">Économisés par prospect</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">150h</div>
                <div className="text-sm text-gray-600">Économisées par mois</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">90%</div>
                <div className="text-sm text-gray-600">Réduction des erreurs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
