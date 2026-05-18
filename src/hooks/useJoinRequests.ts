import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { Alert } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

export function useJoinRequests(neighborhoodId: string | null) {
  const queryClient = useQueryClient();
  const handleAuthError = useAuthStore(state => state.handleAuthError);

  const query = useQuery({
    queryKey: ['joinRequests', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      const { data, error } = await insforge.database
        .from('join_requests')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });
      
      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data || [];
    },
    enabled: !!neighborhoodId,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ request, adminName, neighborhoodName, adminId }: { request: any, adminName: string, neighborhoodName: string, adminId: string }) => {
      const sanitizedPhone = request.phone.replace(/[^\d+]/g, '');
      console.log(`[APPROVE] Starting approval for request ID: ${request.id}, Phone: ${sanitizedPhone}`);
      
      // 0. Check for existing active invite
      const { data: existingInvite, error: existingInviteError } = await insforge.database
        .from('invites')
        .select('id')
        .eq('neighborhood_id', request.neighborhood_id)
        .eq('phone', sanitizedPhone)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .maybeSingle();

      if (existingInviteError) {
        handleAuthError(existingInviteError);
        throw existingInviteError;
      }

      if (existingInvite) {
        console.warn('[APPROVE] Active invite already exists for:', sanitizedPhone);
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
        handleAuthError(updateError);
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
          phone: sanitizedPhone,
          expires_at: expiresAt.toISOString(),
          created_by: adminId
        }]);

      if (inviteError) {
        console.error('[APPROVE] Error inserting invite:', inviteError);
        handleAuthError(inviteError);
        throw inviteError;
      }
      
      console.log(`[APPROVE] Invoking send-invite-sms for ${sanitizedPhone}...`);
        
      // 4. Call Edge Function to send SMS
      const { data: smsData, error: smsError } = await insforge.functions.invoke('send-invite-sms', {
        body: {
          phone: sanitizedPhone,
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
      if (!err.message?.includes('JWT') && err.code !== 'PGRST301') {
        const message = err.message || 'Failed to approve request. Please try again.';
        Alert.alert('Error', message);
      }
    }
  });

  const adminApproveMutation = useMutation({
    mutationFn: async ({ request, adminName, neighborhoodName, adminId }: { request: any, adminName: string, neighborhoodName: string, adminId: string }) => {
      const sanitizedPhone = request.phone.replace(/[^\d+]/g, '');
      console.log(`[ADMIN APPROVE] Starting manual approval for request ID: ${request.id}, Phone: ${sanitizedPhone}`);
      
      // 1. Check for existing active invite
      const { data: existingInvite, error: existingInviteError } = await insforge.database
        .from('invites')
        .select('id')
        .eq('neighborhood_id', request.neighborhood_id)
        .eq('phone', sanitizedPhone)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .maybeSingle();

      if (existingInviteError) {
        handleAuthError(existingInviteError);
        throw existingInviteError;
      }

      if (existingInvite) {
        console.warn('[ADMIN APPROVE] Active invite already exists for:', sanitizedPhone);
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
      
      if (updateError) {
        handleAuthError(updateError);
        throw updateError;
      }
        
      // 4. Insert invite into database
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const { error: inviteError } = await insforge.database
        .from('invites')
        .insert([{
          code: inviteCode,
          neighborhood_id: request.neighborhood_id,
          phone: sanitizedPhone,
          expires_at: expiresAt.toISOString(),
          created_by: adminId
        }]);

      if (inviteError) {
        handleAuthError(inviteError);
        throw inviteError;
      }
      
      return { inviteCode };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['joinRequests', neighborhoodId] });
      Alert.alert('Success', 'Request approved manually. You can now copy the SMS invite from the Approved tab.');
    },
    onError: (err: any) => {
      if (!err.message?.includes('JWT') && err.code !== 'PGRST301') {
        Alert.alert('Error', err.message || 'Failed to approve request.');
      }
    }
  });

  const removeRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await insforge.database
        .from('join_requests')
        .delete()
        .eq('id', id);
      if (error) {
        handleAuthError(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['joinRequests'] });
      Alert.alert('Success', 'Request removed.');
    },
    onError: (err: any) => {
      if (!err.message?.includes('JWT') && err.code !== 'PGRST301') {
        Alert.alert('Error', 'Failed to remove request.');
      }
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
        handleAuthError(error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[DECLINE SUCCESS]');
      queryClient.invalidateQueries({ queryKey: ['joinRequests'] });
      Alert.alert('Success', 'Request declined.');
    },
    onError: (err: any) => {
      console.error('[DECLINE ERROR]', err);
      if (!err.message?.includes('JWT') && err.code !== 'PGRST301') {
        Alert.alert('Error', 'Failed to decline request.');
      }
    }
  });

  const sendProactiveInviteMutation = useMutation({
    mutationFn: async ({ name, phone, adminName, neighborhoodName, adminId }: { name: string, phone: string, adminName: string, neighborhoodName: string, adminId: string }) => {
      // Basic phone sanitization: strip non-digits except '+'
      const sanitizedPhone = phone.replace(/[^\d+]/g, '');
      console.log(`[PROACTIVE] Sending proactive invite to: ${name} (${sanitizedPhone})`);
      
      // 1. Check if user is already a member of this neighborhood
      const { data: existingProfile, error: existingProfileError } = await insforge.database
        .from('user_profiles')
        .select('user_id')
        .eq('phone', sanitizedPhone)
        .maybeSingle();

      if (existingProfileError) {
        handleAuthError(existingProfileError);
        throw existingProfileError;
      }

      if (existingProfile) {
        const { data: existingMembership, error: existingMembershipError } = await insforge.database
          .from('user_neighborhoods')
          .select('neighborhood_id')
          .eq('user_id', existingProfile.user_id)
          .eq('neighborhood_id', neighborhoodId)
          .maybeSingle();

        if (existingMembershipError) {
          handleAuthError(existingMembershipError);
          throw existingMembershipError;
        }

        if (existingMembership) {
          console.warn('[PROACTIVE] User already a member:', sanitizedPhone);
          throw new Error('User is already a member of this neighborhood.');
        }
      }

      // 2. Check for existing active invite
      const { data: existingInvite, error: existingInviteError } = await insforge.database
        .from('invites')
        .select('id')
        .eq('neighborhood_id', neighborhoodId)
        .eq('phone', sanitizedPhone)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .maybeSingle();

      if (existingInviteError) {
        handleAuthError(existingInviteError);
        throw existingInviteError;
      }

      if (existingInvite) {
        console.warn('[PROACTIVE] Active invite already exists for:', sanitizedPhone);
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
          phone: sanitizedPhone,
          expires_at: expiresAt.toISOString(),
          created_by: adminId
        }]);

      if (inviteError) {
        console.error('[PROACTIVE] Error inserting invite:', inviteError);
        handleAuthError(inviteError);
        throw inviteError;
      }

      console.log(`[PROACTIVE] Invoking send-invite-sms for ${sanitizedPhone}...`);

      const { data: smsData, error: smsError } = await insforge.functions.invoke('send-invite-sms', {
        body: {
          phone: sanitizedPhone,
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
      if (!err.message?.includes('JWT') && err.code !== 'PGRST301') {
        const message = err.message || 'Failed to generate invite. Please try again.';
        Alert.alert('Error', message);
      }
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
