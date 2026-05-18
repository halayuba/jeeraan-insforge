import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { Alert } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

export function useQuestions(neighborhoodId: string | null) {
  const queryClient = useQueryClient();
  const handleAuthError = useAuthStore(state => state.handleAuthError);

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

      if (error) {
        handleAuthError(error);
        throw error;
      }
      
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
      if (error) {
        handleAuthError(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
    onError: (err: any) => {
      console.error('Failed to toggle question status:', err);
      if (!err.message?.includes('JWT') && err.code !== 'PGRST301') {
        Alert.alert('Error', 'Failed to update status');
      }
    }
  });

  const saveResponseMutation = useMutation({
    mutationFn: async ({ id, answerText }: { id: string, answerText: string }) => {
      const { error } = await insforge.database
        .from('questions')
        .update({ answer_text: answerText.trim() })
        .eq('id', id);
      if (error) {
        handleAuthError(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      Alert.alert('Success', 'Response saved');
    },
    onError: (err: any) => {
      console.error('Failed to save response:', err);
      if (!err.message?.includes('JWT') && err.code !== 'PGRST301') {
        Alert.alert('Error', 'Failed to save response');
      }
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
