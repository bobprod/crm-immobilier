import { useState, useEffect } from 'react';
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
import { Badge } from '@/shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { ArrowLeft, Settings, Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { apiClient } from '@/shared/utils/backend-api';

/**
 * AI Pricing Configuration
 *
 * Rôle autorisé: SUPER_ADMIN uniquement
 */

interface ModelPricing {
  id: string;
  provider: string;
  model: string;
  inputPricePerToken: number;
  outputPricePerToken: number;
  creditsPerToken: number;
  isActive: boolean;
}

export default function AIPricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [pricing, setPricing] = useState<ModelPricing[]>([]);
  const [edited, setEdited] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAccess();
    fetchPricing();
  }, []);

  const checkAccess = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      const user = response.data;
      setHasAccess(user.role === 'SUPER_ADMIN');
      setLoading(false);
    } catch (error) {
      console.error('Error checking access:', error);
      // Fallback pour dev
      setHasAccess(true);
      setLoading(false);
    }
  };

  const fetchPricing = async () => {
    try {
      // TODO: Remplacer par vrai appel API
      // const response = await fetch('/api/ai-billing/pricing');
      // const data = await response.json();

      // Données de démo
      setPricing([
        {
          id: '1',
          provider: 'Anthropic',
          model: 'Claude 3.5 Sonnet',
          inputPricePerToken: 0.000003,
          outputPricePerToken: 0.000015,
          creditsPerToken: 1.5,
          isActive: true,
        },
        {
          id: '2',
          provider: 'OpenAI',
          model: 'GPT-4 Turbo',
          inputPricePerToken: 0.00001,
          outputPricePerToken: 0.00003,
          creditsPerToken: 2.0,
          isActive: true,
        },
        {
          id: '3',
          provider: 'Google',
          model: 'Gemini 1.5 Pro',
          inputPricePerToken: 0.0000035,
          outputPricePerToken: 0.0000105,
          creditsPerToken: 1.2,
          isActive: true,
        },
        {
          id: '4',
          provider: 'DeepSeek',
          model: 'DeepSeek Chat',
          inputPricePerToken: 0.00000014,
          outputPricePerToken: 0.00000028,
          creditsPerToken: 0.3,
          isActive: true,
        },
        {
          id: '5',
          provider: 'Mistral',
          model: 'Mistral Large',
          inputPricePerToken: 0.000004,
          outputPricePerToken: 0.000012,
          creditsPerToken: 1.3,
          isActive: true,
        },
      ]);
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
  };

  const handlePricingChange = (id: string, field: string, value: any) => {
    setPricing((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: parseFloat(value) || 0 } : item
      )
    );
    setEdited((prev) => new Set(prev).add(id));
  };

  const handleSave = async () => {
    try {
      const updatedItems = pricing.filter((item) => edited.has(item.id));

      for (const item of updatedItems) {
        await fetch(`/api/ai-billing/pricing/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      }

      setEdited(new Set());
      alert('Tarifs mis à jour avec succès');
    } catch (error) {
      console.error('Error saving pricing:', error);
      alert('Erreur lors de la mise à jour des tarifs');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Accès refusé. Cette page est réservée aux SUPER_ADMIN.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Configuration Tarification IA - SUPER_ADMIN</title>
      </Head>

      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/settings/ai-billing')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center">
                Configuration Tarification
                <Badge variant="destructive" className="ml-3">
                  SUPER_ADMIN
                </Badge>
              </h1>
              <p className="text-muted-foreground">
                Configuration des tarifs par modèle et provider
              </p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={edited.size === 0}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer {edited.size > 0 && `(${edited.size})`}
          </Button>
        </div>

        {/* Warning */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Attention:</strong> Les modifications de tarifs affectent immédiatement
            la facturation de toutes les agences. Vérifiez bien vos modifications.
          </AlertDescription>
        </Alert>

        {/* Pricing Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Tarifs par Modèle
            </CardTitle>
            <CardDescription>
              Configurez le coût en crédits pour chaque modèle IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Modèle</TableHead>
                  <TableHead>Prix Input ($/token)</TableHead>
                  <TableHead>Prix Output ($/token)</TableHead>
                  <TableHead>Crédits/Token</TableHead>
                  <TableHead>Actif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricing.map((item) => (
                  <TableRow
                    key={item.id}
                    className={edited.has(item.id) ? 'bg-yellow-50' : ''}
                  >
                    <TableCell className="font-medium">{item.provider}</TableCell>
                    <TableCell>{item.model}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.000001"
                        value={item.inputPricePerToken}
                        onChange={(e) =>
                          handlePricingChange(
                            item.id,
                            'inputPricePerToken',
                            e.target.value
                          )
                        }
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.000001"
                        value={item.outputPricePerToken}
                        onChange={(e) =>
                          handlePricingChange(
                            item.id,
                            'outputPricePerToken',
                            e.target.value
                          )
                        }
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.1"
                        value={item.creditsPerToken}
                        onChange={(e) =>
                          handlePricingChange(
                            item.id,
                            'creditsPerToken',
                            e.target.value
                          )
                        }
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'}>
                        {item.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pricing Calculator */}
        <Card>
          <CardHeader>
            <CardTitle>Calculateur de Coûts</CardTitle>
            <CardDescription>
              Estimez le coût d'une requête en fonction des tokens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Tokens Input</Label>
                <Input type="number" defaultValue="1000" />
              </div>
              <div className="space-y-2">
                <Label>Tokens Output</Label>
                <Input type="number" defaultValue="500" />
              </div>
              <div className="space-y-2">
                <Label>Coût Total Estimé</Label>
                <div className="text-2xl font-bold">$0.0255</div>
                <p className="text-sm text-muted-foreground">≈ 38 crédits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
