import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';

export function useForumTopics() {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['forum-topics'],
    queryFn: async () => {
      const { data, error } = await insforge.database
        .from('forum_posts')
        .select(`
          *,
          forum_replies (count),
          author:user_profiles(full_name, avatar_url, level, is_visible, anonymous_id, global_role),
          membership:user_neighborhoods!user_id(role)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        handleAuthError(error);
        throw error;
      }

      return (data || []).map((post: any) => ({
        ...post,
        author: Array.isArray(post.author) ? post.author[0] : post.author,
        authorNeighborhoodRole: Array.isArray(post.membership) ? post.membership[0]?.role : post.membership?.role
      }));
    },
  });
}

export function useForumTopic(id: string | string[] | undefined) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['forum-topic', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await insforge.database
        .from('forum_posts')
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

export function useForumReplies(postId: string | string[] | undefined) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['forum-replies', postId],
    queryFn: async () => {
      if (!postId) return [];
      const { data, error } = await insforge.database
        .from('forum_replies')
        .select(`
          *,
          author:user_profiles(full_name, avatar_url, is_visible, anonymous_id)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        handleAuthError(error);
        throw error;
      }

      return (data || []).map((reply: any) => ({
        ...reply,
        author: Array.isArray(reply.author) ? reply.author[0] : reply.author
      }));
    },
    enabled: !!postId,
  });
}

export function useCreateForumTopic() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuthStore();

  return useMutation({
    mutationFn: async (newPost: { title: string; content: string; category: string; user_id: string }) => {
      const { data, error } = await insforge.database
        .from('forum_posts')
        .insert([newPost])
        .select()
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-topics'] });
    },
  });
}

export function useCreateForumReply() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuthStore();

  return useMutation({
    mutationFn: async (newReply: { post_id: string | string[]; user_id: string; content: string }) => {
      const { data, error } = await insforge.database
        .from('forum_replies')
        .insert([newReply])
        .select()
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum-replies', variables.post_id] });
      queryClient.invalidateQueries({ queryKey: ['forum-topics'] });
    },
  });
}
