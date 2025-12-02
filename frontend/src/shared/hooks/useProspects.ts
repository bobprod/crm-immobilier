import { useState, useEffect } from 'react';

interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: string;
  createdAt?: string;
  [key: string]: any;
}

export function useProspects() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  };

  const loadProspects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/prospects`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des prospects');
      }

      const data = await response.json();
      setProspects(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading prospects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProspects();

    // Listen for lead conversion events from prospecting module
    const handleLeadConverted = () => {
      loadProspects();
    };

    window.addEventListener('prospecting:lead-converted', handleLeadConverted);
    return () => {
      window.removeEventListener('prospecting:lead-converted', handleLeadConverted);
    };
  }, []);

  const createProspect = async (data: Partial<Prospect>) => {
    try {
      const response = await fetch(`${API_URL}/prospects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du prospect');
      }

      const newProspect = await response.json();
      setProspects([...prospects, newProspect]);
      return newProspect;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateProspect = async (id: string, data: Partial<Prospect>) => {
    try {
      const response = await fetch(`${API_URL}/prospects/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du prospect');
      }

      const updatedProspect = await response.json();
      setProspects(prospects.map(p => p.id === id ? updatedProspect : p));
      return updatedProspect;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteProspect = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/prospects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du prospect');
      }

      setProspects(prospects.filter(p => p.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getProspectById = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/prospects/${id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du prospect');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    prospects,
    loading,
    error,
    refresh: loadProspects,
    createProspect,
    updateProspect,
    deleteProspect,
    getProspectById,
  };
}
