import { useState, useEffect } from 'react';
import apiClient from '../utils/backend-api';

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

  const loadProspects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/prospects');
      const data = response.data;
      setProspects(Array.isArray(data) ? data : data.data || []);
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
      const response = await apiClient.post('/prospects', data);
      const newProspect = response.data;
      setProspects((prev) => [...prev, newProspect]);
      return newProspect;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateProspect = async (id: string, data: Partial<Prospect>) => {
    try {
      const response = await apiClient.put(`/prospects/${id}`, data);
      const updatedProspect = response.data;
      setProspects((prev) => prev.map((p) => (p.id === id ? updatedProspect : p)));
      return updatedProspect;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteProspect = async (id: string) => {
    try {
      await apiClient.delete(`/prospects/${id}`);
      setProspects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getProspectById = async (id: string) => {
    try {
      const response = await apiClient.get(`/prospects/${id}`);
      return response.data;
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
