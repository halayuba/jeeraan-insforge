import { useQuery } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';

export function usePointsLog(userId: string | undefined, neighborhoodId: string | null) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['pointsLog', userId, neighborhoodId],
    queryFn: async () => {
      if (!userId || !neighborhoodId) return [];
      
      const { data, error } = await insforge.database
        .from('points_log')
        .select('*')
        .eq('user_id', userId)
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data || [];
    },
    enabled: !!userId && !!neighborhoodId,
  });
}
