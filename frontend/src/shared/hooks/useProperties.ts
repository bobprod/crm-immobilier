import { useState, useEffect } from 'react';
import { Property } from '../utils/properties-api';
import apiClient from '../utils/backend-api';

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/properties');
      const data = response.data;
      setProperties(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const createProperty = async (data: Partial<Property>) => {
    try {
      const response = await apiClient.post('/properties', data);
      const newProperty = response.data;
      setProperties((prev) => [...prev, newProperty]);
      return newProperty;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateProperty = async (id: string, data: Partial<Property>) => {
    try {
      const response = await apiClient.patch(`/properties/${id}`, data);
      const updatedProperty = response.data;
      setProperties((prev) => prev.map((p) => (p.id === id ? updatedProperty : p)));
      return updatedProperty;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteProperty = async (id: string) => {
    try {
      await apiClient.delete(`/properties/${id}`);
      setProperties((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getPropertyById = async (id: string) => {
    try {
      const response = await apiClient.get(`/properties/${id}`);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const searchProperties = async (criteria: any) => {
    try {
      const response = await apiClient.get('/properties', { params: criteria });
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    properties,
    loading,
    error,
    refresh: loadProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    getPropertyById,
    searchProperties,
  };
}
