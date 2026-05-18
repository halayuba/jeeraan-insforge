import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { Alert } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

export function useBoardPositions(neighborhoodId: string | null, isOpenOnly?: boolean) {
  const queryClient = useQueryClient();
  const handleAuthError = useAuthStore(state => state.handleAuthError);

  const query = useQuery({
    queryKey: ['boardPositions', neighborhoodId, isOpenOnly],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      let dbQuery = insforge.database
        .from('board_positions')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: true });
      
      if (isOpenOnly) {
        dbQuery = dbQuery.eq('is_open', true);
      }
      
      const { data, error } = await dbQuery;
      
      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data || [];
    },
    enabled: !!neighborhoodId,
  });

  const addPositionMutation = useMutation({
    mutationFn: async ({ title, description }: { title: string, description: string }) => {
      const { data, error } = await insforge.database
        .from('board_positions')
        .insert([{
          neighborhood_id: neighborhoodId,
          title,
          description,
        }])
        .select()
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boardPositions', neighborhoodId] });
      Alert.alert('Success', 'Board position added');
    },
    onError: (err: any) => {
      console.error('Failed to add position:', err);
      if (!err.message?.includes('JWT') && err.code !== 'PGRST301') {
        Alert.alert('Error', 'Failed to add position');
      }
    }
  });

  const deletePositionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await insforge.database
        .from('board_positions')
        .delete()
        .eq('id', id);

      if (error) {
        handleAuthError(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boardPositions'] });
      Alert.alert('Success', 'Board position deleted');
    },
    onError: (err: any) => {
      console.error('Failed to delete position:', err);
      if (!err.message?.includes('JWT') && err.code !== 'PGRST301') {
        Alert.alert('Error', 'Failed to delete position');
      }
    }
  });

  return {
    ...query,
    positions: query.data || [],
    addPosition: addPositionMutation.mutateAsync,
    isAdding: addPositionMutation.isPending,
    deletePosition: deletePositionMutation.mutateAsync,
  };
}
