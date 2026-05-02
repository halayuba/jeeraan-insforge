import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { Alert } from 'react-native';

export function useAllMembers(neighborhoodId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['allMembers', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      const { data, error } = await insforge.database
        .from('user_neighborhoods')
        .select(`
          user_id,
          role,
          is_blocked,
          joined_at,
          profile:user_profiles(full_name, phone, avatar_url, is_visible, anonymous_id)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((m: any) => ({
        ...m,
        profile: Array.isArray(m.profile) ? m.profile[0] : m.profile
      }));
    },
    enabled: !!neighborhoodId,
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ userId, isBlocked }: { userId: string, isBlocked: boolean }) => {
      const { error } = await insforge.database
        .from('user_neighborhoods')
        .update({ is_blocked: isBlocked })
        .eq('user_id', userId)
        .eq('neighborhood_id', neighborhoodId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allMembers', neighborhoodId] });
      Alert.alert('Success', `Member ${variables.isBlocked ? 'blocked' : 'unblocked'}.`);
    },
    onError: (err) => {
      console.error('Failed to toggle block:', err);
      Alert.alert('Error', 'Failed to update member status.');
    }
  });

  const promoteToModeratorMutation = useMutation({
    mutationFn: async (userId: string) => {
      // 1. Update role in user_neighborhoods
      const { error: roleError } = await insforge.database
        .from('user_neighborhoods')
        .update({ role: 'moderator' })
        .eq('user_id', userId)
        .eq('neighborhood_id', neighborhoodId);

      if (roleError) throw roleError;

      // 2. Clear eligibility flag
      const { error: flagError } = await insforge.database
        .from('user_profiles')
        .update({ eligible_for_moderator: false })
        .eq('user_id', userId);

      if (flagError) throw flagError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMembers', neighborhoodId] });
      queryClient.invalidateQueries({ queryKey: ['eligibleModerators', neighborhoodId] });
      Alert.alert('Success', 'User promoted to Moderator successfully.');
    },
    onError: (err) => {
      console.error('Failed to promote user:', err);
      Alert.alert('Error', 'Failed to promote user.');
    }
  });

  const eligibleModeratorsQuery = useQuery({
    queryKey: ['eligibleModerators', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      
      const { data: profileData, error: profileError } = await insforge.database
        .from('user_profiles')
        .select(`
          user_id,
          full_name,
          points,
          level,
          eligible_for_moderator
        `)
        .eq('eligible_for_moderator', true);

      if (profileError) throw profileError;

      const { data: memberData, error: memberError } = await insforge.database
        .from('user_neighborhoods')
        .select('user_id, role')
        .eq('neighborhood_id', neighborhoodId);
      
      if (memberError) throw memberError;

      const neighborhoodUserIds = (memberData || []).map(m => m.user_id);
      return (profileData || []).filter(u => 
        neighborhoodUserIds.includes(u.user_id) && 
        !(memberData || []).find(m => m.user_id === u.user_id && (m.role === 'admin' || m.role === 'moderator'))
      );
    },
    enabled: !!neighborhoodId,
  });

  return {
    ...query,
    members: query.data || [],
    toggleBlock: toggleBlockMutation.mutateAsync,
    promoteToModerator: promoteToModeratorMutation.mutateAsync,
    eligibleModerators: eligibleModeratorsQuery.data || [],
    isLoadingEligible: eligibleModeratorsQuery.isLoading,
  };
}
