import { useState, useEffect } from 'react';
import { Property } from '../utils/properties-api';

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/properties`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des biens');
      }

      const data = await response.json();
      setProperties(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load on client-side to avoid SSR issues
    if (typeof window !== 'undefined') {
      loadProperties();
    }
  }, []);

  const createProperty = async (data: Partial<Property>) => {
    try {
      const response = await fetch(`${API_URL}/properties`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du bien');
      }

      const newProperty = await response.json();
      setProperties([...properties, newProperty]);
      return newProperty;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateProperty = async (id: string, data: Partial<Property>) => {
    try {
      const response = await fetch(`${API_URL}/properties/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du bien');
      }

      const updatedProperty = await response.json();
      setProperties(properties.map((p) => (p.id === id ? updatedProperty : p)));
      return updatedProperty;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteProperty = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/properties/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du bien');
      }

      setProperties(properties.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getPropertyById = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/properties/${id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du bien');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const searchProperties = async (criteria: any) => {
    try {
      const query = new URLSearchParams(criteria).toString();
      const response = await fetch(`${API_URL}/properties/search?${query}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }

      return await response.json();
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
