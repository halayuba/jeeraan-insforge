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
    mutationFn: async ({ request, adminName, neighborhoodName, adminId }: { request: any, adminName: string, neighborhoodName: string, adminId: string }) => {
      console.log(`[APPROVE] Starting approval for request ID: ${request.id}, Phone: ${request.phone}`);
      
      // 0. Check for existing active invite
      const { data: existingInvite } = await insforge.database
        .from('invites')
        .select('id')
        .eq('neighborhood_id', request.neighborhood_id)
        .eq('phone', request.phone)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .maybeSingle();

      if (existingInvite) {
        console.warn('[APPROVE] Active invite already exists for:', request.phone);
        throw new Error('An active invite already exists for this phone number.');
      }

      // 2. We generate an invite code
      const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`[APPROVE] Generated invite code: ${inviteCode}`);

      // 1. Mark request as approved
      const { error: updateError } = await insforge.database
        .from('join_requests')
        .update({ 
          status: 'approved', 
          updated_at: new Date().toISOString(),
          approval_method: 'twilio',
          approved_by: adminId,
          invite_code: inviteCode
        })
        .eq('id', request.id);
      
      if (updateError) {
        console.error('[APPROVE] Error updating join_requests:', updateError);
        throw updateError;
      }
        
      // 3. Insert invite into database
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const { error: inviteError } = await insforge.database
        .from('invites')
        .insert([{
          code: inviteCode,
          neighborhood_id: request.neighborhood_id,
          phone: request.phone,
          expires_at: expiresAt.toISOString(),
          created_by: adminId
        }]);

      if (inviteError) {
        console.error('[APPROVE] Error inserting invite:', inviteError);
        throw inviteError;
      }
      
      console.log(`[APPROVE] Invoking send-invite-sms for ${request.phone}...`);
        
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

      if (smsError) {
        console.warn('[APPROVE] send-invite-sms Edge Function returned error:', smsError);
      } else {
        console.log('[APPROVE] send-invite-sms Edge Function response:', smsData);
      }

      return { 
        smsSuccess: !smsError && smsData?.success, 
        inviteCode,
        errorMessage: smsError?.message || smsData?.error
      };
    },
    onSuccess: (data, variables) => {
      console.log(`[APPROVE SUCCESS] SMS Success: ${data.smsSuccess}, Code: ${data.inviteCode}`);
      queryClient.invalidateQueries({ queryKey: ['joinRequests', neighborhoodId] });
      if (!data.smsSuccess) {
        Alert.alert(
          'Request Approved (SMS Failed)',
          `The request was approved and code ${data.inviteCode} was generated, but the SMS notification failed to send.\n\nError: ${data.errorMessage || 'Unknown error'}\n\nPlease inform the resident manually if possible.`
        );
      } else {
        Alert.alert(
          'Invite Approved & Sent',
          `The invite has been approved and an SMS with code ${data.inviteCode} has been sent to ${variables.request.name}.`
        );
      }
    },
    onError: (err: any) => {
      console.error('[APPROVE ERROR] Full error object:', err);
      const message = err.message || 'Failed to approve request. Please try again.';
      Alert.alert('Error', message);
    }
  });

  const adminApproveMutation = useMutation({
    mutationFn: async ({ request, adminName, neighborhoodName, adminId }: { request: any, adminName: string, neighborhoodName: string, adminId: string }) => {
      console.log(`[ADMIN APPROVE] Starting manual approval for request ID: ${request.id}`);
      
      // 1. Check for existing active invite
      const { data: existingInvite } = await insforge.database
        .from('invites')
        .select('id')
        .eq('neighborhood_id', request.neighborhood_id)
        .eq('phone', request.phone)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .maybeSingle();

      if (existingInvite) {
        console.warn('[ADMIN APPROVE] Active invite already exists for:', request.phone);
        throw new Error('An active invite already exists for this phone number.');
      }

      // 2. Generate an invite code
      const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 3. Mark request as approved with manual method
      const { error: updateError } = await insforge.database
        .from('join_requests')
        .update({ 
          status: 'approved', 
          updated_at: new Date().toISOString(),
          approval_method: 'manual',
          approved_by: adminId,
          invite_code: inviteCode
        })
        .eq('id', request.id);
      
      if (updateError) throw updateError;
        
      // 4. Insert invite into database
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const { error: inviteError } = await insforge.database
        .from('invites')
        .insert([{
          code: inviteCode,
          neighborhood_id: request.neighborhood_id,
          phone: request.phone,
          expires_at: expiresAt.toISOString(),
          created_by: adminId
        }]);

      if (inviteError) throw inviteError;
      
      return { inviteCode };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['joinRequests', neighborhoodId] });
      Alert.alert('Success', 'Request approved manually. You can now copy the SMS invite from the Approved tab.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to approve request.');
    }
  });

  const removeRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await insforge.database
        .from('join_requests')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['joinRequests', neighborhoodId] });
    },
    onError: (err) => {
      Alert.alert('Error', 'Failed to remove request.');
    }
  });

  const declineMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log(`[DECLINE] Starting decline for request ID: ${id}`);
      const { error } = await insforge.database
        .from('join_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        console.error('[DECLINE] Error updating join_requests:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[DECLINE SUCCESS]');
      queryClient.invalidateQueries({ queryKey: ['joinRequests', neighborhoodId] });
    },
    onError: (err) => {
      console.error('[DECLINE ERROR]', err);
      Alert.alert('Error', 'Failed to decline request.');
    }
  });

  const sendProactiveInviteMutation = useMutation({
    mutationFn: async ({ name, phone, adminName, neighborhoodName, adminId }: { name: string, phone: string, adminName: string, neighborhoodName: string, adminId: string }) => {
      console.log(`[PROACTIVE] Sending proactive invite to: ${name} (${phone})`);
      
      // 1. Check if user is already a member of this neighborhood
      const { data: existingProfile } = await insforge.database
        .from('user_profiles')
        .select('user_id')
        .eq('phone', phone)
        .maybeSingle();

      if (existingProfile) {
        const { data: existingMembership } = await insforge.database
          .from('user_neighborhoods')
          .select('neighborhood_id')
          .eq('user_id', existingProfile.user_id)
          .eq('neighborhood_id', neighborhoodId)
          .maybeSingle();

        if (existingMembership) {
          console.warn('[PROACTIVE] User already a member:', phone);
          throw new Error('User is already a member of this neighborhood.');
        }
      }

      // 2. Check for existing active invite
      const { data: existingInvite } = await insforge.database
        .from('invites')
        .select('id')
        .eq('neighborhood_id', neighborhoodId)
        .eq('phone', phone)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .maybeSingle();

      if (existingInvite) {
        console.warn('[PROACTIVE] Active invite already exists for:', phone);
        throw new Error('An active invite already exists for this phone number.');
      }

      const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`[PROACTIVE] Generated invite code: ${inviteCode}`);
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const { error: inviteError } = await insforge.database
        .from('invites')
        .insert([{
          code: inviteCode,
          neighborhood_id: neighborhoodId,
          phone: phone,
          expires_at: expiresAt.toISOString(),
          created_by: adminId
        }]);

      if (inviteError) {
        console.error('[PROACTIVE] Error inserting invite:', inviteError);
        throw inviteError;
      }

      console.log(`[PROACTIVE] Invoking send-invite-sms for ${phone}...`);

      const { data: smsData, error: smsError } = await insforge.functions.invoke('send-invite-sms', {
        body: {
          phone: phone,
          inviteCode: inviteCode,
          neighborhoodName: neighborhoodName,
          adminName: adminName,
          residentName: name
        }
      });

      if (smsError) {
        console.warn('[PROACTIVE] send-invite-sms Edge Function returned error:', smsError);
      } else {
        console.log('[PROACTIVE] send-invite-sms Edge Function response:', smsData);
      }

      return { 
        smsSuccess: !smsError && smsData?.success, 
        inviteCode, 
        name,
        errorMessage: smsError?.message || smsData?.error 
      };
    },
    onSuccess: (data) => {
      console.log(`[PROACTIVE SUCCESS] SMS Success: ${data.smsSuccess}, Code: ${data.inviteCode}`);
      if (!data.smsSuccess) {
        Alert.alert(
          'Invite Created (SMS Failed)',
          `Invite code ${data.inviteCode} was created, but the SMS failed to send.\n\nError: ${data.errorMessage || 'Unknown error'}\n\nYou can still provide the code to ${data.name} manually.`
        );
      } else {
        Alert.alert('Success', `Invite sent to ${data.name} with code ${data.inviteCode}.`);
      }
    },
    onError: (err: any) => {
      console.error('[PROACTIVE ERROR] Full error object:', err);
      const message = err.message || 'Failed to generate invite. Please try again.';
      Alert.alert('Error', message);
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
    adminApprove: adminApproveMutation.mutateAsync,
    isAdminApproving: adminApproveMutation.isPending,
    removeRequest: removeRequestMutation.mutateAsync,
    isRemoving: removeRequestMutation.isPending,
    decline: declineMutation.mutateAsync,
    isDeclining: declineMutation.isPending,
    sendProactiveInvite: sendProactiveInviteMutation.mutateAsync,
    isSendingProactiveInvite: sendProactiveInviteMutation.isPending,
  };
}
