import { useQuery } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';

export function useMemberSearch(neighborhoodId: string | null, query: string) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['member-search', neighborhoodId, query],
    queryFn: async () => {
      if (!neighborhoodId || query.length < 2) return [];

      const { data, error } = await insforge.database
        .from('user_neighborhoods')
        .select(`
          user_id,
          profiles:user_profiles(full_name, avatar_url, is_visible, anonymous_id, global_role)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .neq('user_id', user?.id)
        .ilike('user_profiles.full_name', `%${query}%`);

      if (error) throw error;
      
      return (data || [])
        .map((m: any) => ({
          ...m,
          profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
        }))
        .filter((m: any) => m.profiles?.global_role !== 'super_admin');
    },
    enabled: !!neighborhoodId && query.length >= 2,
  });
}
