import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';
import { uploadImage as uploadImageUtil } from '../lib/upload';

export function useClassifieds(neighborhoodId: string | null) {
  const { handleAuthError, user } = useAuthStore();

  return useQuery({
    queryKey: ['classifieds', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];
      const { data, error } = await insforge.database
        .from('classified_ads')
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
      
      const formattedData = (data || []).map((ad: any) => ({
        ...ad,
        author: Array.isArray(ad.author) ? ad.author[0] : ad.author
      }));

      // Filter: Show all active/sold ads, but only show pending/inactive to the owner
      return formattedData.filter((ad: any) => 
        ad.status === 'active' || 
        ad.status === 'sold' || 
        ad.user_id === user?.id
      );
    },
    enabled: !!neighborhoodId,
  });
}

export function useClassifiedAd(id: string | string[] | undefined) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['classifiedAd', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await insforge.database
        .from('classified_ads')
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

export function useCreateClassifiedAd(neighborhoodId: string | null) {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      title,
      price,
      description,
      contactInfo,
      imageUri,
      imageBase64,
      fee,
      user,
      initPaymentSheet,
      presentPaymentSheet,
      onReward
    }: any) => {
      let uploadedImageUrl = null;

      // 1. Upload Image if present
      if (imageUri && user?.id) {
        const { url: newImageUrl, error: uploadError } = await uploadImageUtil(imageUri, {
          bucketName: 'classified-media',
          folderPath: 'classifieds',
          userId: user.id,
          neighborhoodId: neighborhoodId!,
          serviceType: 'classified_ad',
          base64: imageBase64
        });

        if (uploadError) throw new Error(uploadError);
        uploadedImageUrl = newImageUrl;
      }

      // 2. Handle Payment logic
      if (fee > 0) {
        // Create ad with pending_payment status
        const { data: pendingAd, error: pendingError } = await insforge.database
          .from('classified_ads')
          .insert([{
            user_id: user.id,
            neighborhood_id: neighborhoodId,
            title: title.trim(),
            price: price.trim(),
            price_numeric: parseFloat(price),
            description: description.trim(),
            contact_info: contactInfo.trim(),
            image_url: uploadedImageUrl,
            category: 'General',
            status: 'pending_payment'
          }])
          .select()
          .single();

        if (pendingError) {
          handleAuthError(pendingError);
          throw pendingError;
        }

        // Call edge function for Stripe
        const { data: paymentData, error: paymentFuncError } = await insforge.functions.invoke('create-ad-checkout-session', {
          body: {
            userId: user.id,
            neighborhoodId: neighborhoodId,
            price: parseFloat(price),
            adId: pendingAd.id,
            adTitle: title.trim()
          }
        });

        if (paymentFuncError) throw paymentFuncError;
        if (paymentData.success === false) throw new Error(paymentData.message || 'Payment initiation failed');

        const { error: initError } = await initPaymentSheet({
          merchantDisplayName: 'Jeeraan Neighborhood',
          paymentIntentClientSecret: paymentData.paymentIntentClientSecret,
          defaultBillingDetails: { name: user.email },
        });

        if (initError) throw initError;

        const { error: presentError } = await presentPaymentSheet();
        if (presentError) {
          if (presentError.code === 'Canceled') {
            throw new Error('PAYMENT_CANCELLED');
          }
          throw presentError;
        }
        
        return { success: true, mode: 'paid' };
      } else {
        // Free ad
        const { data: newAd, error: dbError } = await insforge.database
          .from('classified_ads')
          .insert([{
            user_id: user.id,
            neighborhood_id: neighborhoodId,
            title: title.trim(),
            price: price.trim(),
            price_numeric: parseFloat(price) || 0,
            description: description.trim(),
            contact_info: contactInfo.trim(),
            image_url: uploadedImageUrl,
            category: 'General',
            status: 'active'
          }])
          .select()
          .single();

        if (dbError) {
          handleAuthError(dbError);
          throw dbError;
        }

        // Award points
        try {
          const { data: rewardData } = await insforge.functions.invoke('award-points-v1', {
            body: {
              userId: user.id,
              actionType: 'classified_ad',
              neighborhoodId: neighborhoodId,
              entityId: newAd.id
            }
          });
          if (onReward) onReward(rewardData);
        } catch (err) {
          console.error('Failed to award points', err);
        }

        return { success: true, mode: 'free', ad: newAd };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classifieds', neighborhoodId] });
    },
  });
}

export function useDeleteClassifiedAd() {
  const queryClient = useQueryClient();
  const { handleAuthError, neighborhoodId } = useAuthStore();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await insforge.database
        .from('classified_ads')
        .delete()
        .eq('id', id);

      if (error) {
        handleAuthError(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classifieds', neighborhoodId] });
    },
  });
}

export function useUpdateClassifiedAd() {
  const queryClient = useQueryClient();
  const { handleAuthError, neighborhoodId } = useAuthStore();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string, [key: string]: any }) => {
      const { data, error } = await insforge.database
        .from('classified_ads')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classifieds', neighborhoodId] });
      queryClient.invalidateQueries({ queryKey: ['classifiedAd', variables.id] });
    },
  });
}
