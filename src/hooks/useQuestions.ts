import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { Alert } from 'react-native';

export function useQuestions(neighborhoodId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['questions', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      const { data, error } = await insforge.database
        .from('questions')
        .select(`
          *,
          author:user_profiles(full_name, is_visible, anonymous_id)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((q: any) => ({
        ...q,
        author: Array.isArray(q.author) ? q.author[0] : q.author
      }));
    },
    enabled: !!neighborhoodId,
  });

  const togglePublicMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string, isPublic: boolean }) => {
      const { error } = await insforge.database
        .from('questions')
        .update({ is_public: isPublic })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', neighborhoodId] });
    },
    onError: (err) => {
      console.error('Failed to toggle question status:', err);
      Alert.alert('Error', 'Failed to update status');
    }
  });

  const saveResponseMutation = useMutation({
    mutationFn: async ({ id, answerText }: { id: string, answerText: string }) => {
      const { error } = await insforge.database
        .from('questions')
        .update({ answer_text: answerText.trim() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', neighborhoodId] });
      Alert.alert('Success', 'Response saved');
    },
    onError: (err) => {
      console.error('Failed to save response:', err);
      Alert.alert('Error', 'Failed to save response');
    }
  });

  return {
    ...query,
    questions: query.data || [],
    togglePublic: togglePublicMutation.mutateAsync,
    saveResponse: saveResponseMutation.mutateAsync,
    isSavingResponse: saveResponseMutation.isPending,
  };
}
