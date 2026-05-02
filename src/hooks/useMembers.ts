import { useQuery } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';

export function useMembers(neighborhoodId: string | null) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['members', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      
      const { data, error } = await insforge.database
        .from('user_neighborhoods')
        .select(`
          user_id,
          role,
          profiles:user_profiles(full_name, avatar_url, is_visible, anonymous_id, global_role)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .in('role', ['resident', 'moderator']); // Only regular members and moderators

      if (error) {
        handleAuthError(error);
        throw error;
      }
      
      return (data || [])
        .map((m: any) => ({
          ...m,
          profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
        }))
        // Explicitly exclude any profile with global_role = 'super_admin' 
        // regardless of their local neighborhood role
        .filter((m: any) => m.profiles?.global_role !== 'super_admin');
    },
    enabled: !!neighborhoodId,
  });
}
