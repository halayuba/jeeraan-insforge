import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { Alert } from 'react-native';

export function useAdminNotes(neighborhoodId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['adminNotes', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      const { data, error } = await insforge.database
        .from('neighborhood_notes')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!neighborhoodId,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (newNote: { title: string, message: string }) => {
      const { data, error } = await insforge.database
        .from('neighborhood_notes')
        .insert([{
          neighborhood_id: neighborhoodId,
          ...newNote
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotes', neighborhoodId] });
      Alert.alert('Success', 'Note created');
    },
    onError: (err) => {
      console.error('Failed to create note:', err);
      Alert.alert('Error', 'Failed to create note');
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await insforge.database
        .from('neighborhood_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotes', neighborhoodId] });
    },
    onError: (err) => {
      console.error('Failed to delete note:', err);
      Alert.alert('Error', 'Failed to delete note');
    }
  });

  return {
    ...query,
    notes: query.data || [],
    createNote: createNoteMutation.mutateAsync,
    isCreatingNote: createNoteMutation.isPending,
    deleteNote: deleteNoteMutation.mutateAsync,
  };
}
