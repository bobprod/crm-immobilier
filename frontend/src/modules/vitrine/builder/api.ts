const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getHeaders() {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('crm-token')) : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface VitrineTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  previewImage: string | null;
  category: string;
  fonts: { heading: string; body: string; accent: string };
  colors: Record<string, string>;
  defaultPages: any[];
}

export interface VitrinePage {
  id: string;
  vitrineConfigId: string;
  slug: string;
  title: string;
  puckData: any;
  order: number;
  isActive: boolean;
  isDefault: boolean;
}

export const builderApi = {
  // Templates
  getTemplates: () => request<VitrineTemplate[]>('/vitrine/builder/templates'),
  getTemplate: (slug: string) => request<VitrineTemplate>(`/vitrine/builder/templates/${slug}`),
  applyTemplate: (slug: string) => request<any>(`/vitrine/builder/templates/${slug}/apply`, { method: 'POST' }),

  // Pages
  getPages: () => request<VitrinePage[]>('/vitrine/builder/pages'),
  getPage: (id: string) => request<VitrinePage>(`/vitrine/builder/pages/${id}`),
  createPage: (data: { slug: string; title: string }) => request<VitrinePage>('/vitrine/builder/pages', { method: 'POST', body: JSON.stringify(data) }),
  updatePage: (id: string, data: Partial<VitrinePage>) => request<VitrinePage>(`/vitrine/builder/pages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  savePuckData: (id: string, puckData: any) => request<VitrinePage>(`/vitrine/builder/pages/${id}/puck-data`, { method: 'PUT', body: JSON.stringify({ puckData }) }),
  deletePage: (id: string) => request<void>(`/vitrine/builder/pages/${id}`, { method: 'DELETE' }),
  reorderPages: (pages: { id: string; order: number }[]) => request<VitrinePage[]>('/vitrine/builder/pages/reorder', { method: 'PUT', body: JSON.stringify({ pages }) }),

  // Config
  getConfig: () => request<{ id: string; slug: string; agencyName: string; templateId: string | null }>('/vitrine/config'),

  // Upload
  uploadImage: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('crm-token')) : null;
    const res = await fetch(`${API_BASE}/vitrine/builder/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  // Public
  getPublicPages: (slug: string) => request<{ slug: string; title: string; order: number }[]>(`/vitrine/builder/public/${slug}/pages`),
  getPublicPage: (slug: string, pageSlug: string) => request<{ config: any; page: VitrinePage; template: VitrineTemplate | null }>(`/vitrine/builder/public/${slug}/pages/${pageSlug}`),
};
