import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { Alert } from 'react-native';

export function useNeighborhood(neighborhoodId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['neighborhood', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return null;
      const { data, error } = await insforge.database
        .from('neighborhoods')
        .select('*')
        .eq('id', neighborhoodId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!neighborhoodId,
  });

  const updateNeighborhoodMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await insforge.database
        .from('neighborhoods')
        .update(updates)
        .eq('id', neighborhoodId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhood', neighborhoodId] });
      Alert.alert('Success', 'Neighborhood settings updated.');
    },
    onError: (err) => {
      console.error('Failed to update neighborhood:', err);
      Alert.alert('Error', 'Failed to update settings.');
    }
  });

  return {
    ...query,
    neighborhood: query.data,
    updateNeighborhood: updateNeighborhoodMutation.mutateAsync,
    isUpdating: updateNeighborhoodMutation.isPending,
  };
}
