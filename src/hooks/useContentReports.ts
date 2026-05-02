import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { Alert } from 'react-native';

export type ReportEntityType = 'classified_ad' | 'announcement' | 'forum_topic' | 'forum_reply' | 'grievance';

export function useContentReports(neighborhoodId: string | null, entityType?: ReportEntityType) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['contentReports', neighborhoodId, entityType],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      let dbQuery = insforge.database
        .from('content_reports')
        .select(`
          *,
          reporter:user_profiles!reporter_id(full_name)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (entityType) {
        dbQuery = dbQuery.eq('entity_type', entityType);
      }

      const { data, error } = await dbQuery;
      if (error) throw error;
      
      return (data || []).map((r: any) => ({
        ...r,
        reporter: Array.isArray(r.reporter) ? r.reporter[0] : r.reporter
      }));
    },
    enabled: !!neighborhoodId,
  });

  const dismissReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await insforge.database
        .from('content_reports')
        .update({ status: 'dismissed', updated_at: new Date().toISOString() })
        .eq('id', reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentReports', neighborhoodId] });
      Alert.alert('Success', 'Report dismissed.');
    },
    onError: (err) => {
      console.error('Failed to dismiss report:', err);
      Alert.alert('Error', 'Failed to dismiss report.');
    }
  });

  const deleteReportedAdMutation = useMutation({
    mutationFn: async ({ adId, reportId }: { adId: string, reportId: string }) => {
      // 1. Delete ad
      const { error: adError } = await insforge.database
        .from('classified_ads')
        .delete()
        .eq('id', adId);
      if (adError) throw adError;

      // 2. Resolve report
      const { error: reportError } = await insforge.database
        .from('content_reports')
        .update({ status: 'reviewed', updated_at: new Date().toISOString() })
        .eq('id', reportId);
      if (reportError) throw reportError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentReports', neighborhoodId] });
      queryClient.invalidateQueries({ queryKey: ['classifieds', neighborhoodId] });
      Alert.alert('Success', 'Ad deleted and report resolved.');
    },
    onError: (err) => {
      console.error('Failed to delete reported ad:', err);
      Alert.alert('Error', 'Failed to delete ad.');
    }
  });

  return {
    ...query,
    reports: query.data || [],
    dismissReport: dismissReportMutation.mutateAsync,
    deleteReportedAd: deleteReportedAdMutation.mutateAsync,
  };
}
