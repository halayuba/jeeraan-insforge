import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';

export function useAnnouncements(neighborhoodId: string | null) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['announcements', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      const { data, error } = await insforge.database
        .from('announcements')
        .select(`
          *,
          author:user_profiles(full_name, avatar_url, is_visible, anonymous_id)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });

      if (error) {
        handleAuthError(error);
        throw error;
      }

      return (data || []).map((a: any) => ({
        ...a,
        author: Array.isArray(a.author) ? a.author[0] : a.author
      }));
    },
    enabled: !!neighborhoodId,
  });
}

export function useAnnouncement(id: string | string[] | undefined) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['announcement', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await insforge.database
        .from('announcements')
        .select(`
          *,
          author:user_profiles(full_name, avatar_url, is_visible, anonymous_id)
        `)
        .eq('id', id)
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }

      return {
        ...data,
        author: Array.isArray(data.author) ? data.author[0] : data.author
      };
    },
    enabled: !!id,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const { handleAuthError, neighborhoodId } = useAuthStore();

  return useMutation({
    mutationFn: async (newAnnouncement: any) => {
      const { data, error } = await insforge.database
        .from('announcements')
        .insert([{
          ...newAnnouncement,
          neighborhood_id: neighborhoodId,
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
      queryClient.invalidateQueries({ queryKey: ['announcements', neighborhoodId] });
    },
  });
}
