import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { Alert } from 'react-native';

export function useJoinRequests(neighborhoodId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['joinRequests', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      const { data, error } = await insforge.database
        .from('join_requests')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!neighborhoodId,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ request, adminName, neighborhoodName }: { request: any, adminName: string, neighborhoodName: string }) => {
      // 1. Mark request as approved
      const { error: updateError } = await insforge.database
        .from('join_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', request.id);
      
      if (updateError) throw updateError;
        
      // 2. We generate an invite code
      const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 3. Insert invite into database
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const { error: inviteError } = await insforge.database
        .from('invites')
        .insert([{
          code: inviteCode,
          neighborhood_id: request.neighborhood_id,
          phone: request.phone,
          expires_at: expiresAt.toISOString()
        }]);

      if (inviteError) throw inviteError;
        
      // 4. Call Edge Function to send SMS
      const { data: smsData, error: smsError } = await insforge.functions.invoke('send-invite-sms', {
        body: {
          phone: request.phone,
          inviteCode: inviteCode,
          neighborhoodName: neighborhoodName,
          adminName: adminName,
          residentName: request.name
        }
      });

      return { smsSuccess: !smsError && smsData?.success, inviteCode };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['joinRequests', neighborhoodId] });
      if (!data.smsSuccess) {
        Alert.alert(
          'Request Approved (SMS Failed)',
          `The request was approved and code ${data.inviteCode} was generated, but the SMS notification failed to send. Please inform the resident manually if possible.`
        );
      } else {
        Alert.alert(
          'Invite Approved & Sent',
          `The invite has been approved and an SMS with code ${data.inviteCode} has been sent to ${variables.request.name}.`
        );
      }
    },
    onError: (err) => {
      console.error('Failed to approve request:', err);
      Alert.alert('Error', 'Failed to approve request. Please try again.');
    }
  });

  const declineMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await insforge.database
        .from('join_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['joinRequests', neighborhoodId] });
    },
    onError: (err) => {
      console.error('Failed to decline request:', err);
      Alert.alert('Error', 'Failed to decline request.');
    }
  });

  const sendProactiveInviteMutation = useMutation({
    mutationFn: async ({ name, phone, adminName, neighborhoodName }: { name: string, phone: string, adminName: string, neighborhoodName: string }) => {
      const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const { error: inviteError } = await insforge.database
        .from('invites')
        .insert([{
          code: inviteCode,
          neighborhood_id: neighborhoodId,
          phone: phone,
          expires_at: expiresAt.toISOString()
        }]);

      if (inviteError) throw inviteError;

      const { data: smsData, error: smsError } = await insforge.functions.invoke('send-invite-sms', {
        body: {
          phone: phone,
          inviteCode: inviteCode,
          neighborhoodName: neighborhoodName,
          adminName: adminName,
          residentName: name
        }
      });

      return { smsSuccess: !smsError && smsData?.success, inviteCode, name };
    },
    onSuccess: (data) => {
      if (!data.smsSuccess) {
        Alert.alert(
          'Invite Created (SMS Failed)',
          `Invite code ${data.inviteCode} was created, but the SMS failed to send. You can still provide the code to ${data.name} manually.`
        );
      } else {
        Alert.alert('Success', `Invite sent to ${data.name} with code ${data.inviteCode}.`);
      }
    },
    onError: (err) => {
      console.error('Failed to send proactive invite:', err);
      Alert.alert('Error', 'Failed to generate invite. Please try again.');
    }
  });

  return {
    ...query,
    requests: query.data || [],
    pendingRequests: (query.data || []).filter(r => r.status === 'pending'),
    approvedRequests: (query.data || []).filter(r => r.status === 'approved'),
    rejectedRequests: (query.data || []).filter(r => r.status === 'declined'),
    approve: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    decline: declineMutation.mutateAsync,
    isDeclining: declineMutation.isPending,
    sendProactiveInvite: sendProactiveInviteMutation.mutateAsync,
    isSendingProactiveInvite: sendProactiveInviteMutation.isPending,
  };
}
