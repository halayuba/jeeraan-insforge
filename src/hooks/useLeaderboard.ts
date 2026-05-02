import { useQuery } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';

export function useLeaderboard(neighborhoodId: string | null) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['leaderboard', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      
      const { data, error } = await insforge.database
        .from('user_neighborhoods')
        .select(`
          user_id,
          role,
          profiles:user_profiles (
            full_name,
            avatar_url,
            points,
            level,
            global_role
          )
        `)
        .eq('neighborhood_id', neighborhoodId)
        .in('role', ['resident', 'moderator']);

      if (error) {
        handleAuthError(error);
        throw error;
      }
      
      return (data || [])
        .map((item: any) => ({
          user_id: item.user_id,
          role: item.role,
          ...(Array.isArray(item.profiles) ? item.profiles[0] : item.profiles)
        }))
        .filter((m: any) => m.global_role !== 'super_admin')
        .sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
    },
    enabled: !!neighborhoodId,
  });
}
