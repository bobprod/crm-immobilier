import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import {
  ArrowLeft,
  Download,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/shared/utils/backend-api';

/**
 * Import Investment Project Page
 *
 * Import depuis Bricks, Homunity ou URL personnalisée
 */

export default function ImportProjectPage() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Bricks import
  const [bricksUrl, setBricksUrl] = useState('');

  // Homunity import
  const [homunityUrl, setHomunityUrl] = useState('');

  // Generic URL import
  const [genericUrl, setGenericUrl] = useState('');

  const handleImport = async (source: string, url: string) => {
    setImporting(true);
    setError('');
    setImportResult(null);

    try {
      const response = await apiClient.post('/investment/import', { source, url });
      const result = response.data;
      setImportResult(result);

      setTimeout(() => {
        router.push(`/investment/projects/${result.projectId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Importer un Projet d'Investissement</title>
      </Head>

      <div className="container max-w-3xl mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/investment')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Importer un Projet</h1>
            <p className="text-muted-foreground">
              Importez depuis Bricks, Homunity ou une URL personnalisée
            </p>
          </div>
        </div>

        {/* Import Result */}
        {importResult && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Import réussi !</strong> Redirection vers le projet...
            </AlertDescription>
          </Alert>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Import Tabs */}
        <Tabs defaultValue="bricks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bricks">
              <Download className="h-4 w-4 mr-2" />
              Bricks
            </TabsTrigger>
            <TabsTrigger value="homunity">
              <Download className="h-4 w-4 mr-2" />
              Homunity
            </TabsTrigger>
            <TabsTrigger value="url">
              <LinkIcon className="h-4 w-4 mr-2" />
              URL
            </TabsTrigger>
          </TabsList>

          {/* Bricks Tab */}
          <TabsContent value="bricks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Importer depuis Bricks</CardTitle>
                <CardDescription>
                  Collez l'URL d'un projet Bricks pour l'importer automatiquement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bricksUrl">URL du projet Bricks</Label>
                  <Input
                    id="bricksUrl"
                    placeholder="https://www.bricks.co/project/..."
                    value={bricksUrl}
                    onChange={(e) => setBricksUrl(e.target.value)}
                    disabled={importing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Exemple: https://www.bricks.co/project/residence-le-marais
                  </p>
                </div>

                <Button
                  onClick={() => handleImport('bricks', bricksUrl)}
                  disabled={importing || !bricksUrl}
                  className="w-full"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Importer depuis Bricks
                    </>
                  )}
                </Button>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Données importées:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Titre et description du projet</li>
                    <li>• Localisation (ville, pays)</li>
                    <li>• Prix total et ticket minimum</li>
                    <li>• Rendements (brut, net)</li>
                    <li>• Durée et dates</li>
                    <li>• Images et documents</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Homunity Tab */}
          <TabsContent value="homunity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Importer depuis Homunity</CardTitle>
                <CardDescription>
                  Collez l'URL d'un projet Homunity pour l'importer automatiquement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="homunityUrl">URL du projet Homunity</Label>
                  <Input
                    id="homunityUrl"
                    placeholder="https://www.homunity.fr/investissement/..."
                    value={homunityUrl}
                    onChange={(e) => setHomunityUrl(e.target.value)}
                    disabled={importing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Exemple: https://www.homunity.fr/investissement/appartements-lyon
                  </p>
                </div>

                <Button
                  onClick={() => handleImport('homunity', homunityUrl)}
                  disabled={importing || !homunityUrl}
                  className="w-full"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Importer depuis Homunity
                    </>
                  )}
                </Button>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Données importées:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Titre et description du projet</li>
                    <li>• Localisation (ville, pays)</li>
                    <li>• Prix total et ticket minimum</li>
                    <li>• Rendements (brut, net)</li>
                    <li>• Durée et dates</li>
                    <li>• Images et documents</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generic URL Tab */}
          <TabsContent value="url" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Importer depuis une URL</CardTitle>
                <CardDescription>
                  Importez depuis n'importe quelle page web (nécessite un parsing manuel)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="genericUrl">URL du projet</Label>
                  <Input
                    id="genericUrl"
                    placeholder="https://..."
                    value={genericUrl}
                    onChange={(e) => setGenericUrl(e.target.value)}
                    disabled={importing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Toute URL de projet d'investissement immobilier
                  </p>
                </div>

                <Button
                  onClick={() => handleImport('generic', genericUrl)}
                  disabled={importing || !genericUrl}
                  className="w-full"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Importer depuis URL
                    </>
                  )}
                </Button>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Note:</strong> L'import depuis une URL générique utilise l'IA pour
                    extraire les données. Vérifiez les informations importées avant de valider.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Besoin d'aide ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Bricks & Homunity:</strong> L'import est automatique et fiable.
              Toutes les données sont extraites et normalisées.
            </p>
            <p>
              <strong>URL générique:</strong> L'IA tente d'extraire les informations.
              Vous devrez peut-être compléter manuellement certains champs.
            </p>
            <p>
              <strong>Après l'import:</strong> Le projet est analysé automatiquement et
              vous recevez un score global avec recommandations.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
