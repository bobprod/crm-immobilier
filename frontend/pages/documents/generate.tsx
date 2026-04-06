import { useState } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { FileText, Sparkles, Download, Wand2 } from 'lucide-react';
import { apiClient } from '@/shared/utils/api-client-backend';

export default function GenerateDocumentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');

  const [formData, setFormData] = useState({
    type: 'contract',
    title: '',
    description: '',
    context: '',
  });

  const documentTypes = [
    { value: 'contract', label: 'Contrat de Vente' },
    { value: 'mandate', label: 'Mandat de Vente' },
    { value: 'offer', label: "Offre d'Achat" },
    { value: 'report', label: 'Rapport de Visite' },
    { value: 'letter', label: 'Lettre Commerciale' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGenerated(false);

    try {
      // Simulate AI document generation
      const response = await apiClient.post('/documents/generate', formData);
      setGeneratedContent(response.data?.content || 'Document généré avec succès');
      setGenerated(true);
    } catch (err: any) {
      console.error('Error generating document:', err);

      // Fallback: Generate mock content if API fails
      const mockContent = `
# ${formData.title}

## Type de Document
${documentTypes.find((t) => t.value === formData.type)?.label}

## Description
${formData.description}

## Contexte
${formData.context}

---

*Document généré automatiquement par l'IA*
*Date: ${new Date().toLocaleDateString('fr-FR')}*

## Contenu du Document

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ce document a été généré automatiquement en fonction des informations fournies.

### Section 1: Informations Générales
Les parties conviennent de...

### Section 2: Conditions
Conformément aux dispositions...

### Section 3: Signatures
Fait à [Ville], le [Date]

Signatures:
- Partie 1: _________________
- Partie 2: _________________
      `.trim();

      setGeneratedContent(mockContent);
      setGenerated(true);
      setError('API non disponible - Document généré en mode démo');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.title || 'document'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Générer un Document</h1>
          <p className="text-gray-600 mt-1">
            Créez des documents professionnels avec l'aide de l'IA
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">{error}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wand2 className="h-5 w-5 mr-2" />
                Paramètres du Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Titre du Document</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Ex: Contrat de vente - Appartement Paris 15e"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez brièvement le document..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    required
                    disabled={loading}
                    rows={3}
                  />
                </div>

                {/* Context */}
                <div className="space-y-2">
                  <Label htmlFor="context">Contexte / Informations Supplémentaires</Label>
                  <Textarea
                    id="context"
                    placeholder="Ajoutez des détails spécifiques..."
                    value={formData.context}
                    onChange={(e) => handleChange('context', e.target.value)}
                    disabled={loading}
                    rows={4}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    disabled={loading}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Génération...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Générer
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Aperçu du Document
                </CardTitle>
                {generated && (
                  <Button size="sm" variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!generated ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Le document généré apparaîtra ici</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{generatedContent}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
