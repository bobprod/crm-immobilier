import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  ArrowLeft,
  CreditCard,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
} from 'lucide-react';

/**
 * AI Credits Management Page
 *
 * Rôles autorisés: ADMIN, SUPER_ADMIN
 */

interface CreditTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund';
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function AICreditsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(12450);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState('5000');

  useEffect(() => {
    fetchCreditsData();
  }, []);

  const fetchCreditsData = async () => {
    try {
      // TODO: Remplacer par vrai appel API
      // const response = await fetch('/api/ai-billing/credits');
      // const data = await response.json();

      // Données de démo
      setTransactions([
        {
          id: '1',
          type: 'purchase',
          amount: 10000,
          balance: 12450,
          description: 'Achat de crédits - Pack Pro',
          createdAt: '2025-12-29T10:00:00Z',
          status: 'completed',
        },
        {
          id: '2',
          type: 'usage',
          amount: -1550,
          balance: 2450,
          description: 'Usage IA - Claude 3.5 Sonnet',
          createdAt: '2025-12-28T14:30:00Z',
          status: 'completed',
        },
        {
          id: '3',
          type: 'usage',
          amount: -2300,
          balance: 4000,
          description: 'Usage IA - GPT-4',
          createdAt: '2025-12-27T09:15:00Z',
          status: 'completed',
        },
        {
          id: '4',
          type: 'purchase',
          amount: 5000,
          balance: 6300,
          description: 'Achat de crédits - Pack Standard',
          createdAt: '2025-12-25T16:20:00Z',
          status: 'completed',
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching credits:', error);
      setLoading(false);
    }
  };

  const handlePurchaseCredits = async () => {
    try {
      // TODO: Appel API
      const response = await fetch('/api/ai-billing/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseInt(purchaseAmount) }),
      });

      if (response.ok) {
        setShowPurchaseDialog(false);
        fetchCreditsData();
      }
    } catch (error) {
      console.error('Error purchasing credits:', error);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'usage':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'refund':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
    };

    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Gestion des Crédits IA</title>
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
              <h1 className="text-3xl font-bold tracking-tight">Crédits IA</h1>
              <p className="text-muted-foreground">
                Gérez vos crédits et historique d'achats
              </p>
            </div>
          </div>

          <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Acheter des crédits
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Acheter des crédits IA</DialogTitle>
                <DialogDescription>
                  Rechargez votre balance de crédits pour continuer à utiliser les services IA
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Nombre de crédits</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    placeholder="5000"
                  />
                  <p className="text-sm text-muted-foreground">
                    Prix estimé: ${(parseInt(purchaseAmount) * 0.001).toFixed(2)}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label>Packs recommandés</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPurchaseAmount('5000')}
                    >
                      5K crédits
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPurchaseAmount('10000')}
                    >
                      10K crédits
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPurchaseAmount('25000')}
                    >
                      25K crédits
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handlePurchaseCredits}>
                  Confirmer l'achat
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Balance Actuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{balance.toLocaleString()} crédits</div>
            <p className="text-muted-foreground mt-2">
              Valeur estimée: ${(balance * 0.001).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Transactions History */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des Transactions</CardTitle>
            <CardDescription>
              Consultez tous vos achats et consommations de crédits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{getTransactionIcon(transaction.type)}</TableCell>
                    <TableCell className="font-medium">
                      {transaction.description}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.balance.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
