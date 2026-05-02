import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';

export function useElections(neighborhoodId: string | null) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['elections', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      const { data, error } = await insforge.database
        .from('polls')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .eq('type', 'election')
        .order('created_at', { ascending: false });

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data || [];
    },
    enabled: !!neighborhoodId,
  });
}

export function useElectionCandidates(pollId: string | string[] | undefined) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['electionCandidates', pollId],
    queryFn: async () => {
      if (!pollId) return [];
      const { data, error } = await insforge.database
        .from('candidates')
        .select(`
          *,
          user_profiles(full_name, avatar_url)
        `)
        .eq('poll_id', pollId);

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return (data || []).map(c => ({
        ...c,
        user_profiles: Array.isArray(c.user_profiles) ? c.user_profiles[0] : c.user_profiles
      }));
    },
    enabled: !!pollId,
  });
}

export function useCandidateDetails(candidateId: string | string[] | undefined) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['candidateDetails', candidateId],
    queryFn: async () => {
      if (!candidateId) return null;
      
      const { data: candidate, error: candidateError } = await insforge.database
        .from('candidates')
        .select('*, user_profiles(full_name, avatar_url)')
        .eq('id', candidateId)
        .single();

      if (candidateError) {
        handleAuthError(candidateError);
        throw candidateError;
      }

      const { data: questions, error: questionsError } = await insforge.database
        .from('candidate_questions')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (questionsError) {
        handleAuthError(questionsError);
        throw questionsError;
      }

      return {
        ...candidate,
        user_profiles: Array.isArray(candidate.user_profiles) ? candidate.user_profiles[0] : candidate.user_profiles,
        questions: questions || []
      };
    },
    enabled: !!candidateId,
  });
}

export function useSubmitCandidateProfile() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuthStore();

  return useMutation({
    mutationFn: async (candidateData: any) => {
      const { data, error } = await insforge.database
        .from('candidates')
        .insert([candidateData])
        .select()
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['electionCandidates', variables.poll_id] });
    },
  });
}

export function useCastVote() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuthStore();

  return useMutation({
    mutationFn: async (voteData: { poll_id: string, candidate_id: string, user_id: string }) => {
      const { data, error } = await insforge.database
        .from('poll_votes')
        .insert([voteData])
        .select()
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pollDetails', variables.poll_id] });
    },
  });
}

export function usePollDetails(pollId: string | string[] | undefined) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['pollDetails', pollId],
    queryFn: async () => {
      if (!pollId) return null;
      const { data, error } = await insforge.database
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data;
    },
    enabled: !!pollId,
  });
}
