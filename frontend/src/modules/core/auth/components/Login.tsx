import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useToast } from '@/shared/components/ui/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  // TEMPORARY: Set test credentials on mount
  useEffect(() => {
    setEmail('test@example.com');
    setPassword('password123');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password, name);
        toast({
          title: 'Inscription réussie',
          description: 'Votre compte a été créé avec succès',
        });
      } else {
        await login(email, password);
        toast({
          title: 'Connexion réussie',
          description: 'Bienvenue dans votre CRM',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isRegister ? 'Créer un compte' : 'Connexion'}
          </CardTitle>
          <CardDescription className="text-center">
            {isRegister
              ? 'Créez votre compte pour accéder au CRM'
              : 'Connectez-vous à votre compte CRM'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jean Dupont"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="password-input"
              />
              <input type="hidden" data-testid="password-value" value={password} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Chargement...' : (isRegister ? 'S\'inscrire' : 'Se connecter')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-blue-600 hover:underline"
            >
              {isRegister
                ? 'Vous avez déjà un compte ? Connectez-vous'
                : 'Pas de compte ? Inscrivez-vous'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
