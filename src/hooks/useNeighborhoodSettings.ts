import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';

export function useNeighborhoodSettings(neighborhoodId: string | null) {
  const { handleAuthError } = useAuthStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['neighborhoodSettings', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return null;
      const { data, error } = await insforge.database
        .from('neighborhood_settings')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .maybeSingle();

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data;
    },
    enabled: !!neighborhoodId,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!neighborhoodId) throw new Error('No neighborhood ID');
      const { data, error } = await insforge.database
        .from('neighborhood_settings')
        .update(updates)
        .eq('neighborhood_id', neighborhoodId)
        .select()
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoodSettings', neighborhoodId] });
    },
  });

  return {
    ...query,
    settings: query.data,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
