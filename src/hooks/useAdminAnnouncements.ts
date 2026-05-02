import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { Alert } from 'react-native';

export function useAdminAnnouncements(neighborhoodId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['adminAnnouncements', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      const { data, error } = await insforge.database
        .from('announcements')
        .select(`
          *,
          author:user_profiles(full_name, avatar_url)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((a: any) => ({
        ...a,
        author: Array.isArray(a.author) ? a.author[0] : a.author
      }));
    },
    enabled: !!neighborhoodId,
  });

  const approveAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await insforge.database
        .from('announcements')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAnnouncements', neighborhoodId] });
      Alert.alert('Success', 'Announcement approved and posted.');
    },
    onError: (err) => {
      console.error('Failed to approve announcement:', err);
      Alert.alert('Error', 'Failed to approve announcement.');
    }
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await insforge.database
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAnnouncements', neighborhoodId] });
      Alert.alert('Success', 'Announcement deleted.');
    },
    onError: (err) => {
      console.error('Failed to delete announcement:', err);
      Alert.alert('Error', 'Failed to delete announcement.');
    }
  });

  return {
    ...query,
    announcements: query.data || [],
    approveAnnouncement: approveAnnouncementMutation.mutateAsync,
    deleteAnnouncement: deleteAnnouncementMutation.mutateAsync,
  };
}
