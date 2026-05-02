import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';

export function useEvents(status?: string) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['events', status],
    queryFn: async () => {
      let query = insforge.database
        .from('events')
        .select('*')
        .order('event_datetime', { ascending: status !== 'Past' });

      if (status && status !== 'All') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data || [];
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuthStore();

  return useMutation({
    mutationFn: async (eventData: any) => {
      const { data, error } = await insforge.database
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
