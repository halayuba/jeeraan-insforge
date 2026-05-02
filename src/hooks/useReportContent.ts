import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../contexts/ToastContext';

export type ReportEntityType = 'classified_ad' | 'announcement' | 'forum_topic' | 'forum_reply' | 'grievance';

export function useReportContent() {
  const { user, neighborhoodId } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      entityId, 
      entityType, 
      reason 
    }: { 
      entityId: string; 
      entityType: ReportEntityType; 
      reason: string 
    }) => {
      if (!user || !neighborhoodId) throw new Error('Auth context missing');

      const { error } = await insforge.database
        .from('content_reports')
        .insert({
          reporter_id: user.id,
          neighborhood_id: neighborhoodId,
          entity_type: entityType,
          entity_id: entityId,
          reason: reason.trim()
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      showToast('Content reported successfully. Thank you!', 'success');
      // Optionally invalidate reports if the user is an admin viewing them
      queryClient.invalidateQueries({ queryKey: ['content-reports', variables.entityType] });
    },
    onError: (err) => {
      console.error('Failed to report content:', err);
      showToast('Failed to submit report.', 'error');
    },
  });
}
