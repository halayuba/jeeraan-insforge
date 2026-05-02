import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { Alert } from 'react-native';

export function useModerationQueue(neighborhoodId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['moderationQueue', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      const { data, error } = await insforge.database
        .from('image_moderation_queue')
        .select(`
          *,
          user:user_profiles!user_id(full_name)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!neighborhoodId,
  });

  const moderateImageMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => {
      const { error } = await insforge.database
        .from('image_moderation_queue')
        .update({ 
          status, 
          moderated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['moderationQueue', neighborhoodId] });
      Alert.alert('Success', `Image ${variables.status}`);
    },
    onError: (err) => {
      console.error('Failed to moderate image:', err);
      Alert.alert('Error', 'Failed to update moderation status');
    }
  });

  return {
    ...query,
    queue: query.data || [],
    moderateImage: moderateImageMutation.mutateAsync,
    isModerating: moderateImageMutation.isPending,
  };
}
