import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { usePersonnel } from '@/shared/hooks/usePersonnel';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { UserPlus, ChevronLeft, Save } from 'lucide-react';

interface AgencyUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function NewAgentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { createAgent, agents } = usePersonnel();

  const [agencyUsers, setAgencyUsers] = useState<AgencyUser[]>([]);
  const [form, setForm] = useState({
    userId: '',
    jobTitle: '',
    phone: '',
    hireDate: '',
    isActive: true,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setAgencyUsers(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadUsers();
  }, []);

  if (!user) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  // Filter out users who already have an agent profile
  const existingUserIds = new Set(agents.map((a) => a.userId));
  const availableUsers = agencyUsers.filter((u) => !existingUserIds.has(u.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId) {
      setError('Veuillez sélectionner un utilisateur');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createAgent({
        userId: form.userId,
        jobTitle: form.jobTitle || undefined,
        phone: form.phone || undefined,
        hireDate: form.hireDate || undefined,
        isActive: form.isActive,
        notes: form.notes || undefined,
      });
      router.push('/personnel');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout
      title="Nouvel agent"
      breadcrumbs={[
        { label: 'Personnel', href: '/personnel' },
        { label: 'Nouvel agent' },
      ]}
    >
      <div className="max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-blue-600" />
            Ajouter un agent
          </h1>
          <Link href="/personnel">
            <Button variant="ghost" className="gap-1">
              <ChevronLeft className="w-4 h-4" />
              Retour
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profil agent</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Utilisateur <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  required
                >
                  <option value="">-- Sélectionner un utilisateur --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email}) — {u.role}
                    </option>
                  ))}
                </select>
                {availableUsers.length === 0 && agencyUsers.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Tous les utilisateurs ont déjà un profil agent.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
                <Input
                  placeholder="Ex: Agent immobilier, Commercial, Manager..."
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <Input
                  type="tel"
                  placeholder="+216 XX XXX XXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'embauche
                </label>
                <Input
                  type="date"
                  value={form.hireDate}
                  onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Agent actif
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[80px]"
                  placeholder="Notes internes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Créer le profil
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
