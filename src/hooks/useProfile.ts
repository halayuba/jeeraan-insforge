import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../contexts/ToastContext';

export function useProfile(userId?: string) {
  const { session, handleAuthError } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const effectiveUserId = userId || session?.user?.id;

  const query = useQuery({
    queryKey: ['profile', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return null;
      const { data, error } = await insforge.database
        .from('user_profiles')
        .select('*')
        .eq('user_id', effectiveUserId)
        .maybeSingle();

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data;
    },
    enabled: !!effectiveUserId,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!effectiveUserId) throw new Error('No user ID');
      const { data, error } = await insforge.database
        .from('user_profiles')
        .upsert({
          user_id: effectiveUserId,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', effectiveUserId] });
    },
    onError: (err) => {
      console.error('Error updating profile:', err);
      showToast('Failed to update profile', 'error');
    },
  });

  return {
    ...query,
    profile: query.data,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
