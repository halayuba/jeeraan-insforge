import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { Alert } from 'react-native';

export function usePolls(neighborhoodId: string | null, type?: 'general' | 'election' | 'all') {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['polls', neighborhoodId, type],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      let dbQuery = insforge.database
        .from('polls')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });
      
      if (type && type !== 'all') {
        dbQuery = dbQuery.eq('type', type);
      } else if (!type) {
        dbQuery = dbQuery.eq('type', 'general');
      }
      
      const { data, error } = await dbQuery;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!neighborhoodId,
  });

  const createPollMutation = useMutation({
    mutationFn: async ({ title, description, endTime, createdBy }: { title: string, description: string, endTime: string, createdBy: string }) => {
      const { data, error } = await insforge.database
        .from('polls')
        .insert([{
          neighborhood_id: neighborhoodId,
          title,
          description,
          end_time: endTime,
          created_by: createdBy,
          type: 'general'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', neighborhoodId] });
      Alert.alert('Success', 'General poll created');
    },
    onError: (err) => {
      console.error('Failed to create poll:', err);
      Alert.alert('Error', 'Failed to create poll');
    }
  });

  const deletePollMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await insforge.database
        .from('polls')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', neighborhoodId] });
    },
    onError: (err) => {
      console.error('Failed to delete poll:', err);
      Alert.alert('Error', 'Failed to delete poll');
    }
  });

  return {
    ...query,
    polls: query.data || [],
    createPoll: createPollMutation.mutateAsync,
    isCreating: createPollMutation.isPending,
    deletePoll: deletePollMutation.mutateAsync,
  };
}
