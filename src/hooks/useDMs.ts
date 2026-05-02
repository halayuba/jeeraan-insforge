import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';

export function useConversations() {
  const { user, neighborhoodId, handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['conversations', neighborhoodId, user?.id],
    queryFn: async () => {
      if (!user || !neighborhoodId) return [];
      
      const { data, error } = await insforge.database
        .from('conversations')
        .select(`
          *,
          participant_1:user_profiles!participant_1_id(full_name, avatar_url, is_visible, anonymous_id),
          participant_2:user_profiles!participant_2_id(full_name, avatar_url, is_visible, anonymous_id)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data || [];
    },
    enabled: !!user && !!neighborhoodId,
  });
}

export function useMessages(conversationId: string | null) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId || conversationId === 'new') return [];

      const { data, error } = await insforge.database
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data || [];
    },
    enabled: !!conversationId && conversationId !== 'new',
  });
}

export function useRecipient(recipientId: string | undefined, conversationId?: string | null) {
  const { user, handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['recipient', recipientId, conversationId],
    queryFn: async () => {
      if (recipientId) {
        const { data, error } = await insforge.database
          .from('user_profiles')
          .select('user_id, full_name, avatar_url, is_visible, anonymous_id')
          .eq('user_id', recipientId)
          .single();
        
        if (error) {
          handleAuthError(error);
          throw error;
        }
        return data;
      } else if (conversationId && conversationId !== 'new') {
        const { data: conv, error: convError } = await insforge.database
          .from('conversations')
          .select(`
              participant_1:user_profiles!participant_1_id(user_id, full_name, avatar_url, is_visible, anonymous_id),
              participant_2:user_profiles!participant_2_id(user_id, full_name, avatar_url, is_visible, anonymous_id)
          `)
          .eq('id', conversationId)
          .single();
        
        if (convError) {
          handleAuthError(convError);
          throw convError;
        }
        const c = conv as any;
        return c.participant_1.user_id === user?.id ? c.participant_2 : c.participant_1;
      }
      return null;
    },
    enabled: !!recipientId || (!!conversationId && conversationId !== 'new'),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user, neighborhoodId, handleAuthError } = useAuthStore();

  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      recipientId, 
      content, 
      attachmentUrl, 
      attachmentType 
    }: { 
      conversationId: string | null, 
      recipientId?: string, 
      content: string, 
      attachmentUrl?: string | null, 
      attachmentType?: string 
    }) => {
      if (!user || !neighborhoodId) throw new Error('Auth context missing');

      let currentConvId = conversationId;
      
      // Ensure conversation exists
      if (!currentConvId && recipientId) {
        const p1 = user.id < recipientId ? user.id : recipientId;
        const p2 = user.id < recipientId ? recipientId : user.id;

        const { data: newConv, error: convError } = await insforge.database
          .from('conversations')
          .insert([{
            participant_1_id: p1,
            participant_2_id: p2,
            neighborhood_id: neighborhoodId
          }])
          .select()
          .single();
        
        if (convError) throw convError;
        currentConvId = newConv.id;
      }

      if (!currentConvId) throw new Error('Failed to identify conversation');

      const { data: newMessage, error: sendError } = await insforge.database
        .from('messages')
        .insert([{
          conversation_id: currentConvId,
          sender_id: user.id,
          neighborhood_id: neighborhoodId,
          content: content.trim(),
          attachment_url: attachmentUrl,
          attachment_type: attachmentType
        }])
        .select()
        .single();

      if (sendError) {
        handleAuthError(sendError);
        throw sendError;
      }

      return { newMessage, conversationId: currentConvId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', neighborhoodId, user?.id] });
    },
  });
}
