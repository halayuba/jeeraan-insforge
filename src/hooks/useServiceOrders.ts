import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insforge } from '../lib/insforge';
import { useAuthStore } from '../store/useAuthStore';

export function useServiceOrders() {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['service-orders'],
    queryFn: async () => {
      const { data, error } = await insforge.database
        .from('service_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        handleAuthError(error);
        throw error;
      }

      return data || [];
    },
  });
}

export function useServiceOrder(id: string | string[] | undefined) {
  const { handleAuthError } = useAuthStore();

  return useQuery({
    queryKey: ['service-order', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await insforge.database
        .from('service_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });
}

export function useSubmitServiceOrder() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuthStore();

  return useMutation({
    mutationFn: async (newOrder: any) => {
      const { data, error } = await insforge.database
        .from('service_orders')
        .insert([newOrder])
        .select()
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    },
  });
}

export function useServiceOrderFeedback() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuthStore();

  return useMutation({
    mutationFn: async ({ id, satisfaction_rating, feedback }: { id: string; satisfaction_rating: number; feedback: string }) => {
      const { data, error } = await insforge.database
        .from('service_orders')
        .update({ satisfaction_rating, feedback })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleAuthError(error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['service-order', data.id] });
    },
  });
}
