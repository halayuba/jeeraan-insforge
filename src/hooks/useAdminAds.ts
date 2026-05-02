import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { Alert } from 'react-native';

export function useAdminAds(neighborhoodId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['adminAds', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      const { data, error } = await insforge.database
        .from('advertisements')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!neighborhoodId,
  });

  const createAdMutation = useMutation({
    mutationFn: async ({ adData, imageUri }: { adData: any, imageUri: string | null }) => {
      let uploadedImageUrl = null;
      
      if (imageUri) {
        let fileExt = 'jpg';
        if (imageUri.includes('.') && !imageUri.startsWith('blob:') && !imageUri.startsWith('data:')) {
          fileExt = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
        }
        
        const fileName = `ad-${Date.now()}.${fileExt}`;
        const filePath = `ads/${fileName}`;
        
        const fileResponse = await fetch(imageUri);
        const blob = await fileResponse.blob();
        
        const { data: uploadData, error: uploadError } = await insforge.storage
          .from('ad-media')
          .upload(filePath, blob);

        if (uploadError) throw uploadError;
        uploadedImageUrl = uploadData?.url;
      }

      const { data, error } = await insforge.database
        .from('advertisements')
        .insert([{
          neighborhood_id: neighborhoodId,
          ...adData,
          image_url: uploadedImageUrl
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAds', neighborhoodId] });
      Alert.alert('Success', 'Advertisement created');
    },
    onError: (err) => {
      console.error('Failed to create advertisement:', err);
      Alert.alert('Error', 'Failed to create advertisement');
    }
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await insforge.database
        .from('advertisements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAds', neighborhoodId] });
    },
    onError: (err) => {
      console.error('Failed to delete advertisement:', err);
      Alert.alert('Error', 'Failed to delete advertisement');
    }
  });

  return {
    ...query,
    ads: query.data || [],
    createAd: createAdMutation.mutateAsync,
    isCreating: createAdMutation.isPending,
    deleteAd: deleteAdMutation.mutateAsync,
  };
}
