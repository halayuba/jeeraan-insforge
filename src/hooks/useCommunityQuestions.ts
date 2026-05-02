import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';

export function useCommunityQuestions() {
  const { handleAuthError, neighborhoodId } = useAuthStore();

  return useQuery({
    queryKey: ['community-questions', neighborhoodId],
    queryFn: async () => {
      const { data, error } = await insforge.database
        .from('questions')
        .select(`
          *,
          author:user_profiles(full_name, avatar_url, is_visible, anonymous_id)
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
}

export function useSubmitQuestion() {
  const queryClient = useQueryClient();
  const { handleAuthError, neighborhoodId, user } = useAuthStore();

  return useMutation({
    mutationFn: async (questionText: string) => {
      const { data, error } = await insforge.database
        .from('questions')
        .insert([{
          neighborhood_id: neighborhoodId,
          member_id: user?.id,
          question_text: questionText.trim(),
          is_public: false, // Default to private
        }])
        .select()
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }

      // Trigger notification edge function (Async)
      insforge.functions.invoke('notify-new-question', {
        body: {
          questionId: data.id,
          neighborhoodId: neighborhoodId,
          memberName: user?.full_name || 'A neighbor',
          questionSnippet: questionText.trim().substring(0, 100),
        }
      }).catch(err => console.error('Error triggering notification:', err));

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-questions', neighborhoodId] });
    },
  });
}
