import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';

export function useInvites() {
  const { neighborhoodId, handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['join-requests', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      
      const { data, error } = await insforge.database
        .from('join_requests')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data || [];
    },
    enabled: !!neighborhoodId,
  });
}

export function useSubmitInviteRequest() {
  const queryClient = useQueryClient();
  const { neighborhoodId, session, handleAuthError } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      phone: string;
      email?: string | null;
    }) => {
      if (!neighborhoodId) throw new Error('Neighborhood context missing');

      const { data, error } = await insforge.database
        .from('join_requests')
        .insert([{
          neighborhood_id: neighborhoodId,
          name: payload.name.trim(),
          phone: payload.phone.trim(),
          email: payload.email?.trim() || null,
          status: 'pending',
          created_by: session?.user?.id
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
      queryClient.invalidateQueries({ queryKey: ['join-requests', neighborhoodId] });
    },
  });
}
