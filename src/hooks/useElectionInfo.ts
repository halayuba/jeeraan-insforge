import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { Alert } from 'react-native';

export function useElectionInfo(neighborhoodId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['electionInfo', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return null;
      const { data, error } = await insforge.database
        .from('neighborhood_election_info')
        .select('voting_date')
        .eq('neighborhood_id', neighborhoodId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!neighborhoodId,
  });

  const updateVotingDateMutation = useMutation({
    mutationFn: async (votingDate: string) => {
      const { error } = await insforge.database
        .from('neighborhood_election_info')
        .upsert({
          neighborhood_id: neighborhoodId,
          voting_date: votingDate,
        }, { onConflict: 'neighborhood_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['electionInfo', neighborhoodId] });
      Alert.alert('Success', 'Voting date updated successfully');
    },
    onError: (err) => {
      console.error('Failed to update voting date:', err);
      Alert.alert('Error', 'Failed to update voting date');
    }
  });

  return {
    ...query,
    electionInfo: query.data,
    updateVotingDate: updateVotingDateMutation.mutateAsync,
    isUpdating: updateVotingDateMutation.isPending,
  };
}
