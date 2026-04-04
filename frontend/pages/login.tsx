import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { Building2, Lock, Mail, AlertCircle } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Nettoyer les tokens stale au montage de la page login
  useEffect(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('[Login] Starting login process...');
      await login(email, password);

      // Wait a bit to ensure token is fully saved in localStorage
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify token is actually saved before redirecting
      const savedToken = localStorage.getItem('auth_token');
      console.log('[Login] Token verification:', savedToken ? 'Token found' : 'Token NOT found');

      if (!savedToken) {
        throw new Error('Token was not saved properly');
      }

      console.log('[Login] Redirecting to dashboard...');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('[Login] Login error:', err);
      setError(err?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[hsl(222,65%,22%)] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-1/3 -right-32 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 left-1/4 w-48 h-48 rounded-full bg-amber-500/10" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">CRM Immo</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Gestion Immobilière<br />
            <span className="text-amber-400">Professionnelle</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-md">
            Optimisez votre prospection, gérez vos leads et pilotez vos performances depuis une seule plateforme.
          </p>
        </div>

        <div className="relative z-10 flex gap-8">
          <div>
            <p className="text-3xl font-bold text-white">98%</p>
            <p className="text-slate-400 text-sm mt-1">Satisfaction client</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">3×</p>
            <p className="text-slate-400 text-sm mt-1">Plus de leads qualifiés</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">IA</p>
            <p className="text-slate-400 text-sm mt-1">Prospection automatisée</p>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center py-12 px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 bg-[hsl(222,65%,28%)] rounded-xl flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">CRM Immo</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1.5">Connexion</h2>
            <p className="text-slate-500 text-sm">Accédez à votre espace de gestion immobilière</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(222,65%,28%)] focus:border-transparent transition-shadow"
                  placeholder="vous@exemple.fr"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(222,65%,28%)] focus:border-transparent transition-shadow"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[hsl(222,65%,28%)] hover:bg-[hsl(222,65%,22%)] text-white text-sm font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(222,65%,28%)] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion en cours…
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} CRM Immobilier — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}
