import { useQuery } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';

export function useActiveMembersCount() {
  return useQuery({
    queryKey: ['activeMembersCount'],
    queryFn: async () => {
      const { count, error } = await insforge.database
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });
}
