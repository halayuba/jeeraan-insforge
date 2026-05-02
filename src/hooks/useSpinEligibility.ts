import { useQuery } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';

export function useSpinEligibility(userId: string | undefined, neighborhoodId: string | null) {
  const { userRole } = useAuthStore();

  return useQuery({
    queryKey: ['spinEligibility', userId, neighborhoodId],
    queryFn: async () => {
      if (!userId || !neighborhoodId) return { canSpin: false };
      
      if (userRole !== 'resident') {
        return { canSpin: false };
      }

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await insforge.database
        .from('daily_spins')
        .select('id')
        .eq('user_id', userId)
        .eq('neighborhood_id', neighborhoodId)
        .eq('spin_date', today)
        .maybeSingle();

      if (error) {
        console.error('Error checking spin eligibility:', error);
        return { canSpin: false };
      }
      
      return { canSpin: !data };
    },
    enabled: !!userId && !!neighborhoodId,
  });
}
