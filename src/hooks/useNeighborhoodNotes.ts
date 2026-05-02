import { useQuery } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';

export function useNeighborhoodNotes() {
  const { neighborhoodId, handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['neighborhood-notes', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];

      const { data, error } = await insforge.database
        .from('neighborhood_notes')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });

      if (error) {
        handleAuthError(error);
        throw error;
      }

      return data || [];
    },
    enabled: !!neighborhoodId,
  });
}
