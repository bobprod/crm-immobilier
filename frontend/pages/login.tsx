import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import {
  Building2,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  TrendingUp,
  Users,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@crm.com');
  const [password, setPassword] = useState('Test1234!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    // Trigger entrance animation
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const savedToken = localStorage.getItem('auth_token');
      if (!savedToken) throw new Error('Token was not saved properly');
      router.push('/dashboard');
    } catch (err: any) {
      if (err?.status === 0 || err?.message?.includes('Impossible de contacter')) {
        setError('Impossible de contacter le serveur. Vérifiez que le backend est démarré.');
      } else {
        setError(err?.message || 'Email ou mot de passe incorrect');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: TrendingUp, label: 'Prospection IA automatisée', color: 'text-amber-400' },
    { icon: Users, label: 'Gestion CRM avancée des leads', color: 'text-blue-400' },
    { icon: Zap, label: 'Tableaux de bord en temps réel', color: 'text-green-400' },
    { icon: CheckCircle2, label: 'Matching prospect-bien intelligent', color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden">
      {/* ─── Left panel ─────────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-14"
        style={{
          background:
            'linear-gradient(135deg, hsl(222,70%,16%) 0%, hsl(222,60%,24%) 50%, hsl(230,55%,28%) 100%)',
        }}
      >
        {/* Animated background shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-5 border border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-5 border border-white" />
        </div>

        {/* Top logo */}
        <div
          className="relative z-10 transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(-20px)',
          }}
        >
          <div className="flex items-center gap-3 mb-14">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/30">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-wide">CRM Immo</span>
              <p className="text-xs text-slate-400 -mt-0.5">Plateforme Professionnelle</p>
            </div>
          </div>

          <h1 className="text-5xl font-extrabold text-white leading-tight mb-5 tracking-tight">
            Gestion
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}
            >
              Immobilière IA
            </span>
          </h1>
          <p className="text-slate-300 text-base leading-relaxed max-w-sm mb-12">
            Pilotez votre agence, automatisez votre prospection et convertissez plus de leads grâce
            à l'intelligence artificielle.
          </p>

          {/* Feature list */}
          <div className="space-y-3.5">
            {features.map((feat, i) => (
              <div
                key={i}
                className="flex items-center gap-3 transition-all duration-500"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-30px)',
                  transitionDelay: `${200 + i * 100}ms`,
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <feat.icon className={`w-4 h-4 ${feat.color}`} />
                </div>
                <span className="text-sm text-slate-200 font-medium">{feat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div
          className="relative z-10 flex gap-6 transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: '500ms',
          }}
        >
          {[
            { value: '98%', label: 'Satisfaction' },
            { value: '3×', label: 'Plus de leads' },
            { value: '50+', label: 'Agences actives' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/10 flex-1 text-center"
            >
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Right form panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center py-12 px-8 bg-white">
        <div
          className="w-full max-w-[400px] transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 bg-[hsl(222,65%,28%)] rounded-xl flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">CRM Immo</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
              Bon retour 👋
            </h2>
            <p className="text-slate-500 text-sm">Connectez-vous à votre espace de gestion.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-2xl text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Adresse email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[hsl(222,65%,35%)] transition-colors" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(222,65%,28%)] focus:border-transparent transition-all bg-slate-50 focus:bg-white hover:border-slate-300"
                  placeholder="vous@exemple.fr"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Mot de passe
                </label>
                <a
                  href="#"
                  className="text-xs text-[hsl(222,65%,40%)] hover:text-[hsl(222,65%,28%)] font-medium transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Contactez votre administrateur pour réinitialiser votre mot de passe.');
                  }}
                >
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[hsl(222,65%,35%)] transition-colors" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(222,65%,28%)] focus:border-transparent transition-all bg-slate-50 focus:bg-white hover:border-slate-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 px-4 text-white text-sm font-bold rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group mt-2"
              style={{
                background: 'linear-gradient(135deg, hsl(222,65%,28%) 0%, hsl(222,65%,38%) 100%)',
              }}
            >
              {/* Shimmer on hover */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity rounded-2xl" />
              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connexion en cours…</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">Se connecter</span>
              )}
            </button>
          </form>

          {/* Footer hint */}
          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500 text-center font-medium">
              🔐 Compte par défaut · <span className="font-mono text-slate-700">admin@crm.com</span>{' '}
              / <span className="font-mono text-slate-700">Admin123!</span>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} CRM Immobilier — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}
