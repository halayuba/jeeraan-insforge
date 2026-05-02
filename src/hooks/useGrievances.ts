import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';

export function useGrievances(status?: string) {
  const { handleAuthError, neighborhoodId } = useAuthStore();

  return useQuery({
    queryKey: ['grievances', neighborhoodId, status],
    queryFn: async () => {
      let query = insforge.database
        .from('grievances')
        .select(`
          *,
          users:user_profiles(username, full_name, avatar_url)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });

      if (status && status !== 'All') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        handleAuthError(error);
        throw error;
      }

      return (data || []).map((g: any) => ({
        ...g,
        users: Array.isArray(g.users) ? g.users[0] : g.users
      }));
    },
    enabled: !!neighborhoodId,
  });
}

export function useGrievance(id: string | string[] | undefined) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['grievance', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await insforge.database
        .from('grievances')
        .select(`
          *,
          users:user_profiles(username, full_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }

      return {
        ...data,
        users: Array.isArray(data.users) ? data.users[0] : data.users
      };
    },
    enabled: !!id,
  });
}

export function useGrievanceComments(grievanceId: string | string[] | undefined) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['grievance-comments', grievanceId],
    queryFn: async () => {
      if (!grievanceId) return [];
      const { data, error } = await insforge.database
        .from('grievance_comments')
        .select(`
          *,
          users:user_profiles(username, full_name, avatar_url)
        `)
        .eq('grievance_id', grievanceId)
        .order('created_at', { ascending: false });

      if (error) {
        handleAuthError(error);
        throw error;
      }

      return (data || []).map((c: any) => ({
        ...c,
        users: Array.isArray(c.users) ? c.users[0] : c.users
      }));
    },
    enabled: !!grievanceId,
  });
}

export function useCreateGrievance() {
  const queryClient = useQueryClient();
  const { handleAuthError, neighborhoodId, user } = useAuthStore();

  return useMutation({
    mutationFn: async (newGrievance: any) => {
      const { data, error } = await insforge.database
        .from('grievances')
        .insert([{
          ...newGrievance,
          neighborhood_id: neighborhoodId,
          user_id: user?.id,
        }])
        .select()
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grievances', neighborhoodId] });
    },
  });
}

export function useCreateGrievanceComment() {
  const queryClient = useQueryClient();
  const { handleAuthError, user } = useAuthStore();

  return useMutation({
    mutationFn: async ({ grievanceId, content }: { grievanceId: string; content: string }) => {
      const { data, error } = await insforge.database
        .from('grievance_comments')
        .insert([{
          grievance_id: grievanceId,
          user_id: user?.id,
          content,
        }])
        .select()
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['grievance-comments', variables.grievanceId] });
    },
  });
}

export function useIncrementGrievanceViewCount() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuthStore();

  return useMutation({
    mutationFn: async (id: string) => {
      // Try RPC first
      const { error: rpcError } = await insforge.database.rpc('increment_view_count', { row_id: id });
      
      if (rpcError) {
        // Fallback to manual update
        const { data: current } = await insforge.database
          .from('grievances')
          .select('views_count')
          .eq('id', id)
          .single();
        
        const { error: updateError } = await insforge.database
          .from('grievances')
          .update({ views_count: (current?.views_count || 0) + 1 })
          .eq('id', id);
          
        if (updateError) {
          handleAuthError(updateError);
          throw updateError;
        }
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['grievance', id] });
      queryClient.invalidateQueries({ queryKey: ['grievances'] });
    },
  });
}
