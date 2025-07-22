import { useEffect, useState } from 'react';
import { Container } from '../types/Container';

interface ContainerResponse {
  containers: Container[];
  filter: string;
  states: string;
  total: number;
  filtered: number;
}

const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

export const useContainers = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [filterInfo, setFilterInfo] = useState<{ filter: string; states: string; total: number; filtered: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContainers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/api/containers`, {
        credentials: 'include',
        headers
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.containers) {
        setContainers(data.containers);
        setFilterInfo({
          filter: data.filter,
          states: data.states,
          total: data.total,
          filtered: data.filtered
        });
      } else {
        // Fallback for old API response format
        setContainers(Array.isArray(data) ? data : []);
        setFilterInfo(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch containers';
      if (errorMessage.includes('401')) {
        setError('Authentication required. Please login again.');
      } else {
        setError(errorMessage);
      }
      setContainers([]);
      setFilterInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
    
    // Refresh containers every 30 seconds
    const interval = setInterval(fetchContainers, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    containers,
    filterInfo,
    loading,
    error,
    refetch: fetchContainers
  };
};