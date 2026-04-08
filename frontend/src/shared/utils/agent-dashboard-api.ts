const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function fetchAgencyDashboard(year?: number, month?: number) {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (month) params.set('month', String(month));
  const res = await fetch(`${API_BASE}/dashboard/agent/agency?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch agency dashboard');
  return res.json();
}

export async function fetchMyPerformance(year?: number, month?: number) {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (month) params.set('month', String(month));
  const res = await fetch(`${API_BASE}/dashboard/agent/me?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch my performance');
  return res.json();
}

export async function fetchAgentPerformance(agentId: string, year?: number, month?: number) {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (month) params.set('month', String(month));
  const res = await fetch(`${API_BASE}/dashboard/agent/agent/${agentId}?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch agent performance');
  return res.json();
}
