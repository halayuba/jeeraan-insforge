import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';

export function useWaitlistRequests(neighborhoodId: string | null, filter: string = 'All', sort: { field: string, direction: 'asc' | 'desc' }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['waitlistRequests', neighborhoodId, filter, sort],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      
      let q = insforge.database
        .from('waitlist_requests')
        .select('*')
        .eq('neighborhood_id', neighborhoodId);
      
      if (filter !== 'All') {
        q = q.or(`floorplan_interest.eq."${filter}",floorplan_interest.eq."Any of the above"`);
      }

      q = q.order(sort.field as any, { ascending: sort.direction === 'asc' });

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!neighborhoodId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string, status: string }) => {
      const { error } = await insforge.database
        .from('waitlist_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlistRequests', neighborhoodId] });
    },
  });

  return {
    ...query,
    requests: query.data || [],
    updateStatus: updateStatusMutation.mutateAsync,
  };
}
